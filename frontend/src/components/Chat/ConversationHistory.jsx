import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ConversationHistory = ({ sessionId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    api.getConversation(sessionId)
      .then((data) => setHistory(data.messages || []))
      .catch((err) => console.error('History fetch error:', err))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading history...</p>;
  if (history.length === 0) return <p style={{ color: 'var(--text-secondary)' }}>No conversation yet.</p>;

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>Conversation History</h4>
      {history.map((msg) => (
        <div key={msg.id} style={styles.item}>
          <span style={styles.direction}>{msg.direction === 'isl_to_text' ? '🤟→📝' : '📝→🤟'}</span>
          <span style={styles.text}>
            {msg.recognized_sign || msg.input_text || 'Unknown'}
          </span>
          <span style={styles.time}>{msg.timestamp}</span>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: { maxHeight: '300px', overflowY: 'auto' },
  title: { fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' },
  item: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px',
    borderBottom: '1px solid var(--border-color)', fontSize: '13px',
  },
  direction: { fontSize: '16px' },
  text: { flex: 1, color: 'var(--text-primary)' },
  time: { fontSize: '11px', color: 'var(--text-secondary)' },
};

export default ConversationHistory;