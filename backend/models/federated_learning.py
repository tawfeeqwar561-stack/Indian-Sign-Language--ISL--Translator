# Federated Learning Server
"""
Federated Learning Server.

Implements FedAvg aggregation so that user devices can improve
the gesture/emotion models without sharing raw data.

Architecture:
  1. Server holds the global model weights.
  2. Clients receive the global model, train locally, send weight deltas.
  3. Server averages the deltas (weighted by sample count) → new global.
  4. Repeat for N rounds.

In production, PySyft or TensorFlow Federated would be plugged in here;
this module provides a pure-Python reference implementation.
"""

import os
import copy
import json
import time
import logging
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class FederatedServer:
    """Central aggregation server for federated learning."""

    def __init__(self, config: dict):
        self.min_clients = config.get('FL_MIN_CLIENTS', 3)
        self.total_rounds = config.get('FL_ROUNDS', 10)
        self.strategy = config.get('FL_AGGREGATION_STRATEGY', 'fedavg')

        self.current_round = 0
        self.global_weights: Optional[List[np.ndarray]] = None
        self._client_updates: Dict[str, dict] = {}
        self._round_history: list = []

    def set_initial_weights(self, weights: List[np.ndarray]):
        """Set initial global model weights (from the pretrained model)."""
        self.global_weights = [w.copy() for w in weights]
        logger.info("FL server: initial weights set")

    def receive_client_update(self, client_id: str, weights: List[np.ndarray],
                               num_samples: int, metrics: dict = None):
        """Accept a weight update from one client."""
        self._client_updates[client_id] = {
            'weights': weights,
            'num_samples': num_samples,
            'metrics': metrics or {},
            'timestamp': time.time(),
        }
        logger.info(f"FL: received update from {client_id} "
                     f"({num_samples} samples). "
                     f"{len(self._client_updates)}/{self.min_clients} clients.")

        if len(self._client_updates) >= self.min_clients:
            return self._aggregate()
        return None

    def get_global_weights(self) -> Optional[List[np.ndarray]]:
        return self.global_weights

    def get_status(self) -> dict:
        return {
            'current_round': self.current_round,
            'total_rounds': self.total_rounds,
            'clients_this_round': len(self._client_updates),
            'min_clients': self.min_clients,
            'history': self._round_history[-10:],
        }

    # ── Private ──────────────────────────────────────────────

    def _aggregate(self) -> List[np.ndarray]:
        """FedAvg aggregation."""
        logger.info(f"FL: aggregating round {self.current_round + 1}")

        updates = list(self._client_updates.values())
        total_samples = sum(u['num_samples'] for u in updates)

        if total_samples == 0:
            logger.warning("FL: no samples, skipping")
            return self.global_weights

        # Weighted average
        new_weights = [np.zeros_like(w) for w in self.global_weights]
        for update in updates:
            weight_factor = update['num_samples'] / total_samples
            for i, w in enumerate(update['weights']):
                new_weights[i] += w * weight_factor

        self.global_weights = new_weights
        self.current_round += 1

        # Record history
        avg_metrics = {}
        for key in updates[0].get('metrics', {}):
            vals = [u['metrics'].get(key, 0) for u in updates]
            avg_metrics[key] = float(np.mean(vals))

        self._round_history.append({
            'round': self.current_round,
            'num_clients': len(updates),
            'total_samples': total_samples,
            'avg_metrics': avg_metrics,
            'timestamp': datetime.utcnow().isoformat(),
        })

        # Clear for next round
        self._client_updates.clear()
        logger.info(f"FL: round {self.current_round} complete, "
                     f"avg metrics: {avg_metrics}")
        return self.global_weights


class FederatedClient:
    """
    Runs on-device. Trains the local model on user data,
    then sends weight updates to the server.
    """

    def __init__(self, client_id: str, config: dict):
        self.client_id = client_id
        self.local_epochs = config.get('FL_LOCAL_EPOCHS', 5)
        self.local_data: list = []       # list of (x, y)
        self.local_weights: Optional[List[np.ndarray]] = None

    def add_training_sample(self, x: np.ndarray, y: int):
        """Buffer a new labelled sample collected on-device."""
        self.local_data.append((x, y))

    def set_global_weights(self, weights: List[np.ndarray]):
        """Download global model weights from server."""
        self.local_weights = [w.copy() for w in weights]

    def train_local(self, model) -> dict:
        """
        Fine-tune the model on local data.

        Args:
            model: a Keras model whose weights match self.local_weights

        Returns:
            dict with updated weights, num_samples, local metrics
        """
        if not self.local_data:
            return {'weights': self.local_weights, 'num_samples': 0, 'metrics': {}}

        # Apply global weights
        if self.local_weights:
            model.set_weights(self.local_weights)

        xs = np.array([x for x, _ in self.local_data], dtype=np.float32)
        ys = np.array([y for _, y in self.local_data], dtype=np.int32)

        history = model.fit(xs, ys, epochs=self.local_epochs,
                            batch_size=min(32, len(ys)), verbose=0)

        metrics = {k: float(v[-1]) for k, v in history.history.items()}

        return {
            'weights': model.get_weights(),
            'num_samples': len(self.local_data),
            'metrics': metrics,
        }

    def clear_data(self):
        self.local_data.clear()