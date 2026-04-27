import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import EmotionBadge from './EmotionBadge';
import ConfidenceBar from './ConfidenceBar';
import { speakBrowser } from '../../services/tts';
import { addWordToSequence, setFullSentence, clearSequence } from '../../store/slices/translationSlice';
import './TranslationPanel.css';

const TranslationPanel = ({ lastResult }) => {
  const dispatch = useDispatch();
  const translation = useSelector((s) => s.translation);
  const emotion = useSelector((s) => s.emotion);
  const settings = useSelector((s) => s.settings);
  const [videoUrl, setVideoUrl] = useState(null);

  // Use client-side result directly if available
  const currentSign = lastResult?.gesture?.is_confident ? lastResult.gesture.sign : translation.currentSign;
  const currentConfidence = lastResult?.gesture?.is_confident ? lastResult.gesture.confidence : translation.currentConfidence;
  const translatedTexts = lastResult?.translation?.texts || translation.translatedTexts;
  const isEmergency = lastResult?.translation?.is_emergency || translation.isEmergency;

  // Requirement 5 & 6: Update sequence and video when a new sign is detected
  useEffect(() => {
    if (lastResult?.gesture?.is_confident && lastResult.gesture.sign) {
      const sign = lastResult.gesture.sign;
      dispatch(addWordToSequence(sign));
      
      // Update video animation URL
      // We assume the backend serves videos at /api/dataset/<label>/0.mp4
      const baseUrl = window.location.origin.replace('3000', '5000');
      setVideoUrl(`${baseUrl}/api/dataset/${sign.toLowerCase()}/0.npy`.replace('.npy', '.mp4'));
    }
  }, [lastResult, dispatch]);

  // Trigger NLP translation when sequence grows
  useEffect(() => {
    if (translation.wordSequence.length > 0) {
      const fetchSentence = async () => {
        try {
          const baseUrl = window.location.origin.replace('3000', '5000');
          const res = await fetch(`${baseUrl}/api/nlp/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words: translation.wordSequence })
          });
          const data = await res.json();
          dispatch(setFullSentence(data.sentence));
        } catch (err) {
          console.error("NLP Error:", err);
        }
      };
      fetchSentence();
    }
  }, [translation.wordSequence, dispatch]);

  const handleSpeak = () => {
    const text = translation.fullSentence || translatedTexts[settings.language] || translatedTexts.en;
    if (text) {
      speakBrowser(text, settings.language);
    }
  };

  const confidence = currentConfidence || 0;
  const confidencePercent = Math.round(confidence * 100);
  const circumference = 2 * Math.PI * 24;
  const strokeDashoffset = circumference - (confidence * circumference);
  const ringColor = confidence >= 0.8 ? 'var(--success)' : confidence >= 0.6 ? 'var(--warning)' : 'var(--danger)';

  const langNames = { en: 'English', ta: 'Tamil', hi: 'Hindi' };

  return (
    <div className={`translation-card glass-card ${isEmergency ? 'emergency-card' : ''}`}>
      <div className="card-header">
        <span className="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Translation
        </span>
        <select
          className="select"
          value={settings.language}
          onChange={() => {}}
          id="translation-lang-select"
        >
          {Object.entries(langNames).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      <div className="card-body">
        {/* Requirement 5: Video Animation Output */}
        {currentSign && videoUrl && (
          <div className="dataset-animation animate-fade-in">
            <video 
              key={videoUrl}
              className="dataset-video"
              autoPlay 
              loop 
              muted 
              playsInline
              onError={() => setVideoUrl(null)}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
            <div className="dataset-label">{currentSign}</div>
          </div>
        )}

        {/* Current Sign Display */}
        <div className="sign-display">
          {currentSign ? (
            <div className="sign-recognized animate-bounce-in">
              <div className="sign-header">
                <div className="confidence-ring">
                  <svg width="60" height="60" viewBox="0 0 60 60">
                    <circle className="ring-bg" cx="30" cy="30" r="24" />
                    <circle
                      className="ring-fill"
                      cx="30" cy="30" r="24"
                      style={{
                        stroke: ringColor,
                        strokeDasharray: circumference,
                        strokeDashoffset: strokeDashoffset,
                      }}
                    />
                  </svg>
                  <div className="ring-text">{confidencePercent}%</div>
                </div>
                <div className="sign-info">
                  <h2 className="sign-text">
                    {isEmergency && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', color: 'var(--danger)' }}>
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                    )}
                    {currentSign.replace(/_/g, ' ')}
                  </h2>
                  <EmotionBadge
                    emotion={lastResult?.emotion?.emotion || emotion.currentEmotion}
                    confidence={lastResult?.emotion?.confidence || emotion.confidence}
                  />
                </div>
              </div>
              <ConfidenceBar value={confidence} />
            </div>
          ) : (
            <div className="sign-empty">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                  <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
                  <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
                  <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
                  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.82-2.82L7 15"></path>
                </svg>
              </div>
              <p className="empty-text">Show a sign to begin translation</p>
              <p className="empty-hint">Point your camera at a hand gesture</p>
            </div>
          )}
        </div>

        {/* Requirement 6: Sequence Builder & NLP Sentence */}
        <div className="sequence-builder animate-slide-up">
          <div className="sequence-header">
            <span className="sequence-title">Live Sequence</span>
            <button className="btn btn-ghost btn-xs" onClick={() => dispatch(clearSequence())}>Clear</button>
          </div>
          <div className="word-bubbles">
            {translation.wordSequence.map((word, idx) => (
              <span key={idx} className="word-bubble">{word}</span>
            ))}
            {translation.wordSequence.length === 0 && <span className="sentence-placeholder">Waiting for signs...</span>}
          </div>
          <div className="full-sentence-area">
            <div className="sequence-title">Formed Sentence</div>
            <div className="sentence-result">
              {translation.fullSentence || <span className="sentence-placeholder">Construction in progress...</span>}
            </div>
          </div>
        </div>

        {/* Speak Button */}
        {(currentSign || translation.fullSentence) && (
          <button
            className="btn btn-primary speak-btn"
            onClick={handleSpeak}
            id="speak-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
            Speak Sentence
          </button>
        )}
      </div>
    </div>
  );
};

export default TranslationPanel;