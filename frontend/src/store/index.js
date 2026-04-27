import { configureStore } from '@reduxjs/toolkit';
import translationReducer from './slices/translationSlice';
import emotionReducer from './slices/emotionSlice';
import settingsReducer from './slices/settingsSlice';
import chatReducer from './slices/chatSlice';

export const store = configureStore({
  reducer: {
    translation: translationReducer,
    emotion: emotionReducer,
    settings: settingsReducer,
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['translation/setLastResult'],
        ignoredPaths: ['translation.lastResult'],
      },
    }),
});