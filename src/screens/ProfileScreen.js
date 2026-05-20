import React, { useState, useEffect } from 'react';
import {
  auth,
  db,
  signOut,
  doc,
  getDoc,
  collection,
  getDocs
} from '../firebase';
import { useApp } from '../App';

export default function ProfileScreen() {
  const { user, showToast } = useApp();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    provider: '',
    photoURL: ''
  });
  const [presetCount, setPresetCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        const data = snap.data() || {};
        setProfile({
          name: data.name || user.displayName || 'Photon User',
          email: data.email || user.email || '',
          provider: data.provider || (user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email'),
          photoURL: data.photoURL || user.photoURL || ''
        });
        const presRef = collection(db, 'users', user.uid, 'presets');
        const presSnap = await getDocs(presRef);
        setPresetCount(presSnap.size);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast('Signed out successfully');
    } catch (e) {
      showToast('Sign out failed');
    }
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 16px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    marginBottom: 8
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ padding: '56px 22px 24px' }}>

        {/* Avatar */}
        {profile.photoURL ? (
          <img
            src={profile.photoURL}
            alt="Profile"
            referrerPolicy="no-referrer"
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              objectFit: 'cover',
              marginBottom: 16,
              border: '3px solid var(--border2)'
            }}
          />
        ) : (
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--surface3), var(--surface2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 700,
            marginBottom: 16,
            border: '3px solid var(--border2)',
            color: 'var(--text)'
          }}>
            {loading ? '·' : profile.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
          {loading ? (
            <div style={{
              width: 140,
              height: 28,
              background: 'var(--surface2)',
              borderRadius: 8,
              animation: 'pulse 1.5s infinite'
            }} />
          ) : profile.name}
        </div>
        <div style={{
          fontSize: 14,
          color: 'var(--text2)',
          marginTop: 4
        }}>
          {profile.email}
        </div>
        {profile.provider && (
          <div style={{
            display: 'inline-block',
            marginTop: 8,
            padding: '3px 10px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text2)',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            {profile.provider === 'google' || profile.provider === 'Google'
              ? '● Google Account'
              : '● Email Account'}
          </div>
        )}
      </div>

      {/* Info Rows */}
      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: 'var(--text3)',
          marginBottom: 12,
          paddingLeft: 2
        }}>Account Details</div>

        <div style={rowStyle}>
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>Name</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{profile.name}</span>
        </div>
        <div style={rowStyle}>
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>Email</span>
          <span style={{ fontSize: 12, fontWeight: 600, maxWidth: '60%', textAlign: 'right', wordBreak: 'break-all' }}>
            {profile.email}
          </span>
        </div>
        <div style={rowStyle}>
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>Sign-in Method</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {profile.provider === 'google' || profile.provider === 'Google' ? 'Google' : 'Email & Password'}
          </span>
        </div>
        <div style={rowStyle}>
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>Presets Saved</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{presetCount}</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: 'var(--text3)',
          marginBottom: 12,
          paddingLeft: 2
        }}>App Info</div>
        <div style={rowStyle}>
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>Version</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>1.0.0</span>
        </div>
        <div style={rowStyle}>
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>Storage</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Firebase Cloud</span>
        </div>
      </div>

      {/* Sign Out */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: 'var(--text3)',
          marginBottom: 12,
          paddingLeft: 2
        }}>Danger Zone</div>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            padding: 16,
            borderRadius: 10,
            border: '1px solid rgba(255,60,60,0.2)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            background: 'rgba(255,60,60,0.06)',
            color: '#ff4444',
            fontFamily: 'var(--font)',
            transition: 'all 0.2s'
          }}
        >
          Sign Out
        </button>
      </div>

      <div style={{ height: 120 }} />
    </div>
  );
}