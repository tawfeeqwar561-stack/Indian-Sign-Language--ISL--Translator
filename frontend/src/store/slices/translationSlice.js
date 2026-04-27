import { createSlice } from '@reduxjs/toolkit';

const translationSlice = createSlice({
  name: 'translation',
  initialState: {
    currentSign: null,
    currentConfidence: 0,
    translatedTexts: {},
    isEmergency: false,
    detectionStatus: 'idle', // 'idle' | 'detecting' | 'recognized'
    history: [],
    wordSequence: [], // [ "I", "HELP", "NEED" ]
    fullSentence: "", // "I need help"
    fps: 0,
    latency: 0,
    lastResult: null,
    glossQueue: [], // for avatar animation
  },
  reducers: {
    addWordToSequence(state, action) {
      const word = action.payload;
      if (state.wordSequence[state.wordSequence.length - 1] !== word) {
        state.wordSequence.push(word);
      }
    },
    setFullSentence(state, action) {
      state.fullSentence = action.payload;
    },
    clearSequence(state) {
      state.wordSequence = [];
      state.fullSentence = "";
    },
    setLastResult(state, action) {
      const data = action.payload;
      state.lastResult = data;
      state.latency = data.pipeline_latency_ms || 0;
      state.detectionStatus = data.detection_status || 'idle';

      if (data.gesture && data.gesture.is_confident) {
        state.currentSign = data.gesture.sign;
        state.currentConfidence = data.gesture.confidence;
        state.glossQueue.push(data.gesture.sign);

        if (data.translation) {
          state.translatedTexts = data.translation.texts || {};
          state.isEmergency = data.translation.is_emergency || false;
        }

        state.history.push({
          sign: data.gesture.sign,
          confidence: data.gesture.confidence,
          emotion: data.emotion?.emotion || 'neutral',
          timestamp: data.timestamp,
          texts: data.translation?.texts,
        });

        // Keep history bounded
        if (state.history.length > 100) {
          state.history = state.history.slice(-100);
        }
      }
    },
    setFps(state, action) {
      state.fps = action.payload;
    },
    clearGlossQueue(state) {
      state.glossQueue = [];
    },
    resetTranslation(state) {
      state.currentSign = null;
      state.currentConfidence = 0;
      state.translatedTexts = {};
      state.isEmergency = false;
      state.detectionStatus = 'idle';
    },
  },
});

export const { 
  setLastResult, 
  setFps, 
  clearGlossQueue, 
  resetTranslation,
  addWordToSequence,
  setFullSentence,
  clearSequence
} = translationSlice.actions;
export default translationSlice.reducer;