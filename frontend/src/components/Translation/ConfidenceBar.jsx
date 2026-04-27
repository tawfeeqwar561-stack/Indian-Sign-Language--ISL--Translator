import React from 'react';

const ConfidenceBar = ({ value }) => {
  const percent = Math.round((value || 0) * 100);
  const level = percent >= 80 ? 'high' : percent >= 50 ? 'medium' : 'low';

  return (
    <div className="confidence-bar" title={`${percent}% confidence`}>
      <div
        className={`confidence-fill ${level}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

export default ConfidenceBar;