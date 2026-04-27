import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addMessage } from '../../store/slices/chatSlice';
import MessageBubble from './MessageBubble';
import './ChatPanel.css';

const ChatPanel = ({ sendTextInput, sessionId, lastResult }) => {
  const dispatch = useDispatch();
  const chat = useSelector((s) => s.chat);
  const settings = useSelector((s) => s.settings);
  const [localInput, setLocalInput] = useState('');
  const messagesEndRef = useRef(null);

  // Add ISL translation results as messages
  useEffect(() => {
    if (lastResult && lastResult.gesture && lastResult.gesture.is_confident && lastResult.translation) {
      dispatch(addMessage({
        type: 'isl',
        sign: lastResult.gesture.sign,
        emotion: lastResult.emotion ? lastResult.emotion.emotion : 'neutral',
        texts: lastResult.translation.texts,
        confidence: lastResult.gesture.confidence,
        isEmergency: lastResult.translation.is_emergency,
      }));
    }
  }, [lastResult, dispatch]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  const handleSend = () => {
    if (!localInput.trim()) return;
    dispatch(addMessage({
      type: 'text',
      text: localInput,
      language: settings.language,
      sender: 'hearing_user',
    }));
    sendTextInput(localInput);
    setLocalInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-panel glass-card">
        <div className="card-header">
          <span className="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Conversation
          </span>
          <span className="chat-count">{chat.messages.length} messages</span>
        </div>

        <div className="chat-messages">
          {chat.messages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <p className="chat-empty-title">No messages yet</p>
              <p className="chat-empty-desc">
                Sign language gestures will appear here as messages,
                or type a message to convert to ISL.
              </p>
            </div>
          ) : (
            chat.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} language={settings.language} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <input
            className="input chat-input"
            placeholder="Type a message..."
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            onKeyDown={handleKeyDown}
            id="chat-text-input"
          />
          <button
            className="btn btn-primary send-btn"
            onClick={handleSend}
            disabled={!localInput.trim()}
            id="chat-send-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;