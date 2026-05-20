import React from 'react';
import { HiOutlineSun, HiSun } from 'react-icons/hi2';
import { RiArchiveLine, RiArchiveFill } from 'react-icons/ri';
import { HiOutlineUser, HiUser } from 'react-icons/hi2';

const tabs = [
  { id: 'light', label: 'Light', Icon: HiOutlineSun, ActiveIcon: HiSun },
  { id: 'library', label: 'Library', Icon: RiArchiveLine, ActiveIcon: RiArchiveFill },
  { id: 'profile', label: 'Profile', Icon: HiOutlineUser, ActiveIcon: HiUser },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav style={{
      height: 'var(--nav-h)',
      background: 'rgba(8,8,8,0.95)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '0 8px',
      paddingBottom: 'env(safe-area-inset-bottom)',
      flexShrink: 0,
      zIndex: 100
    }}>
      {tabs.map(({ id, label, Icon, ActiveIcon }) => {
        const isActive = active === id;
        const IconComp = isActive ? ActiveIcon : Icon;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '8px 20px',
              background: 'none',
              border: 'none',
              color: isActive ? 'var(--text)' : 'var(--text3)',
              cursor: 'pointer',
              transition: 'color 0.2s',
              minWidth: 64
            }}
          >
            <IconComp size={22} />
            <div style={{
              width: 4, height: 4,
              borderRadius: '50%',
              background: 'var(--text)',
              opacity: isActive ? 1 : 0,
              transition: 'opacity 0.2s'
            }} />
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 600 : 500,
              letterSpacing: 0.3
            }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}