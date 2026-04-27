import { createSlice } from '@reduxjs/toolkit';

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    language: 'en',
    theme: 'dark',
    showAvatar: true,
    avatarSpeed: 1.0,
    cameraFps: 15,
    arOverlay: true,
    ttsEnabled: true,
    emergencyAlerts: true,
  },
  reducers: {
    setLanguage(state, action) {
      state.language = action.payload;
    },
    setTheme(state, action) {
      state.theme = action.payload;
    },
    setShowAvatar(state, action) {
      state.showAvatar = action.payload;
    },
    setAvatarSpeed(state, action) {
      state.avatarSpeed = action.payload;
    },
    setCameraFps(state, action) {
      state.cameraFps = action.payload;
    },
    setArOverlay(state, action) {
      state.arOverlay = action.payload;
    },
    setTtsEnabled(state, action) {
      state.ttsEnabled = action.payload;
    },
    setEmergencyAlerts(state, action) {
      state.emergencyAlerts = action.payload;
    },
    updateSettings(state, action) {
      Object.assign(state, action.payload);
    },
  },
});

export const {
  setLanguage, setTheme, setShowAvatar, setAvatarSpeed,
  setCameraFps, setArOverlay, setTtsEnabled, setEmergencyAlerts,
  updateSettings,
} = settingsSlice.actions;
export default settingsSlice.reducer;