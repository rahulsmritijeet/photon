import React, { useState } from 'react';
import BottomNav from '../components/BottomNav';
import LightScreen from './LightScreen';
import LibraryScreen from './LibraryScreen';
import ProfileScreen from './ProfileScreen';
import FullscreenView from '../components/FullscreenView';
import { useApp } from '../App';

export default function MainApp() {
  const [screen, setScreen] = useState('light');
  const [fullscreen, setFullscreen] = useState(false);
  const { currentColor, brightness } = useApp();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: 16,
          animation: 'fadeIn 0.3s ease',
        }}
      >
        {screen === 'light' && (
          <LightScreen onFullscreen={() => setFullscreen(true)} />
        )}
        {screen === 'library' && <LibraryScreen />}
        {screen === 'profile' && <ProfileScreen />}
      </div>

      <BottomNav active={screen} onChange={setScreen} />

      {fullscreen && (
        <FullscreenView
          color={currentColor}
          brightness={brightness}
          onExit={() => setFullscreen(false)}
        />
      )}
    </div>
  );
}