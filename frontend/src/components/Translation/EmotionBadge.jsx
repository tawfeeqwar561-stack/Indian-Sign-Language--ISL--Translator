import React from 'react';

const EmotionBadge = ({ emotion, confidence, small }) => {
  if (!emotion) return null;

  const emojis = {
    happiness: '😊',
    sadness: '😢',
    anger: '😠',
    neutral: '😐',
    urgency: '⚡',
    fear: '😨',
    surprise: '😲',
  };

  return (
    <span
      className={`emotion-badge emotion-${emotion}`}
      style={small ? { fontSize: '10px', padding: '2px 8px' } : {}}
    >
      {emojis[emotion] || '❓'} {emotion}
      {confidence > 0 && !small && (
        <span style={{ opacity: 0.7, marginLeft: 4 }}>
          {Math.round(confidence * 100)}%
        </span>
      )}
    </span>
  );
};

export default EmotionBadge;