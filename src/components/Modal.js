import React, { useEffect } from 'react';

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          width: '100%',
          maxWidth: 480,
          padding: '8px 22px 40px',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        <div style={{
          width: 36, height: 4,
          background: 'var(--border2)',
          borderRadius: 2,
          margin: '12px auto 20px'
        }} />
        {title && (
          <h2 style={{
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 20,
            letterSpacing: -0.3
          }}>{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}