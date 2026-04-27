import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setLanguage, setTtsEnabled, setEmergencyAlerts,
  setArOverlay, setCameraFps,
} from '../../store/slices/settingsSlice';
import './SettingsPanel.css';

const SettingsPanel = ({ configure, theme, onToggleTheme }) => {
  const dispatch = useDispatch();
  const settings = useSelector((s) => s.settings);

  const handleLanguageChange = (lang) => {
    dispatch(setLanguage(lang));
    if (configure) configure({ language: lang });
  };

  return (
    <div className="settings-container">
      <div className="settings-card glass-card">
        <div className="card-header">
          <span className="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1V15a2 2 0 0 1-2-2 2 2 0 0 1 2-2v-.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"></path>
            </svg>
            Settings
          </span>
        </div>
        <div className="card-body">

          {/* Appearance */}
          <section className="settings-section">
            <h3 className="settings-section-title">Appearance</h3>
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Theme</span>
                <span className="setting-desc">Toggle dark or light mode</span>
              </div>
              <button className="toggle-btn" onClick={onToggleTheme} id="settings-theme-toggle">
                <span className={`toggle-track ${theme === 'dark' ? 'active' : ''}`}>
                  <span className="toggle-thumb" />
                </span>
                <span className="toggle-label">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
            </div>
          </section>

          {/* Language */}
          <section className="settings-section">
            <h3 className="settings-section-title">Language</h3>
            <div className="language-options">
              {[
                { code: 'en', name: 'English' },
                { code: 'ta', name: 'Tamil' },
                { code: 'hi', name: 'Hindi' },
              ].map(({ code, name }) => (
                <button
                  key={code}
                  className={`lang-option ${settings.language === code ? 'active' : ''}`}
                  onClick={() => handleLanguageChange(code)}
                  id={`lang-option-${code}`}
                >
                  <span className="lang-name">{name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Features */}
          <section className="settings-section">
            <h3 className="settings-section-title">Features</h3>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Text-to-Speech</span>
                <span className="setting-desc">Speak translated text aloud</span>
              </div>
              <button
                className="toggle-btn"
                onClick={() => dispatch(setTtsEnabled(!settings.ttsEnabled))}
                id="settings-tts-toggle"
              >
                <span className={`toggle-track ${settings.ttsEnabled ? 'active' : ''}`}>
                  <span className="toggle-thumb" />
                </span>
              </button>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Emergency Alerts</span>
                <span className="setting-desc">Show alerts for emergency signs</span>
              </div>
              <button
                className="toggle-btn"
                onClick={() => dispatch(setEmergencyAlerts(!settings.emergencyAlerts))}
                id="settings-emergency-toggle"
              >
                <span className={`toggle-track ${settings.emergencyAlerts ? 'active' : ''}`}>
                  <span className="toggle-thumb" />
                </span>
              </button>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">AR Overlay</span>
                <span className="setting-desc">Show detection visuals on camera</span>
              </div>
              <button
                className="toggle-btn"
                onClick={() => dispatch(setArOverlay(!settings.arOverlay))}
                id="settings-ar-toggle"
              >
                <span className={`toggle-track ${settings.arOverlay ? 'active' : ''}`}>
                  <span className="toggle-thumb" />
                </span>
              </button>
            </div>
          </section>

          {/* Performance */}
          <section className="settings-section">
            <h3 className="settings-section-title">Performance</h3>
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Camera FPS</span>
                <span className="setting-desc">Frames sent per second ({settings.cameraFps})</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={settings.cameraFps}
                onChange={(e) => dispatch(setCameraFps(parseInt(e.target.value)))}
                className="speed-slider"
                id="settings-fps-slider"
              />
            </div>
          </section>

          {/* About */}
          <section className="settings-section about-section">
            <h3 className="settings-section-title">About</h3>
            <p className="about-text">
              AI-powered Indian Sign Language recognition and translation system with
              emotion-aware multilingual output and 3D avatar animation.
            </p>
            <p className="about-version">Version 1.0.0</p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;