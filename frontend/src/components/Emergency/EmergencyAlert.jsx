import React, { useEffect } from 'react';
import './EmergencyAlert.css';

const EmergencyAlert = ({ data, onDismiss }) => {
  // Auto-dismiss after 10 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 10000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const sign = data?.gesture?.sign || 'Unknown';
  const texts = data?.translation?.texts || {};
  const emotion = data?.emotion?.emotion || 'urgency';

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="emergency-modal" onClick={(e) => e.stopPropagation()}>
        <div className="emergency-header">
          <span className="emergency-icon-large">🚨</span>
          <h2 className="emergency-title">Emergency Detected</h2>
        </div>

        <div className="emergency-body">
          <div className="emergency-sign">
            <span className="emergency-sign-label">Detected Sign:</span>
            <span className="emergency-sign-value">{sign.replace(/_/g, ' ').toUpperCase()}</span>
          </div>

          {texts.en && (
            <div className="emergency-translation">
              <p className="emergency-text">{texts.en}</p>
              {texts.hi && <p className="emergency-text-secondary">{texts.hi}</p>}
              {texts.ta && <p className="emergency-text-secondary">{texts.ta}</p>}
            </div>
          )}

          <p className="emergency-instruction">
            If this is a real emergency, please contact local emergency services immediately.
          </p>
        </div>

        <div className="emergency-actions">
          <button className="btn btn-danger btn-lg" onClick={onDismiss} id="emergency-dismiss-btn">
            Dismiss Alert
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAlert;