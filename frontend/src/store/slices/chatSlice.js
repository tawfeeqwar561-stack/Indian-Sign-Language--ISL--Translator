import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],
    isRecording: false,
    inputText: '',
  },
  reducers: {
    addMessage(state, action) {
      state.messages.push({
        ...action.payload,
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
      });
      if (state.messages.length > 500) state.messages.shift();
    },
    setInputText(state, action) {
      state.inputText = action.payload;
    },
    setRecording(state, action) {
      state.isRecording = action.payload;
    },
    clearChat(state) {
      state.messages = [];
    },
  },
});

export const { addMessage, setInputText, setRecording, clearChat } = chatSlice.actions;
export default chatSlice.reducer;