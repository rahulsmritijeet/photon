import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import AuthScreen from './screens/AuthScreen';
import MainApp from './screens/MainApp';
import Toast from './components/Toast';

export const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [currentColor, setCurrentColor] = useState({ r: 255, g: 255, b: 255, name: 'White' });
  const [currentCT, setCurrentCT] = useState(5600);
  const [mode, setMode] = useState('rgb');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2500);
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050505',
        gap: 16
      }}>
        <div style={{
          fontSize: 42,
          fontWeight: 800,
          letterSpacing: -2,
          background: 'linear-gradient(135deg, #fff 0%, #555 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>Photon</div>
        <div style={{
          width: 24, height: 24,
          border: '2px solid #222',
          borderTopColor: '#fff',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      user, showToast,
      currentColor, setCurrentColor,
      currentCT, setCurrentCT,
      mode, setMode
    }}>
      {user ? <MainApp /> : <AuthScreen />}
      <Toast show={toast.show} message={toast.message} />
    </AppContext.Provider>
  );
}