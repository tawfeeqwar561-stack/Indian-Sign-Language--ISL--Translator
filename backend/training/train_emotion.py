# Emotion model training
"""
Training script for the Facial Emotion Recognition model.

Usage:
    python training/train_emotion.py --data_dir data/processed/emotion --epochs 30
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
from models.emotion_model import EmotionRecognizer
from training.dataset_loader import EmotionDataset
from training.losses import FocalLoss, compute_class_weights
from preprocessing.augmentation import FaceAugmentor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def train_emotion_model(args):
    config = get_config()

    dataset = EmotionDataset(data_dir=args.data_dir, face_size=config.EMOTION_FACE_SIZE)

    train_imgs, train_labels = dataset.load_split('train')
    val_imgs, val_labels = dataset.load_split('val')

    logger.info(f"Train: {train_imgs.shape}, Val: {val_imgs.shape}")

    # Augmentation
    if args.augment:
        augmentor = FaceAugmentor()
        aug_imgs = []
        aug_labels = []
        for i in range(len(train_imgs)):
            augmented = augmentor.augment(train_imgs[i])
            for img in augmented:
                aug_imgs.append(img)
                aug_labels.append(train_labels[i])
        train_imgs = np.array(aug_imgs, dtype=np.float32)
        train_labels = np.array(aug_labels, dtype=np.int32)
        logger.info(f"After augmentation: {train_imgs.shape}")

    # Expand to 3-channel
    if train_imgs.ndim == 3:
        train_imgs = np.stack([train_imgs] * 3, axis=-1)
        val_imgs = np.stack([val_imgs] * 3, axis=-1)

    # Build model
    recognizer = EmotionRecognizer(vars(config) if hasattr(config, '__dict__') else config.__dict__)
    model = recognizer.model

    if model is None:
        logger.error("Model not built")
        return

    class_weights_arr = compute_class_weights(train_labels, config.EMOTION_NUM_CLASSES)

    if args.loss == 'focal':
        loss_fn = FocalLoss(gamma=2.0, num_classes=config.EMOTION_NUM_CLASSES)
    else:
        loss_fn = 'sparse_categorical_crossentropy'

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=args.lr),
        loss=loss_fn,
        metrics=['accuracy'],
    )

    callbacks = [
        keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=8,
                                       restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5,
                                           patience=4, min_lr=1e-6),
        keras.callbacks.ModelCheckpoint(
            filepath=os.path.join(args.output_dir, 'emotion_best.keras'),
            monitor='val_accuracy', save_best_only=True),
    ]

    os.makedirs(args.output_dir, exist_ok=True)

    cw = {i: float(class_weights_arr[i]) for i in range(len(class_weights_arr))}

    history = model.fit(
        train_imgs, train_labels,
        validation_data=(val_imgs, val_labels),
        epochs=args.epochs,
        batch_size=args.batch_size,
        class_weight=cw,
        callbacks=callbacks,
        verbose=1,
    )

    model.save(os.path.join(args.output_dir, 'emotion_final.keras'))

    test_imgs, test_labels = dataset.load_split('test')
    if test_imgs.ndim == 3:
        test_imgs = np.stack([test_imgs] * 3, axis=-1)
    test_loss, test_acc = model.evaluate(test_imgs, test_labels, verbose=0)
    logger.info(f"Test accuracy: {test_acc:.4f}")

    import json
    with open(os.path.join(args.output_dir, 'history.json'), 'w') as f:
        json.dump({k: [float(v) for v in vs] for k, vs in history.history.items()}, f, indent=2)

    logger.info("Emotion model training complete")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--data_dir', default='data/processed/emotion')
    parser.add_argument('--output_dir', default='saved_models/emotion_training')
    parser.add_argument('--epochs', type=int, default=30)
    parser.add_argument('--batch_size', type=int, default=32)
    parser.add_argument('--lr', type=float, default=1e-3)
    parser.add_argument('--loss', default='focal', choices=['ce', 'focal'])
    parser.add_argument('--augment', action='store_true', default=True)
    args = parser.parse_args()
    train_emotion_model(args)