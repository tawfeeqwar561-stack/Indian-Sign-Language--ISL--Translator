/**
 * Web Worker for running client-side inference off the main thread.
 * Used when client-side TF.js models are loaded for offline mode.
 */

/* eslint-disable no-restricted-globals */

let model = null;

self.onmessage = async function (e) {
  const { type, data } = e.data;

  switch (type) {
    case 'LOAD_MODEL':
      try {
        // Import TF.js in worker context
        importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js');
        model = await self.tf.loadLayersModel(data.modelUrl);
        self.postMessage({ type: 'MODEL_LOADED', status: 'ok' });
      } catch (err) {
        self.postMessage({ type: 'MODEL_LOADED', status: 'error', error: err.message });
      }
      break;

    case 'PREDICT':
      if (!model) {
        self.postMessage({ type: 'PREDICTION', status: 'error', error: 'Model not loaded' });
        return;
      }
      try {
        const inputTensor = self.tf.tensor(data.input);
        const t0 = performance.now();
        const output = model.predict(inputTensor);
        const result = await output.data();
        const latency = performance.now() - t0;

        inputTensor.dispose();
        output.dispose();

        self.postMessage({
          type: 'PREDICTION',
          status: 'ok',
          result: Array.from(result),
          latency,
        });
      } catch (err) {
        self.postMessage({ type: 'PREDICTION', status: 'error', error: err.message });
      }
      break;

    case 'DISPOSE':
      if (model) {
        model.dispose();
        model = null;
      }
      self.postMessage({ type: 'DISPOSED' });
      break;

    default:
      break;
  }
};