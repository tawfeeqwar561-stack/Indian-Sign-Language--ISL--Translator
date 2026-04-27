/**
 * Federated Learning client stub.
 *
 * Collects user corrections locally, trains a small update, and
 * submits weight deltas to the FL server without sharing raw data.
 */

import api from './api';
import offlineStorage from './offlineStorage';

class FederatedClient {
  constructor() {
    this.localSamples = [];
    this.clientId = this._getClientId();
  }

  _getClientId() {
    let id = localStorage.getItem('fl_client_id');
    if (!id) {
      id = 'client_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('fl_client_id', id);
    }
    return id;
  }

  /** User corrects a gesture prediction → store as training sample. */
  addCorrectionSample(keypointSequence, correctLabel) {
    this.localSamples.push({
      features: keypointSequence,
      label: correctLabel,
      timestamp: Date.now(),
    });
  }

  /** When enough samples, trigger local training + server sync. */
  async trySync(minSamples = 20) {
    if (this.localSamples.length < minSamples) return false;

    try {
      // In a real implementation, we would:
      // 1. Load global model weights from server
      // 2. Fine-tune locally on this.localSamples
      // 3. Compute weight delta
      // 4. Submit delta to server
      await api.request('/federated/submit-update', {
        method: 'POST',
        body: JSON.stringify({
          client_id: this.clientId,
          num_samples: this.localSamples.length,
          // weights_delta would go here in production
        }),
      });

      this.localSamples = [];
      return true;
    } catch (err) {
      console.error('FL sync failed, queuing for later:', err);
      await offlineStorage.queueForSync({
        type: 'fl_update',
        client_id: this.clientId,
        num_samples: this.localSamples.length,
      });
      return false;
    }
  }
}

export const federatedClient = new FederatedClient();
export default federatedClient;