# Custom loss functions
"""
Custom loss functions for training gesture and emotion models.
Handles class imbalance and emergency sign boosting.
"""

import numpy as np
import tensorflow as tf
from tensorflow import keras


class FocalLoss(keras.losses.Loss):
    """
    Focal Loss — down-weights easy examples, focuses on hard ones.
    Especially useful for rare emergency signs.
    
    FL(p_t) = -alpha_t * (1 - p_t)^gamma * log(p_t)
    """

    def __init__(self, gamma=2.0, alpha=None, num_classes=200, name='focal_loss'):
        super().__init__(name=name)
        self.gamma = gamma
        if alpha is not None:
            self.alpha = tf.constant(alpha, dtype=tf.float32)
        else:
            self.alpha = tf.ones(num_classes, dtype=tf.float32)

    def call(self, y_true, y_pred):
        y_pred = tf.clip_by_value(y_pred, 1e-7, 1.0 - 1e-7)
        y_true_one_hot = tf.one_hot(tf.cast(y_true, tf.int32),
                                     depth=tf.shape(y_pred)[-1])
        y_true_one_hot = tf.cast(y_true_one_hot, tf.float32)

        cross_entropy = -y_true_one_hot * tf.math.log(y_pred)
        weight = y_true_one_hot * tf.math.pow(1.0 - y_pred, self.gamma)
        focal = self.alpha * weight * cross_entropy
        return tf.reduce_mean(tf.reduce_sum(focal, axis=-1))


class EmergencyBoostedLoss(keras.losses.Loss):
    """
    Standard cross-entropy with extra weight on emergency-class signs.
    Ensures the model prioritises getting emergency signs right.
    """

    def __init__(self, emergency_indices: list, boost_factor=3.0,
                 num_classes=200, name='emergency_boosted_loss'):
        super().__init__(name=name)
        weights = np.ones(num_classes, dtype=np.float32)
        for idx in emergency_indices:
            if 0 <= idx < num_classes:
                weights[idx] = boost_factor
        self.class_weights = tf.constant(weights, dtype=tf.float32)

    def call(self, y_true, y_pred):
        y_pred = tf.clip_by_value(y_pred, 1e-7, 1.0 - 1e-7)
        y_true_int = tf.cast(tf.squeeze(y_true), tf.int32)
        sample_weights = tf.gather(self.class_weights, y_true_int)
        ce = keras.losses.sparse_categorical_crossentropy(y_true, y_pred)
        return tf.reduce_mean(ce * sample_weights)


def compute_class_weights(labels: np.ndarray, num_classes: int) -> np.ndarray:
    """Compute inverse-frequency class weights for imbalanced datasets."""
    counts = np.bincount(labels, minlength=num_classes).astype(np.float32)
    counts = np.maximum(counts, 1.0)  # avoid div-by-zero
    weights = counts.sum() / (num_classes * counts)
    return weights