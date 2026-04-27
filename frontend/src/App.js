import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import Header from './components/Common/Header';
import CameraView from './components/Camera/CameraView';
import TranslationPanel from './components/Translation/TranslationPanel';
import ChatPanel from './components/Chat/ChatPanel';
import LearningPanel from './components/Learning/LearningPanel';
import SettingsPanel from './components/Settings/SettingsPanel';
import AuthPanel from './components/Auth/AuthPanel';
import FacultyPanel from './components/Faculty/FacultyPanel';
import MeetingPanel from './components/Meeting/MeetingPanel';
import EmergencyAlert from './components/Emergency/EmergencyAlert';
import DisambiguationModal from './components/Disambiguation/DisambiguationModal';
import { useWebSocket } from './hooks/useWebSocket';
import { detectionEngine } from './services/detectionEngine';
import './App.css';

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('isl-user')); } catch { return null; }
  });
  const [activeTab, setActiveTab] = useState('translate');
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyData, setEmergencyData] = useState(null);
  const [showDisambiguation, setShowDisambiguation] = useState(false);
  const [disambiguationOptions, setDisambiguationOptions] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('isl-theme') || 'dark');
  const [clientResult, setClientResult] = useState(null);

  const {
    isConnected,
    sessionId,
    lastResult: backendResult,
    sendFrame,
    sendTextInput,
    sendReset,
    configure,
  } = useWebSocket();

  const lastResult = clientResult || backendResult;

  useEffect(() => {
    const unsub = detectionEngine.on('result', (data) => {
      setClientResult(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('isl-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    if (lastResult && lastResult.translation && lastResult.translation.is_emergency) {
      setEmergencyData(lastResult);
      setShowEmergency(true);
    }
  }, [lastResult]);

  useEffect(() => {
    if (lastResult && lastResult.gesture && lastResult.gesture.needs_disambiguation) {
      setDisambiguationOptions(lastResult.gesture.top_k || []);
      setShowDisambiguation(true);
    }
  }, [lastResult]);

  const handleLogout = () => {
    localStorage.removeItem('isl-user');
    setUser(null);
  };

  // Show auth screen if not logged in
  if (!user) {
    return (
      <div className="app">
        <div className="bg-blobs">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
        <AuthPanel onLogin={(u) => setUser(u)} />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <Header
        isConnected={isConnected || detectionEngine.isInitialized}
        sessionId={sessionId || (detectionEngine.isInitialized ? 'client' : null)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        user={user}
        onLogout={handleLogout}
      />

      <main className="app-main">
        {activeTab === 'translate' && (
          <div className="translate-layout two-panel">
            <CameraView
              sendFrame={sendFrame}
              isConnected={isConnected}
              lastResult={lastResult}
            />
            <TranslationPanel lastResult={lastResult} />
          </div>
        )}

        {activeTab === 'chat' && (
          <ChatPanel
            sendTextInput={sendTextInput}
            sessionId={sessionId}
            lastResult={lastResult}
          />
        )}

        {activeTab === 'learn' && (
          <LearningPanel lastResult={lastResult} />
        )}

        {activeTab === 'meeting' && (
          <MeetingPanel />
        )}

        {activeTab === 'faculty' && (
          <FacultyPanel />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel
            configure={configure}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}
      </main>

      {showEmergency && emergencyData && (
        <EmergencyAlert
          data={emergencyData}
          onDismiss={() => setShowEmergency(false)}
        />
      )}

      {showDisambiguation && (
        <DisambiguationModal
          options={disambiguationOptions}
          onSelect={(sign) => {
            setShowDisambiguation(false);
          }}
          onCancel={() => setShowDisambiguation(false)}
        />
      )}
    </div>
  );
}

export default App;