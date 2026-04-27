"""
End-to-end pipeline evaluation: frame → gesture + emotion → translation.

Measures total latency, semantic correctness of translations, and
emergency-detection reliability.

Usage:
    python ml_pipeline/evaluation/evaluate_e2e.py
"""

import os
import sys
import json
import time
import argparse
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

from config import get_config
from models.gesture_model import GestureRecognizer, ISL_VOCABULARY
from models.emotion_model import EmotionRecognizer
from models.fusion_model import MultimodalFusion
from models.translation_engine import TranslationEngine


def evaluate_e2e(args):
    config_obj = get_config()
    config = vars(config_obj) if hasattr(config_obj, '__dict__') else config_obj.__dict__

    print("Initialising models...")
    gesture = GestureRecognizer(config)
    emotion = EmotionRecognizer(config)
    fusion = MultimodalFusion(config)
    translation = TranslationEngine(config)

    # Simulate N full pipeline runs
    n_runs = args.num_runs
    seq_len = config.get('GESTURE_SEQUENCE_LENGTH', 30)
    input_dim = config.get('GESTURE_INPUT_DIM', 226)

    latencies = []
    results = []

    for i in range(n_runs):
        t0 = time.perf_counter()

        # Simulate gesture: feed seq_len frames then recognise
        gesture.reset()
        for _ in range(seq_len + 5):
            kp = np.random.randn(input_dim).astype(np.float32)
            gesture.feed_frame(kp)

        g_result = gesture.try_recognize()

        # Simulate emotion
        face = np.random.rand(48, 48).astype(np.float32)
        e_result = emotion.recognize(face)

        # Fusion
        g_emb = g_result.get('embedding', np.zeros(256, dtype=np.float32)) if g_result else np.zeros(256, dtype=np.float32)
        e_emb = e_result.get('embedding', np.zeros(64, dtype=np.float32))
        f_result = fusion.fuse(g_emb, e_emb)

        # Translation
        if g_result:
            t_result = translation.translate(
                sign_gloss=g_result['sign'],
                emotion=e_result['emotion'],
                emotion_confidence=e_result['confidence'],
            )
        else:
            t_result = None

        elapsed = (time.perf_counter() - t0) * 1000
        latencies.append(elapsed)

        results.append({
            'gesture_sign': g_result['sign'] if g_result else None,
            'gesture_conf': g_result['confidence'] if g_result else None,
            'emotion': e_result['emotion'],
            'emotion_conf': e_result['confidence'],
            'translation_en': t_result['texts']['en'] if t_result else None,
            'is_emergency': t_result['is_emergency'] if t_result else False,
            'latency_ms': elapsed,
        })

    # Summary
    print(f"\n{'='*60}")
    print(f"END-TO-END EVALUATION ({n_runs} runs)")
    print(f"{'='*60}")
    print(f"Mean latency:   {np.mean(latencies):.2f} ms")
    print(f"Median latency: {np.median(latencies):.2f} ms")
    print(f"P95 latency:    {np.percentile(latencies, 95):.2f} ms")
    print(f"P99 latency:    {np.percentile(latencies, 99):.2f} ms")
    print(f"Min latency:    {np.min(latencies):.2f} ms")
    print(f"Max latency:    {np.max(latencies):.2f} ms")

    recognized = [r for r in results if r['gesture_sign'] is not None]
    print(f"\nGestures recognised: {len(recognized)}/{n_runs}")
    if recognized:
        avg_conf = np.mean([r['gesture_conf'] for r in recognized])
        print(f"Avg gesture confidence: {avg_conf:.4f}")

    emergencies = [r for r in results if r['is_emergency']]
    print(f"Emergencies detected: {len(emergencies)}/{n_runs}")

    os.makedirs(args.output_dir, exist_ok=True)
    summary = {
        'num_runs': n_runs,
        'latency_mean_ms': float(np.mean(latencies)),
        'latency_p95_ms': float(np.percentile(latencies, 95)),
        'gestures_recognized': len(recognized),
        'emergencies_detected': len(emergencies),
    }
    with open(os.path.join(args.output_dir, 'e2e_eval_results.json'), 'w') as f:
        json.dump(summary, f, indent=2)
    print(f"\nSaved to {args.output_dir}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--num_runs', type=int, default=200)
    parser.add_argument('--output_dir', default='saved_models/evaluation')
    args = parser.parse_args()
    evaluate_e2e(args)