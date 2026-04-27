/**
 * Web Worker for frame preprocessing off the main thread.
 * Resizes and converts image data before sending to backend.
 */

/* eslint-disable no-restricted-globals */

self.onmessage = function (e) {
  const { type, data } = e.data;

  switch (type) {
    case 'PREPROCESS_FRAME': {
      const { imageData, targetWidth, targetHeight } = data;

      // Create offscreen canvas for resizing
      const canvas = new OffscreenCanvas(targetWidth || 640, targetHeight || 480);
      const ctx = canvas.getContext('2d');

      // Create ImageBitmap from raw data
      const bitmap = new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      );
      ctx.putImageData(bitmap, 0, 0);

      // Convert to JPEG blob
      canvas.convertToBlob({ type: 'image/jpeg', quality: 0.7 }).then((blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          self.postMessage({
            type: 'FRAME_READY',
            data: { base64: reader.result },
          });
        };
        reader.readAsDataURL(blob);
      });
      break;
    }

    default:
      break;
  }
};