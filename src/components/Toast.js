import React from 'react';

export default function Toast({ show, message }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(var(--nav-h) + 24px)',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--surface3)',
      border: '1px solid var(--border2)',
      color: 'var(--text)',
      padding: '10px 22px',
      borderRadius: 20,
      fontSize: 14,
      fontWeight: 500,
      zIndex: 9999,
      animation: 'toast-in 0.3s ease',
      whiteSpace: 'nowrap',
      backdropFilter: 'blur(12px)'
    }}>
      {message}
    </div>
  );
}