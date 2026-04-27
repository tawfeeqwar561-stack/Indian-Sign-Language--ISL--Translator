"""
Convert Keras model to TensorFlow.js format for browser inference.

Usage:
    python ml_pipeline/export/export_tfjs.py \
        --model_path saved_models/gesture_training/gesture_final.keras \
        --output_dir frontend/tfjs_models/gesture_model
"""

import os
import sys
import argparse

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))


def convert_to_tfjs(model_path: str, output_dir: str, quantize: bool = False):
    """Convert a Keras .keras / .h5 model to TensorFlow.js LayersModel format."""
    try:
        import tensorflowjs as tfjs
    except ImportError:
        print("Install tensorflowjs:  pip install tensorflowjs")
        sys.exit(1)

    import tensorflow as tf

    model = tf.keras.models.load_model(model_path, compile=False)
    print(f"Loaded model from {model_path}")
    model.summary()

    os.makedirs(output_dir, exist_ok=True)

    quantization_dtype = 'uint16' if quantize else None

    tfjs.converters.save_keras_model(
        model,
        output_dir,
        quantization_dtype_map={quantization_dtype: '*'} if quantize else None,
    )

    # List output files
    total_size = 0
    for root, _, files in os.walk(output_dir):
        for fname in files:
            fpath = os.path.join(root, fname)
            fsize = os.path.getsize(fpath)
            total_size += fsize
            print(f"  {fname}: {fsize / 1024:.1f} KB")

    print(f"\nTotal size: {total_size / (1024 * 1024):.2f} MB")
    print(f"Saved TFJS model to {output_dir}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Convert Keras to TF.js')
    parser.add_argument('--model_path', required=True, help='Path to .keras model')
    parser.add_argument('--output_dir', required=True, help='TFJS output directory')
    parser.add_argument('--quantize', action='store_true', help='Apply uint16 quantization')
    args = parser.parse_args()
    convert_to_tfjs(args.model_path, args.output_dir, args.quantize)