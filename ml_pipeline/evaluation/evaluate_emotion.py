"""
Evaluation of the facial emotion recognition model.

Usage:
    python ml_pipeline/evaluation/evaluate_emotion.py \
        --model_path saved_models/emotion_training/emotion_final.keras \
        --data_dir data/processed/emotion
"""

import os
import sys
import json
import time
import argparse
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

from config import get_config
from training.dataset_loader import EmotionDataset


def evaluate(args):
    config = get_config()
    classes = config.EMOTION_CLASSES

    model = tf.keras.models.load_model(args.model_path, compile=False)
    dataset = EmotionDataset(data_dir=args.data_dir, face_size=config.EMOTION_FACE_SIZE)
    test_imgs, test_labels = dataset.load_split('test')

    if test_imgs.ndim == 3:
        test_imgs = np.stack([test_imgs] * 3, axis=-1)

    print(f"Test samples: {len(test_labels)}")

    t0 = time.perf_counter()
    preds = model.predict(test_imgs, batch_size=32, verbose=1)
    total_time = time.perf_counter() - t0

    pred_labels = np.argmax(preds, axis=1)
    pred_confs = np.max(preds, axis=1)

    acc = accuracy_score(test_labels, pred_labels)

    print(f"\n{'='*50}")
    print(f"EMOTION RECOGNITION EVALUATION")
    print(f"{'='*50}")
    print(f"Accuracy: {acc:.4f}")
    print(f"Avg confidence: {pred_confs.mean():.4f}")
    print(f"Per-sample latency: {total_time / len(test_labels) * 1000:.2f}ms")

    unique = np.unique(np.concatenate([test_labels, pred_labels]))
    names = [classes[i] if i < len(classes) else f"class_{i}" for i in unique]

    print("\nClassification Report:")
    print(classification_report(test_labels, pred_labels,
                                 labels=unique, target_names=names, zero_division=0))

    # Emergency emotions
    emerg_emotions = ['urgency', 'fear', 'anger']
    emerg_idx = [i for i, c in enumerate(classes) if c in emerg_emotions]
    emerg_mask = np.isin(test_labels, emerg_idx)
    if emerg_mask.sum() > 0:
        emerg_acc = accuracy_score(test_labels[emerg_mask], pred_labels[emerg_mask])
        print(f"Emergency-emotion accuracy: {emerg_acc:.4f} ({emerg_mask.sum()} samples)")

    os.makedirs(args.output_dir, exist_ok=True)
    results = {
        'accuracy': float(acc),
        'avg_confidence': float(pred_confs.mean()),
        'per_sample_latency_ms': float(total_time / len(test_labels) * 1000),
        'num_test_samples': int(len(test_labels)),
    }
    with open(os.path.join(args.output_dir, 'emotion_eval_results.json'), 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to {args.output_dir}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--model_path', required=True)
    parser.add_argument('--data_dir', default='data/processed/emotion')
    parser.add_argument('--output_dir', default='saved_models/evaluation')
    args = parser.parse_args()
    evaluate(args)