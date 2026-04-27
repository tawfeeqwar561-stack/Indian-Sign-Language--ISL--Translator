"""
Comprehensive evaluation of the gesture recognition model.

Produces: accuracy, per-class F1, confusion matrix, latency benchmarks.

Usage:
    python ml_pipeline/evaluation/evaluate_gesture.py \
        --model_path saved_models/gesture_training/gesture_final.keras \
        --data_dir data/processed/gesture
"""

import os
import sys
import json
import time
import argparse
import numpy as np
import tensorflow as tf
from sklearn.metrics import (classification_report, confusion_matrix,
                              accuracy_score, f1_score)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

from config import get_config
from models.gesture_model import ISL_VOCABULARY
from training.dataset_loader import ISLGestureDataset


def evaluate(args):
    config = get_config()

    # Load model
    model = tf.keras.models.load_model(args.model_path, compile=False)
    print(f"Model loaded from {args.model_path}")

    # Load test data
    dataset = ISLGestureDataset(
        data_dir=args.data_dir,
        seq_len=config.GESTURE_SEQUENCE_LENGTH,
        feature_dim=config.GESTURE_INPUT_DIM,
    )
    test_seqs, test_labels = dataset.load_split('test')
    print(f"Test samples: {len(test_labels)}")

    num_classes = config.GESTURE_NUM_CLASSES
    vocab = ISL_VOCABULARY[:num_classes]

    # Predict
    t0 = time.perf_counter()
    predictions = model.predict(test_seqs, batch_size=32, verbose=1)
    total_inference_time = time.perf_counter() - t0

    pred_labels = np.argmax(predictions, axis=1)
    pred_confidences = np.max(predictions, axis=1)

    # ── Metrics ──────────────────────────────────────────────

    accuracy = accuracy_score(test_labels, pred_labels)
    f1_macro = f1_score(test_labels, pred_labels, average='macro', zero_division=0)
    f1_weighted = f1_score(test_labels, pred_labels, average='weighted', zero_division=0)

    print(f"\n{'='*60}")
    print(f"GESTURE RECOGNITION EVALUATION RESULTS")
    print(f"{'='*60}")
    print(f"Accuracy:          {accuracy:.4f}")
    print(f"F1 (macro):        {f1_macro:.4f}")
    print(f"F1 (weighted):     {f1_weighted:.4f}")
    print(f"Avg confidence:    {pred_confidences.mean():.4f}")
    print(f"Total inference:   {total_inference_time:.2f}s")
    print(f"Per-sample latency:{total_inference_time / len(test_labels) * 1000:.2f}ms")

    # Per-class report (only for classes present in test data)
    unique_labels = np.unique(np.concatenate([test_labels, pred_labels]))
    target_names = [vocab[i] if i < len(vocab) else f"class_{i}" for i in unique_labels]

    report = classification_report(
        test_labels, pred_labels,
        labels=unique_labels,
        target_names=target_names,
        zero_division=0,
        output_dict=True,
    )

    print(f"\nPer-class report (top classes):")
    print(classification_report(
        test_labels, pred_labels,
        labels=unique_labels[:20],
        target_names=target_names[:20],
        zero_division=0,
    ))

    # Emergency sign accuracy
    emergency_signs = config.EMERGENCY_SIGNS
    emergency_indices = [i for i, v in enumerate(vocab) if v in emergency_signs]
    if emergency_indices:
        emerg_mask = np.isin(test_labels, emergency_indices)
        if emerg_mask.sum() > 0:
            emerg_acc = accuracy_score(test_labels[emerg_mask], pred_labels[emerg_mask])
            print(f"\nEmergency sign accuracy: {emerg_acc:.4f} "
                  f"({emerg_mask.sum()} samples)")

    # Confusion matrix
    cm = confusion_matrix(test_labels, pred_labels,
                          labels=list(range(num_classes)))

    # Latency benchmark (per-sample, repeated)
    latencies = []
    for i in range(min(100, len(test_seqs))):
        sample = test_seqs[i:i+1]
        t0 = time.perf_counter()
        _ = model.predict(sample, verbose=0)
        latencies.append((time.perf_counter() - t0) * 1000)

    print(f"\nLatency benchmark (100 samples):")
    print(f"  Mean:   {np.mean(latencies):.2f} ms")
    print(f"  Median: {np.median(latencies):.2f} ms")
    print(f"  P95:    {np.percentile(latencies, 95):.2f} ms")
    print(f"  P99:    {np.percentile(latencies, 99):.2f} ms")
    print(f"  Min:    {np.min(latencies):.2f} ms")
    print(f"  Max:    {np.max(latencies):.2f} ms")

    # Save results
    os.makedirs(args.output_dir, exist_ok=True)
    results = {
        'accuracy': float(accuracy),
        'f1_macro': float(f1_macro),
        'f1_weighted': float(f1_weighted),
        'avg_confidence': float(pred_confidences.mean()),
        'total_inference_seconds': float(total_inference_time),
        'per_sample_latency_ms': float(total_inference_time / len(test_labels) * 1000),
        'latency_stats': {
            'mean_ms': float(np.mean(latencies)),
            'median_ms': float(np.median(latencies)),
            'p95_ms': float(np.percentile(latencies, 95)),
            'p99_ms': float(np.percentile(latencies, 99)),
        },
        'num_test_samples': int(len(test_labels)),
        'per_class_report': report,
    }

    with open(os.path.join(args.output_dir, 'gesture_eval_results.json'), 'w') as f:
        json.dump(results, f, indent=2, default=str)

    np.save(os.path.join(args.output_dir, 'confusion_matrix.npy'), cm)
    print(f"\nResults saved to {args.output_dir}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--model_path', required=True)
    parser.add_argument('--data_dir', default='data/processed/gesture')
    parser.add_argument('--output_dir', default='saved_models/evaluation')
    args = parser.parse_args()
    evaluate(args)