import { createSlice } from '@reduxjs/toolkit';

const emotionSlice = createSlice({
  name: 'emotion',
  initialState: {
    currentEmotion: 'neutral',
    confidence: 0,
    probabilities: {},
    history: [],
  },
  reducers: {
    setEmotion(state, action) {
      const { emotion, confidence, probabilities } = action.payload;
      state.currentEmotion = emotion;
      state.confidence = confidence;
      state.probabilities = probabilities || {};
      state.history.push({ emotion, confidence, timestamp: Date.now() });
      if (state.history.length > 50) state.history.shift();
    },
    clearEmotionHistory(state) {
      state.history = [];
    },
  },
});

export const { setEmotion, clearEmotionHistory } = emotionSlice.actions;
export default emotionSlice.reducer;