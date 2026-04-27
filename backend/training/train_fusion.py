# Fusion model training
"""
Training script for the Multimodal Fusion model.

Trains the fusion layer to combine gesture + emotion embeddings
in a way that improves downstream translation quality.

Usage:
    python training/train_fusion.py --epochs 20
"""

import os
import sys
import argparse
import logging
import numpy as np
import tensorflow as tf
from tensorflow import keras

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import get_config
from models.fusion_model import MultimodalFusion

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def train_fusion_model(args):
    config = get_config()

    gesture_dim = config.GESTURE_EMBEDDING_DIM
    emotion_dim = config.EMOTION_EMBEDDING_DIM
    fused_dim = config.FUSED_DIM

    # In production, embeddings come from the trained gesture/emotion models
    # running over the training set. Here we use synthetic data.
    n_train = 2000
    n_val = 400

    # Synthetic training data
    gesture_emb_train = np.random.randn(n_train, gesture_dim).astype(np.float32)
    emotion_emb_train = np.random.randn(n_train, emotion_dim).astype(np.float32)
    # Target: a "gold" fused representation (in practice, derived from
    # downstream translation quality or contrastive learning)
    target_train = np.random.randn(n_train, fused_dim).astype(np.float32)

    gesture_emb_val = np.random.randn(n_val, gesture_dim).astype(np.float32)
    emotion_emb_val = np.random.randn(n_val, emotion_dim).astype(np.float32)
    target_val = np.random.randn(n_val, fused_dim).astype(np.float32)

    # Build fusion model
    fusion = MultimodalFusion(vars(config) if hasattr(config, '__dict__') else config.__dict__)
    model = fusion.model

    model.compile(optimizer=keras.optimizers.Adam(args.lr), loss='mse')

    os.makedirs(args.output_dir, exist_ok=True)

    callbacks = [
        keras.callbacks.EarlyStopping(monitor='val_loss', patience=5,
                                       restore_best_weights=True),
        keras.callbacks.ModelCheckpoint(
            os.path.join(args.output_dir, 'fusion_best.keras'),
            monitor='val_loss', save_best_only=True),
    ]

    model.fit(
        [gesture_emb_train, emotion_emb_train], target_train,
        validation_data=([gesture_emb_val, emotion_emb_val], target_val),
        epochs=args.epochs,
        batch_size=args.batch_size,
        callbacks=callbacks,
        verbose=1,
    )

    model.save(os.path.join(args.output_dir, 'fusion_final.keras'))
    logger.info("Fusion model training complete")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output_dir', default='saved_models/fusion_training')
    parser.add_argument('--epochs', type=int, default=20)
    parser.add_argument('--batch_size', type=int, default=64)
    parser.add_argument('--lr', type=float, default=1e-3)
    args = parser.parse_args()
    train_fusion_model(args)