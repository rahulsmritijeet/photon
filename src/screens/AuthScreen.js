import React, { useState } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from '../firebase';
import { deleteUser } from 'firebase/auth';
import { HiEye, HiEyeSlash, HiExclamationCircle } from 'react-icons/hi2';

export default function AuthScreen() {
  const [tab, setTab] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const clearForm = () => {
    setName('');
    setEmail('');
    setPass('');
    setConfirmPass('');
    setError('');
  };

  const switchTab = (t) => {
    setTab(t);
    clearForm();
  };

  const friendlyError = (code) => {
    const map = {
      'auth/user-not-found':
        'No account found with this email. Please create an account first.',
      'auth/wrong-password': 'Incorrect password. Try again.',
      'auth/email-already-in-use':
        'This email is already registered. Try signing in.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/too-many-requests':
        'Too many attempts. Please wait and try again.',
      'auth/invalid-credential':
        'Account not found or wrong password. Please check your details or create an account first.',
      'auth/popup-closed-by-user': 'Sign in was cancelled.',
      'auth/network-request-failed':
        'Network error. Check your connection.',
      'auth/popup-blocked':
        'Popup was blocked. Allow popups and try again.',
      'auth/account-exists-with-different-credential':
        'Account exists with different sign-in method.',
      'auth/unauthorized-domain':
        'This domain is not authorized. Contact the developer.',
    };
    return map[code] || 'Something went wrong. Please try again.';
  };

  const userDocExists = async (uid) => {
    try {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      return snap.exists();
    } catch {
      return false;
    }
  };

  const createUserDoc = async (uid, data) => {
    const ref = doc(db, 'users', uid);
    await setDoc(ref, {
      name: data.name || 'Photon User',
      email: data.email || '',
      photoURL: data.photoURL || '',
      provider: data.provider || 'email',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  // ─── GOOGLE SIGN IN ───
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const exists = await userDocExists(user.uid);

      if (!exists) {
        try {
          await deleteUser(user);
        } catch (e) {
          console.warn('Could not delete temp user:', e);
        }
        setError(
          'No account found with this Google account. Please sign up first to create an account.'
        );
        setLoading(false);
        return;
      }
    } catch (e) {
      console.error('Google Sign In Error:', e);
      setError(friendlyError(e.code));
    }
    setLoading(false);
  };

  // ─── GOOGLE SIGN UP ───
  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const exists = await userDocExists(user.uid);

      if (exists) {
        setError(
          'Account already exists with this Google account. Try signing in instead.'
        );
        setLoading(false);
        return;
      }

      await createUserDoc(user.uid, {
        name: user.displayName || 'Photon User',
        email: user.email || '',
        photoURL: user.photoURL || '',
        provider: 'google',
      });
    } catch (e) {
      console.error('Google Sign Up Error:', e);
      setError(friendlyError(e.code));
    }
    setLoading(false);
  };

  // ─── EMAIL SIGN IN ───
  const handleEmailSignIn = async () => {
    setError('');
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!pass) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        pass
      );
      const exists = await userDocExists(result.user.uid);
      if (!exists) {
        setError(
          'Account not found. Please create an account first by signing up.'
        );
        setLoading(false);
        return;
      }
    } catch (e) {
      console.error('Email Sign In Error:', e);
      if (
        e.code === 'auth/invalid-credential' ||
        e.code === 'auth/user-not-found'
      ) {
        setError(
          'No account found with this email. Please create an account first by signing up.'
        );
      } else {
        setError(friendlyError(e.code));
      }
    }
    setLoading(false);
  };

  // ─── EMAIL SIGN UP ───
  const handleEmailSignUp = async () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!pass) {
      setError('Please enter a password.');
      return;
    }
    if (pass.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (pass !== confirmPass) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        pass
      );
      const user = result.user;
      await updateProfile(user, { displayName: name.trim() });
      await createUserDoc(user.uid, {
        name: name.trim(),
        email: user.email,
        photoURL: '',
        provider: 'email',
      });
    } catch (e) {
      console.error('Email Sign Up Error:', e);
      if (e.code === 'auth/email-already-in-use') {
        setError(
          'This email is already registered. Try signing in instead.'
        );
      } else {
        setError(friendlyError(e.code));
      }
    }
    setLoading(false);
  };

  const inputWrapStyle = {
    position: 'relative',
    marginBottom: 14,
  };

  const inputStyle = {
    width: '100%',
    background: 'var(--surface2)',
    border: '1px solid var(--border2)',
    borderRadius: 10,
    color: 'var(--text)',
    fontSize: 15,
    padding: '15px 16px',
    outline: 'none',
    fontFamily: 'var(--font)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const inputFocus = (e) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.25)';
    e.target.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.05)';
  };

  const inputBlur = (e) => {
    e.target.style.borderColor = 'var(--border2)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 28px',
        background: 'var(--bg)',
        animation: 'fadeIn 0.5s ease',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontWeight: 900,
          letterSpacing: -3,
          background: 'linear-gradient(135deg, #ffffff 0%, #444444 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 4,
          lineHeight: 1.1,
        }}
      >
        Photon
      </div>

      <p
        style={{
          fontSize: 14,
          color: 'var(--text3)',
          marginBottom: 44,
          letterSpacing: 0.5,
          fontWeight: 400,
        }}
      >
        Your personal lighting studio
      </p>

      <div style={{ width: '100%', maxWidth: 380 }}>
        <div
          style={{
            display: 'flex',
            background: 'var(--surface2)',
            borderRadius: 10,
            padding: 3,
            marginBottom: 28,
          }}
        >
          {['signin', 'signup'].map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              style={{
                flex: 1,
                padding: '11px 0',
                textAlign: 'center',
                fontSize: 14,
                fontWeight: 600,
                color: tab === t ? 'var(--text)' : 'var(--text3)',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                border: 'none',
                background: tab === t ? 'var(--surface3)' : 'transparent',
                fontFamily: 'var(--font)',
              }}
            >
              {t === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <button
          onClick={
            tab === 'signin' ? handleGoogleSignIn : handleGoogleSignUp
          }
          disabled={loading}
          style={{
            width: '100%',
            padding: 15,
            background: 'var(--surface2)',
            border: '1px solid var(--border2)',
            borderRadius: 10,
            color: 'var(--text)',
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            fontFamily: 'var(--font)',
            opacity: loading ? 0.5 : 1,
            transition: 'all 0.2s',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {tab === 'signin'
            ? 'Sign in with Google'
            : 'Sign up with Google'}
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            margin: '22px 0',
          }}
        >
          <div
            style={{ flex: 1, height: 1, background: 'var(--border2)' }}
          />
          <span
            style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}
          >
            or
          </span>
          <div
            style={{ flex: 1, height: 1, background: 'var(--border2)' }}
          />
        </div>

        <div>
          {tab === 'signup' && (
            <div style={inputWrapStyle}>
              <input
                style={inputStyle}
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
            </div>
          )}

          <div style={inputWrapStyle}>
            <input
              style={inputStyle}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              onFocus={inputFocus}
              onBlur={inputBlur}
            />
          </div>

          <div style={{ ...inputWrapStyle }}>
            <input
              style={{ ...inputStyle, paddingRight: 50 }}
              type={showPass ? 'text' : 'password'}
              placeholder={
                tab === 'signup'
                  ? 'Password (min 6 characters)'
                  : 'Password'
              }
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete={
                tab === 'signin' ? 'current-password' : 'new-password'
              }
              onFocus={inputFocus}
              onBlur={inputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tab === 'signin')
                  handleEmailSignIn();
              }}
            />
            <button
              onClick={() => setShowPass(!showPass)}
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text3)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {showPass ? <HiEyeSlash size={18} /> : <HiEye size={18} />}
            </button>
          </div>

          {tab === 'signup' && (
            <div style={{ ...inputWrapStyle }}>
              <input
                style={{ ...inputStyle, paddingRight: 50 }}
                type={showConfirmPass ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                autoComplete="new-password"
                onFocus={inputFocus}
                onBlur={inputBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEmailSignUp();
                }}
              />
              <button
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text3)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showConfirmPass ? (
                  <HiEyeSlash size={18} />
                ) : (
                  <HiEye size={18} />
                )}
              </button>
            </div>
          )}

          {tab === 'signup' && pass.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 4,
                marginBottom: 16,
                padding: '0 2px',
              }}
            >
              {[1, 2, 3, 4].map((i) => {
                let strength = 0;
                if (pass.length >= 6) strength++;
                if (pass.length >= 8) strength++;
                if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) strength++;
                if (/[0-9!@#$%^&*]/.test(pass)) strength++;
                const colors = [
                  '#ff4444',
                  '#ffaa00',
                  '#ffdd00',
                  '#22c55e',
                ];
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 2,
                      background:
                        i <= strength
                          ? colors[strength - 1]
                          : 'var(--surface3)',
                      transition: 'background 0.3s',
                    }}
                  />
                );
              })}
            </div>
          )}

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '10px 14px',
                background: 'rgba(255,68,68,0.08)',
                border: '1px solid rgba(255,68,68,0.15)',
                borderRadius: 10,
                marginBottom: 16,
                animation: 'scaleIn 0.2s ease',
              }}
            >
              <HiExclamationCircle
                size={18}
                color="#ff4444"
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <span
                style={{
                  color: '#ff6666',
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}
              >
                {error}
              </span>
            </div>
          )}

          <button
            onClick={
              tab === 'signin' ? handleEmailSignIn : handleEmailSignUp
            }
            disabled={loading}
            style={{
              width: '100%',
              padding: 16,
              borderRadius: 10,
              border: 'none',
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'var(--surface3)' : '#ffffff',
              color: loading ? 'var(--text2)' : '#000000',
              fontFamily: 'var(--font)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    border: '2px solid var(--border2)',
                    borderTopColor: 'var(--text2)',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
                {tab === 'signin'
                  ? 'Signing in...'
                  : 'Creating account...'}
              </>
            ) : tab === 'signin' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>

          <p
            style={{
              textAlign: 'center',
              marginTop: 20,
              fontSize: 14,
              color: 'var(--text3)',
            }}
          >
            {tab === 'signin' ? (
              <>
                Don't have an account?{' '}
                <span
                  onClick={() => switchTab('signup')}
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Sign Up
                </span>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <span
                  onClick={() => switchTab('signin')}
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Sign In
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}