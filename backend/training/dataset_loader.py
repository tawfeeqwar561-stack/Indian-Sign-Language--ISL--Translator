# Dataset utilities
"""
Dataset loading utilities for ISL gesture and emotion training.
"""

import os
import json
import random
import numpy as np
import tensorflow as tf
from typing import Tuple, List


class ISLGestureDataset:
    """
    Loads keypoint-sequence datasets for gesture recognition training.

    Expected directory structure:
        data/processed/gesture/
            ├── metadata.json       # {"classes": [...], "seq_len": 30, ...}
            ├── train/
            │   ├── sequences.npy   # shape [N, T, 226]
            │   └── labels.npy      # shape [N]
            ├── val/
            │   ├── sequences.npy
            │   └── labels.npy
            └── test/
                ├── sequences.npy
                └── labels.npy
    """

    def __init__(self, data_dir: str, seq_len: int = 30, feature_dim: int = 226):
        self.data_dir = data_dir
        self.seq_len = seq_len
        self.feature_dim = feature_dim

        meta_path = os.path.join(data_dir, 'metadata.json')
        if os.path.isfile(meta_path):
            with open(meta_path) as f:
                self.metadata = json.load(f)
        else:
            self.metadata = {}

    def load_split(self, split: str = 'train') -> Tuple[np.ndarray, np.ndarray]:
        """Load a data split ('train', 'val', 'test')."""
        split_dir = os.path.join(self.data_dir, split)
        seq_path = os.path.join(split_dir, 'sequences.npy')
        lbl_path = os.path.join(split_dir, 'labels.npy')

        if os.path.isfile(seq_path) and os.path.isfile(lbl_path):
            sequences = np.load(seq_path).astype(np.float32)
            labels = np.load(lbl_path).astype(np.int32)
            return sequences, labels

        # If files don't exist, generate synthetic data for development
        return self._generate_synthetic(split)

    def _generate_synthetic(self, split: str, n=500) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic data for testing the pipeline."""
        num_classes = self.metadata.get('num_classes', 200)
        if split == 'val':
            n = 100
        elif split == 'test':
            n = 100

        sequences = np.random.randn(n, self.seq_len, self.feature_dim).astype(np.float32)
        labels = np.random.randint(0, num_classes, size=n).astype(np.int32)
        return sequences, labels

    def as_tf_dataset(self, split: str, batch_size: int = 32,
                      shuffle: bool = True) -> tf.data.Dataset:
        """Return a tf.data.Dataset for training."""
        seqs, labels = self.load_split(split)
        ds = tf.data.Dataset.from_tensor_slices((seqs, labels))
        if shuffle:
            ds = ds.shuffle(buffer_size=min(len(labels), 10000))
        ds = ds.batch(batch_size).prefetch(tf.data.AUTOTUNE)
        return ds


class EmotionDataset:
    """
    Loads face-image datasets for emotion recognition training.

    Expected structure:
        data/processed/emotion/
            ├── metadata.json
            ├── train/
            │   ├── images.npy      # [N, 48, 48]
            │   └── labels.npy      # [N]
            └── ...
    """

    def __init__(self, data_dir: str, face_size: tuple = (48, 48)):
        self.data_dir = data_dir
        self.face_size = face_size

    def load_split(self, split: str = 'train') -> Tuple[np.ndarray, np.ndarray]:
        split_dir = os.path.join(self.data_dir, split)
        img_path = os.path.join(split_dir, 'images.npy')
        lbl_path = os.path.join(split_dir, 'labels.npy')

        if os.path.isfile(img_path) and os.path.isfile(lbl_path):
            images = np.load(img_path).astype(np.float32)
            labels = np.load(lbl_path).astype(np.int32)
            return images, labels

        return self._generate_synthetic(split)

    def _generate_synthetic(self, split: str, n=500) -> Tuple[np.ndarray, np.ndarray]:
        if split != 'train':
            n = 100
        images = np.random.rand(n, *self.face_size).astype(np.float32)
        labels = np.random.randint(0, 7, size=n).astype(np.int32)
        return images, labels

    def as_tf_dataset(self, split: str, batch_size: int = 32,
                      shuffle: bool = True) -> tf.data.Dataset:
        imgs, labels = self.load_split(split)
        # Expand to 3-channel
        imgs_3ch = np.stack([imgs] * 3, axis=-1)
        ds = tf.data.Dataset.from_tensor_slices((imgs_3ch, labels))
        if shuffle:
            ds = ds.shuffle(buffer_size=min(len(labels), 10000))
        ds = ds.batch(batch_size).prefetch(tf.data.AUTOTUNE)
        return ds