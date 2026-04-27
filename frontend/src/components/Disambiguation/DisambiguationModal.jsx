import React from 'react';
import './DisambiguationModal.css';

const DisambiguationModal = ({ options, onSelect, onCancel }) => {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="disambiguation-modal modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="disambig-header">
          <h3 className="disambig-title">🤔 Which sign did you mean?</h3>
          <p className="disambig-desc">Multiple signs detected with similar confidence</p>
        </div>

        <div className="disambig-options">
          {options.map((opt, idx) => (
            <button
              key={idx}
              className="disambig-option"
              onClick={() => onSelect(opt.sign)}
              id={`disambig-option-${idx}`}
            >
              <span className="disambig-sign">{opt.sign?.replace(/_/g, ' ')}</span>
              <span className="disambig-conf">{Math.round((opt.confidence || 0) * 100)}%</span>
            </button>
          ))}
        </div>

        <div className="disambig-actions">
          <button className="btn btn-ghost" onClick={onCancel} id="disambig-cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisambiguationModal;