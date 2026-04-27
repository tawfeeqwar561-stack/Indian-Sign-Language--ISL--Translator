# Gesture model training
"""
Training script for the ISL Gesture Recognition model.

Usage:
    python training/train_gesture.py --data_dir data/processed/gesture --epochs 50
"""

import os
import sys
import argparse
import logging
import numpy as np
import tensorflow as tf
from tensorflow import keras

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import get_config
from models.gesture_model import GestureRecognizer
from training.dataset_loader import ISLGestureDataset
from training.losses import FocalLoss, EmergencyBoostedLoss, compute_class_weights
from preprocessing.augmentation import KeypointAugmentor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def train_gesture_model(args):
    """Main training loop for gesture recognition."""
    config = get_config()

    # Load dataset
    dataset = ISLGestureDataset(
        data_dir=args.data_dir,
        seq_len=config.GESTURE_SEQUENCE_LENGTH,
        feature_dim=config.GESTURE_INPUT_DIM,
    )

    train_seqs, train_labels = dataset.load_split('train')
    val_seqs, val_labels = dataset.load_split('val')

    logger.info(f"Train: {train_seqs.shape}, Val: {val_seqs.shape}")

    # Data augmentation
    if args.augment:
        augmentor = KeypointAugmentor()
        augmented_seqs = []
        augmented_labels = []
        for i in range(len(train_seqs)):
            pairs = augmentor.augment_sequence(train_seqs[i], train_labels[i])
            for seq, lbl in pairs:
                augmented_seqs.append(seq)
                augmented_labels.append(lbl)
        train_seqs = np.array(augmented_seqs, dtype=np.float32)
        train_labels = np.array(augmented_labels, dtype=np.int32)
        logger.info(f"After augmentation: {train_seqs.shape}")

    # Build model
    recognizer = GestureRecognizer(config.__dict__ if hasattr(config, '__dict__') else vars(config))
    model = recognizer.model

    if model is None:
        logger.error("Model not built (TFLite only mode)")
        return

    # Class weights for imbalanced data
    class_weights_arr = compute_class_weights(train_labels, config.GESTURE_NUM_CLASSES)

    # Emergency-sign indices
    vocab = recognizer.vocabulary
    emergency_indices = [i for i, v in enumerate(vocab) if v in config.EMERGENCY_SIGNS]

    # Loss
    if args.loss == 'focal':
        loss_fn = FocalLoss(gamma=2.0, num_classes=config.GESTURE_NUM_CLASSES)
    elif args.loss == 'emergency':
        loss_fn = EmergencyBoostedLoss(
            emergency_indices=emergency_indices,
            boost_factor=3.0,
            num_classes=config.GESTURE_NUM_CLASSES,
        )
    else:
        loss_fn = 'sparse_categorical_crossentropy'

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=args.lr),
        loss=loss_fn,
        metrics=['accuracy'],
    )

    # Callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_accuracy', patience=10, restore_best_weights=True
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss', factor=0.5, patience=5, min_lr=1e-6
        ),
        keras.callbacks.ModelCheckpoint(
            filepath=os.path.join(args.output_dir, 'gesture_best.keras'),
            monitor='val_accuracy', save_best_only=True,
        ),
        keras.callbacks.TensorBoard(
            log_dir=os.path.join(args.output_dir, 'logs'),
        ),
    ]

    os.makedirs(args.output_dir, exist_ok=True)

    # Train
    class_weight_dict = {i: float(class_weights_arr[i])
                         for i in range(len(class_weights_arr))}

    history = model.fit(
        train_seqs, train_labels,
        validation_data=(val_seqs, val_labels),
        epochs=args.epochs,
        batch_size=args.batch_size,
        class_weight=class_weight_dict,
        callbacks=callbacks,
        verbose=1,
    )

    # Save final model
    model.save(os.path.join(args.output_dir, 'gesture_final.keras'))

    # Evaluate on test set
    test_seqs, test_labels = dataset.load_split('test')
    test_loss, test_acc = model.evaluate(test_seqs, test_labels, verbose=0)
    logger.info(f"Test accuracy: {test_acc:.4f}, Test loss: {test_loss:.4f}")

    # Save training history
    import json
    hist_path = os.path.join(args.output_dir, 'training_history.json')
    with open(hist_path, 'w') as f:
        json.dump({k: [float(v) for v in vals]
                    for k, vals in history.history.items()}, f, indent=2)

    logger.info(f"Training complete. Models saved to {args.output_dir}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train ISL Gesture Model')
    parser.add_argument('--data_dir', type=str, default='data/processed/gesture')
    parser.add_argument('--output_dir', type=str, default='saved_models/gesture_training')
    parser.add_argument('--epochs', type=int, default=50)
    parser.add_argument('--batch_size', type=int, default=32)
    parser.add_argument('--lr', type=float, default=1e-3)
    parser.add_argument('--loss', type=str, default='focal',
                        choices=['ce', 'focal', 'emergency'])
    parser.add_argument('--augment', action='store_true', default=True)
    args = parser.parse_args()
    train_gesture_model(args)