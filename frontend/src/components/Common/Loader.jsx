import React from 'react';

const Loader = ({ text = 'Loading...' }) => (
  <div style={styles.container}>
    <div style={styles.spinner} />
    <p style={styles.text}>{text}</p>
  </div>
);

const styles = {
  container: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '40px', gap: '16px',
  },
  spinner: {
    width: '40px', height: '40px',
    border: '3px solid var(--border-color)',
    borderTopColor: 'var(--accent-primary)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  text: { fontSize: '14px', color: 'var(--text-secondary)' },
};

export default Loader;