import React from 'react';

const MessageBubble = ({ message, language }) => {
  if (!message) return null;

  const isISL = message.type === 'isl';
  const isEmergency = message.isEmergency;
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`message-bubble ${message.type} ${isEmergency ? 'emergency' : ''}`}>
      {isISL ? (
        <>
          {isEmergency && <span style={{ marginRight: 4 }}>🚨</span>}
          <span className="bubble-sign">{message.sign?.replace(/_/g, ' ')}</span>
          {message.texts && message.texts[language] && (
            <p className="bubble-translation">{message.texts[language]}</p>
          )}
          <div className="bubble-meta">
            {message.emotion && (
              <span className={`emotion-badge emotion-${message.emotion}`} style={{ padding: '1px 6px', fontSize: '10px' }}>
                {message.emotion}
              </span>
            )}
            {message.confidence && (
              <span>{Math.round(message.confidence * 100)}%</span>
            )}
            <span>{time}</span>
          </div>
        </>
      ) : (
        <>
          <span className="bubble-text">{message.text}</span>
          <div className="bubble-meta">
            <span>{time}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default MessageBubble;