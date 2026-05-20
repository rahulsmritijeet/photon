import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import {
  collection, addDoc, getDocs, deleteDoc, doc, setDoc,
  getDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import Modal from '../components/Modal';
import { HiPlus, HiShare, HiEllipsisHorizontal, HiTrash } from 'react-icons/hi2';
import { RiArchiveLine } from 'react-icons/ri';
import { kelvinToRGB } from '../data/colors';

const generateId = () => Math.random().toString(36).substr(2, 12);

export default function LibraryScreen() {
  const { user, showToast, currentColor, currentCT } = useApp();
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const [newName, setNewName] = useState('');
  const [importLink, setImportLink] = useState('');

  const loadPresets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ref = collection(db, 'users', user.uid, 'presets');
      const snap = await getDocs(ref);
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPresets(list);
    } catch (e) {
      console.error(e);
      showToast('Failed to load presets');
    }
    setLoading(false);
  }, [user, showToast]);

  useEffect(() => { loadPresets(); }, [loadPresets]);

  const createPreset = async () => {
    if (!newName.trim()) { showToast('Enter a preset name'); return; }
    const shareId = generateId();
    try {
      const ref = collection(db, 'users', user.uid, 'presets');
      const newDoc = await addDoc(ref, {
        name: newName.trim(),
        colors: [],
        colorTemps: [],
        shareId,
        createdAt: serverTimestamp()
      });
      await setDoc(doc(db, 'sharedPresets', shareId), {
        ownerUid: user.uid,
        presetId: newDoc.id,
        name: newName.trim(),
        colors: [],
        colorTemps: [],
        ownerName: user.displayName || 'Photon User'
      });
      setShowNewModal(false);
      setNewName('');
      await loadPresets();
      showToast(`"${newName.trim()}" created!`);
    } catch (e) {
      console.error(e);
      showToast('Failed to create preset');
    }
  };

  const importFromLink = async () => {
    const link = importLink.trim();
    let shareId;
    try {
      const url = new URL(link);
      shareId = url.searchParams.get('share');
    } catch {
      shareId = link.length > 5 ? link : null;
    }
    if (!shareId) { showToast('Invalid link'); return; }
    try {
      const snap = await getDoc(doc(db, 'sharedPresets', shareId));
      if (!snap.exists()) { showToast('Preset not found'); return; }
      const data = snap.data();
      const newShareId = generateId();
      const ref = collection(db, 'users', user.uid, 'presets');
      const newDoc = await addDoc(ref, {
        name: data.name + ' (imported)',
        colors: data.colors || [],
        colorTemps: data.colorTemps || [],
        shareId: newShareId,
        createdAt: serverTimestamp()
      });
      await setDoc(doc(db, 'sharedPresets', newShareId), {
        ownerUid: user.uid,
        presetId: newDoc.id,
        name: data.name + ' (imported)',
        colors: data.colors || [],
        colorTemps: data.colorTemps || [],
        ownerName: user.displayName || 'Photon User'
      });
      setShowNewModal(false);
      setImportLink('');
      await loadPresets();
      showToast('Preset imported!');
    } catch (e) {
      console.error(e);
      showToast('Import failed');
    }
  };

  const openDetail = (preset) => {
    setActivePreset(preset);
    setShowDetailModal(true);
  };

  const addColorToPreset = async () => {
    if (!activePreset) return;
    const colors = [...(activePreset.colors || []), {
      name: currentColor.name,
      r: currentColor.r,
      g: currentColor.g,
      b: currentColor.b
    }];
    await updatePresetField(activePreset.id, { colors });
    setActivePreset(p => ({ ...p, colors }));
    showToast('Color added!');
  };

  const addCTToPreset = async () => {
    if (!activePreset) return;
    const cts = [...(activePreset.colorTemps || [])];
    if (cts.includes(currentCT)) { showToast('Already in preset'); return; }
    cts.push(currentCT);
    await updatePresetField(activePreset.id, { colorTemps: cts });
    setActivePreset(p => ({ ...p, colorTemps: cts }));
    showToast(`${currentCT}K added!`);
  };

  const removeColor = async (index) => {
    if (!activePreset) return;
    const colors = [...(activePreset.colors || [])];
    colors.splice(index, 1);
    await updatePresetField(activePreset.id, { colors });
    setActivePreset(p => ({ ...p, colors }));
  };

  const removeCT = async (index) => {
    if (!activePreset) return;
    const cts = [...(activePreset.colorTemps || [])];
    cts.splice(index, 1);
    await updatePresetField(activePreset.id, { colorTemps: cts });
    setActivePreset(p => ({ ...p, colorTemps: cts }));
  };

  const updatePresetField = async (id, updates) => {
    const ref = doc(db, 'users', user.uid, 'presets', id);
    await setDoc(ref, updates, { merge: true });
    const preset = presets.find(p => p.id === id);
    if (preset?.shareId) {
      await setDoc(doc(db, 'sharedPresets', preset.shareId), updates, { merge: true });
    }
    setPresets(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePreset = async () => {
    if (!activePreset) return;
    if (!window.confirm(`Delete "${activePreset.name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'presets', activePreset.id));
      if (activePreset.shareId) {
        await deleteDoc(doc(db, 'sharedPresets', activePreset.shareId));
      }
      setShowDetailModal(false);
      setActivePreset(null);
      await loadPresets();
      showToast('Preset deleted');
    } catch (e) {
      showToast('Failed to delete');
    }
  };

  const copyLink = () => {
    if (!activePreset?.shareId) return;
    const link = `${window.location.origin}?share=${activePreset.shareId}`;
    navigator.clipboard?.writeText(link).then(() => showToast('Link copied!'))
      .catch(() => showToast('Copy failed'));
  };

  const sharePreset = (e, preset) => {
    e.stopPropagation();
    const link = `${window.location.origin}?share=${preset.shareId}`;
    navigator.clipboard?.writeText(link).then(() => showToast('Share link copied!'))
      .catch(() => showToast('Copy failed'));
  };

  const inputStyle = {
    width: '100%', background: 'var(--surface2)',
    border: '1px solid var(--border2)', borderRadius: 'var(--radius-xs)',
    color: 'var(--text)', fontSize: 15, padding: '12px 16px',
    outline: 'none', marginBottom: 12, fontFamily: 'var(--font)'
  };

  const btnStyle = (primary) => ({
    width: '100%', padding: 14, borderRadius: 'var(--radius-xs)',
    border: primary ? 'none' : '1px solid var(--border2)',
    fontSize: 15, fontWeight: 600, cursor: 'pointer',
    background: primary ? '#fff' : 'var(--surface2)',
    color: primary ? '#000' : 'var(--text)',
    fontFamily: 'var(--font)', transition: 'all 0.2s',
    marginBottom: 8
  });

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: '56px 22px 16px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between'
      }}>
        <div>
          <div style={{
            fontSize: 28, fontWeight: 800, letterSpacing: -1.5,
            background: 'linear-gradient(135deg, #fff 0%, #777 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Library</div>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
            {presets.length} preset{presets.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <button onClick={() => setShowNewModal(true)} style={{
          width: 42, height: 42, background: '#fff', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', border: 'none', flexShrink: 0
        }}>
          <HiPlus size={20} color="#000" strokeWidth={1} />
        </button>
      </div>

      {/* Preset List */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{
              width: 28, height: 28, border: '2px solid var(--border)',
              borderTopColor: '#fff', borderRadius: '50%',
              animation: 'spin 0.7s linear infinite'
            }} />
          </div>
        ) : presets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
            <RiArchiveLine size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text2)', marginBottom: 4 }}>No presets yet</p>
            <span style={{ fontSize: 14 }}>Tap + to create your first preset</span>
          </div>
        ) : presets.map(p => (
          <div
            key={p.id}
            onClick={() => openDetail(p)}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: 16, cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: 12
            }}>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.2 }}>{p.name}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={(e) => sharePreset(e, p)} style={{
                  width: 34, height: 34, background: 'var(--surface2)',
                  border: 'none', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}>
                  <HiShare size={15} color="var(--text2)" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); openDetail(p); }} style={{
                  width: 34, height: 34, background: 'var(--surface2)',
                  border: 'none', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}>
                  <HiEllipsisHorizontal size={15} color="var(--text2)" />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(p.colors || []).map((c, j) => (
                <div key={j} style={{
                  height: 28, minWidth: 28, borderRadius: 8,
                  background: `rgb(${c.r},${c.g},${c.b})`,
                  display: 'flex', alignItems: 'center', padding: '0 8px',
                  fontSize: 10, fontWeight: 700,
                  color: ((c.r * 299 + c.g * 587 + c.b * 114) / 1000) > 128 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)'
                }}>{c.name}</div>
              ))}
              {(p.colors || []).length === 0 && (
                <span style={{ color: 'var(--text3)', fontSize: 13 }}>No colors</span>
              )}
            </div>
            {(p.colorTemps || []).length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, color: 'var(--text2)', marginTop: 8
              }}>
                {(p.colorTemps || []).map(k => `${k}K`).join(' · ')}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ height: 100 }} />

      {/* New Preset Modal */}
      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="New Preset">
        <input
          style={inputStyle}
          placeholder="Preset name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createPreset()}
          autoFocus
        />

        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, margin: '12px 0'
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>import from link</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
        </div>

        <input
          style={inputStyle}
          placeholder="Paste shared preset link..."
          value={importLink}
          onChange={e => setImportLink(e.target.value)}
        />
        <button onClick={importFromLink} style={btnStyle(false)}>Import from Link</button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, margin: '10px 0'
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>or create new</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
        </div>

        <button onClick={createPreset} style={btnStyle(true)}>Create Empty Preset</button>
        <button onClick={() => setShowNewModal(false)} style={btnStyle(false)}>Cancel</button>
      </Modal>

      {/* Preset Detail Modal */}
      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={null}
      >
        {activePreset && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: 20
            }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>
                {activePreset.name}
              </h2>
              <button onClick={deletePreset} style={{
                width: 36, height: 36, background: 'rgba(255,60,60,0.1)',
                border: 'none', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}>
                <HiTrash size={16} color="#ff4444" />
              </button>
            </div>

            {/* Share */}
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: 1,
              textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 8
            }}>Share Link</div>
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xs)', padding: '10px 14px', marginBottom: 20
            }}>
              <span style={{
                flex: 1, fontSize: 11, color: 'var(--text2)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {`${window.location.origin}?share=${activePreset.shareId}`}
              </span>
              <button onClick={copyLink} style={{
                background: 'var(--surface3)', border: 'none', borderRadius: 6,
                color: 'var(--text)', fontSize: 12, fontWeight: 600,
                padding: '6px 14px', cursor: 'pointer', flexShrink: 0,
                fontFamily: 'var(--font)'
              }}>Copy</button>
            </div>

            {/* Colors */}
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: 1,
              textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10
            }}>Colors</div>
            {(activePreset.colors || []).length === 0 ? (
              <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 8 }}>No colors added yet</p>
            ) : (activePreset.colors || []).map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 8, padding: '6px 0'
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: `rgb(${c.r},${c.g},${c.b})`
                }} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{c.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {c.r}, {c.g}, {c.b}
                </span>
                <button onClick={() => removeColor(i)} style={{
                  background: 'none', border: 'none', color: 'var(--text3)',
                  cursor: 'pointer', fontSize: 20, padding: 4, lineHeight: 1
                }}>×</button>
              </div>
            ))}
            <button onClick={addColorToPreset} style={{ ...btnStyle(false), marginTop: 4 }}>
              + Add Current Color
            </button>

            {/* Color Temps */}
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: 1,
              textTransform: 'uppercase', color: 'var(--text3)',
              marginTop: 16, marginBottom: 10
            }}>Color Temps</div>
            {(activePreset.colorTemps || []).length === 0 ? (
              <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 8 }}>No temps added yet</p>
            ) : (activePreset.colorTemps || []).map((k, i) => {
              const rgb = kelvinToRGB(k);
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 8, padding: '6px 0'
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: `rgb(${rgb.r},${rgb.g},${rgb.b})`
                  }} />
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{k}K</span>
                  <button onClick={() => removeCT(i)} style={{
                    background: 'none', border: 'none', color: 'var(--text3)',
                    cursor: 'pointer', fontSize: 20, padding: 4, lineHeight: 1
                  }}>×</button>
                </div>
              );
            })}
            <button onClick={addCTToPreset} style={{ ...btnStyle(false), marginTop: 4 }}>
              + Add Current Temp ({currentCT}K)
            </button>

            <button onClick={() => setShowDetailModal(false)} style={{ ...btnStyle(false), marginTop: 12 }}>
              Done
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}