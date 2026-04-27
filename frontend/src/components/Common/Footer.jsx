import React from 'react';

const Footer = () => (
  <footer style={styles.footer}>
    <p>ISL Translation System — Empowering Communication 🤟</p>
  </footer>
);

const styles = {
  footer: {
    textAlign: 'center',
    padding: '12px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    borderTop: '1px solid var(--border-color)',
  },
};

export default Footer;