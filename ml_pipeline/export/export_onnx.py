"""
Convert Keras model to ONNX format for cross-platform inference.

Usage:
    python ml_pipeline/export/export_onnx.py \
        --model_path saved_models/gesture_training/gesture_final.keras \
        --output_path saved_models/gesture_model.onnx
"""

import os
import sys
import argparse
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))


def convert_to_onnx(model_path: str, output_path: str, opset: int = 13):
    """Convert Keras → SavedModel → ONNX."""
    import tensorflow as tf
    import tf2onnx

    model = tf.keras.models.load_model(model_path, compile=False)
    print(f"Loaded model from {model_path}")
    model.summary()

    # Determine input spec from model
    input_specs = []
    if isinstance(model.input, list):
        for inp in model.input:
            shape = [None if d is None else d for d in inp.shape]
            input_specs.append(tf.TensorSpec(shape, tf.float32, name=inp.name))
    else:
        shape = [None if d is None else d for d in model.input.shape]
        input_specs.append(tf.TensorSpec(shape, tf.float32, name=model.input.name))

    # Convert
    onnx_model, _ = tf2onnx.convert.from_keras(
        model,
        input_signature=input_specs,
        opset=opset,
        output_path=output_path,
    )

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Saved ONNX model: {output_path} ({size_mb:.2f} MB)")

    # Verify with ONNX Runtime
    try:
        import onnxruntime as ort
        session = ort.InferenceSession(output_path)
        inputs = session.get_inputs()
        outputs = session.get_outputs()
        print(f"\nONNX Inputs:")
        for inp in inputs:
            print(f"  {inp.name}: {inp.shape} ({inp.type})")
        print(f"ONNX Outputs:")
        for out in outputs:
            print(f"  {out.name}: {out.shape} ({out.type})")
    except Exception as e:
        print(f"ONNX verification skipped: {e}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Convert Keras to ONNX')
    parser.add_argument('--model_path', required=True)
    parser.add_argument('--output_path', required=True)
    parser.add_argument('--opset', type=int, default=13)
    args = parser.parse_args()
    convert_to_onnx(args.model_path, args.output_path, args.opset)