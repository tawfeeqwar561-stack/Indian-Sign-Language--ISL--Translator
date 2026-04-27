"""
Convert trained Keras models to TensorFlow Lite for mobile/on-device use.

Usage:
    python ml_pipeline/export/export_tflite.py \
        --model_path saved_models/gesture_training/gesture_final.keras \
        --output_path saved_models/gesture_model.tflite \
        --quantize
"""

import os
import sys
import argparse
import numpy as np
import tensorflow as tf

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))


def convert_to_tflite(model_path: str, output_path: str,
                       quantize: bool = False,
                       representative_data: np.ndarray = None):
    """Convert Keras model to TFLite."""

    model = tf.keras.models.load_model(model_path, compile=False)
    print(f"Loaded model from {model_path}")
    model.summary()

    converter = tf.lite.TFLiteConverter.from_keras_model(model)

    # Optimisations
    converter.optimizations = [tf.lite.Optimize.DEFAULT]

    if quantize:
        print("Applying full integer quantization...")
        converter.target_spec.supported_types = [tf.float16]

        if representative_data is not None:
            def representative_dataset():
                for i in range(min(200, len(representative_data))):
                    sample = representative_data[i:i+1].astype(np.float32)
                    # Handle multi-input models
                    if isinstance(model.input, list):
                        yield [sample[:, :s.shape[-1]] for s in model.input]
                    else:
                        yield [sample]

            converter.representative_dataset = representative_dataset
            converter.target_spec.supported_ops = [
                tf.lite.OpsSet.TFLITE_BUILTINS_INT8
            ]
            converter.inference_input_type = tf.uint8
            converter.inference_output_type = tf.uint8
            print("Full INT8 quantization enabled")
        else:
            print("Float16 quantization (no representative data)")

    tflite_model = converter.convert()

    os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)
    with open(output_path, 'wb') as f:
        f.write(tflite_model)

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Saved TFLite model: {output_path} ({size_mb:.2f} MB)")

    # Verify
    interpreter = tf.lite.Interpreter(model_path=output_path)
    interpreter.allocate_tensors()
    inp_details = interpreter.get_input_details()
    out_details = interpreter.get_output_details()
    print(f"Input:  {inp_details[0]['shape']} {inp_details[0]['dtype']}")
    print(f"Output: {out_details[0]['shape']} {out_details[0]['dtype']}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--model_path', required=True)
    parser.add_argument('--output_path', required=True)
    parser.add_argument('--quantize', action='store_true')
    args = parser.parse_args()
    convert_to_tflite(args.model_path, args.output_path, args.quantize)