import React, { useState } from 'react';
import './MeetingPanel.css';

const MeetingPanel = () => {
  const [isInCall, setIsInCall] = useState(false);

  return (
    <div className="meeting-container animate-fade-in">
      {!isInCall ? (
        <div className="meeting-lobby glass-card">
          <div className="lobby-header">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>
              <path d="m15 10 4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14v-4z"></path>
              <rect x="3" y="6" width="12" height="12" rx="2" ry="2"></rect>
            </svg>
            <h2>ISL Online Meeting</h2>
            <p>Connect with tutors and peers via high-fidelity video call</p>
          </div>
          
          <div className="lobby-controls">
            <div className="room-input">
              <label>Room ID</label>
              <input type="text" className="input" placeholder="e.g. isl-learning-101" />
            </div>
            <button className="btn btn-primary btn-lg w-full" onClick={() => setIsInCall(true)}>
              Join Meeting
            </button>
            <div className="meeting-hints">
              <p>• Ensure your hands are clearly visible</p>
              <p>• Use a well-lit environment for best recognition</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="meeting-active glass-card">
          <div className="video-grid">
            <div className="video-tile remote-video">
              <div className="video-placeholder">
                <span className="user-initial">I</span>
                <p>Instructor (ISL Specialist)</p>
              </div>
              <div className="sign-overlay">
                <span className="overlay-text">Detected: Hello</span>
              </div>
            </div>
            <div className="video-tile local-video">
              <div className="video-placeholder">
                <span className="user-initial">Y</span>
                <p>You</p>
              </div>
            </div>
          </div>
          
          <div className="meeting-controls-bar">
            <button className="btn btn-icon btn-ghost"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg></button>
            <button className="btn btn-icon btn-ghost"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 10 4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14v-4z"></path><rect x="3" y="6" width="12" height="12" rx="2" ry="2"></rect></svg></button>
            <button className="btn btn-icon btn-danger" onClick={() => setIsInCall(false)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6.13-6.13A19.79 19.79 0 0 1 2 5.18 2 2 0 0 1 4 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path></svg></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingPanel;
