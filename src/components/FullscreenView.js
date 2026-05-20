import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HiArrowsPointingIn } from 'react-icons/hi2';

export default function FullscreenView({ color, onExit }) {
  const [showUI, setShowUI] = useState(false);
  const timerRef = useRef(null);
  const lastTap = useRef(0);

  const hideUI = useCallback(() => {
    setShowUI(false);
  }, []);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 350) {
      onExit();
      return;
    }
    lastTap.current = now;

    if (!showUI) {
      setShowUI(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(hideUI, 3000);
    } else {
      hideUI();
    }
  }, [showUI, hideUI, onExit]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  return (
    <div
      onClick={handleTap}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: `rgb(${color.r},${color.g},${color.b})`,
        transition: 'background 0.3s ease',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: 50
      }}
    >
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        fontSize: 13,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.7)',
        background: 'rgba(0,0,0,0.25)',
        backdropFilter: 'blur(8px)',
        padding: '6px 12px',
        borderRadius: 8,
        opacity: showUI ? 1 : 0,
        transition: 'opacity 0.3s',
        pointerEvents: 'none'
      }}>
        {color.name}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onExit(); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 16,
          padding: '12px 24px',
          color: 'white',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          opacity: showUI ? 1 : 0,
          transition: 'opacity 0.3s',
          pointerEvents: showUI ? 'all' : 'none',
          fontFamily: 'var(--font)'
        }}
      >
        <HiArrowsPointingIn size={18} />
        Exit Fullscreen
      </button>
    </div>
  );
}