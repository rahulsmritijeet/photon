import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import {
  db,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from '../firebase';
import Modal from '../components/Modal';
import {
  HiPlus,
  HiShare,
  HiTrash,
  HiPencil,
  HiChevronRight,
} from 'react-icons/hi2';
import { RiArchiveLine } from 'react-icons/ri';
import { kelvinToRGB } from '../data/colors';

const generateId = () => Math.random().toString(36).substr(2, 12);

export default function LibraryScreen() {
  const { user, showToast, currentColor, currentCT, setCurrentColor, setCurrentCT, setMode } = useApp();
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddColorModal, setShowAddColorModal] = useState(false);
  const [showAddCTModal, setShowAddCTModal] = useState(false);
  const [showEditColorModal, setShowEditColorModal] = useState(false);
  const [showEditCTModal, setShowEditCTModal] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const [newName, setNewName] = useState('');
  const [importLink, setImportLink] = useState('');

  // Add color form
  const [addColorName, setAddColorName] = useState('');
  const [addColorR, setAddColorR] = useState(255);
  const [addColorG, setAddColorG] = useState(255);
  const [addColorB, setAddColorB] = useState(255);

  // Add CT form
  const [addCTValue, setAddCTValue] = useState(5600);
  const [addCTName, setAddCTName] = useState('');

  // Edit color
  const [editColorIndex, setEditColorIndex] = useState(null);
  const [editColorName, setEditColorName] = useState('');
  const [editColorR, setEditColorR] = useState(0);
  const [editColorG, setEditColorG] = useState(0);
  const [editColorB, setEditColorB] = useState(0);

  // Edit CT
  const [editCTIndex, setEditCTIndex] = useState(null);
  const [editCTValue, setEditCTValue] = useState(5600);
  const [editCTName, setEditCTName] = useState('');

  const loadPresets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ref = collection(db, 'users', user.uid, 'presets');
      const snap = await getDocs(ref);
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort(
        (a, b) =>
          (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
      setPresets(list);
    } catch (e) {
      console.error(e);
      showToast('Failed to load presets');
    }
    setLoading(false);
  }, [user, showToast]);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const createPreset = async () => {
    if (!newName.trim()) {
      showToast('Enter a preset name');
      return;
    }
    const shareId = generateId();
    try {
      const ref = collection(db, 'users', user.uid, 'presets');
      const newDoc = await addDoc(ref, {
        name: newName.trim(),
        colors: [],
        colorTemps: [],
        shareId,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'sharedPresets', shareId), {
        ownerUid: user.uid,
        presetId: newDoc.id,
        name: newName.trim(),
        colors: [],
        colorTemps: [],
        ownerName: user.displayName || 'Photon User',
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
    if (!shareId) {
      showToast('Invalid link');
      return;
    }
    try {
      const snap = await getDoc(doc(db, 'sharedPresets', shareId));
      if (!snap.exists()) {
        showToast('Preset not found');
        return;
      }
      const data = snap.data();
      const newShareId = generateId();
      const ref = collection(db, 'users', user.uid, 'presets');
      const newDoc = await addDoc(ref, {
        name: data.name + ' (imported)',
        colors: data.colors || [],
        colorTemps: data.colorTemps || [],
        shareId: newShareId,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'sharedPresets', newShareId), {
        ownerUid: user.uid,
        presetId: newDoc.id,
        name: data.name + ' (imported)',
        colors: data.colors || [],
        colorTemps: data.colorTemps || [],
        ownerName: user.displayName || 'Photon User',
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
    setActivePreset({ ...preset });
    setShowDetailModal(true);
  };

  // ─── ADD COLOR TO PRESET ───
  const openAddColor = () => {
    setAddColorName(currentColor.name || 'Custom');
    setAddColorR(currentColor.r);
    setAddColorG(currentColor.g);
    setAddColorB(currentColor.b);
    setShowAddColorModal(true);
  };

  const confirmAddColor = async () => {
    if (!addColorName.trim()) {
      showToast('Enter a color name');
      return;
    }
    const newColor = {
      name: addColorName.trim(),
      r: Math.max(0, Math.min(255, addColorR)),
      g: Math.max(0, Math.min(255, addColorG)),
      b: Math.max(0, Math.min(255, addColorB)),
    };
    const colors = [...(activePreset.colors || []), newColor];
    await updatePresetField(activePreset.id, { colors });
    setActivePreset((p) => ({ ...p, colors }));
    setShowAddColorModal(false);
    showToast(`"${newColor.name}" added!`);
  };

  // ─── ADD CT TO PRESET ───
  const openAddCT = () => {
    setAddCTValue(currentCT);
    setAddCTName(`${currentCT}K`);
    setShowAddCTModal(true);
  };

  const confirmAddCT = async () => {
    if (!addCTName.trim()) {
      showToast('Enter a name for this temperature');
      return;
    }
    const val = Math.max(1000, Math.min(40000, addCTValue));
    const newCT = { name: addCTName.trim(), value: val };
    const cts = [...(activePreset.colorTemps || []), newCT];
    await updatePresetField(activePreset.id, { colorTemps: cts });
    setActivePreset((p) => ({ ...p, colorTemps: cts }));
    setShowAddCTModal(false);
    showToast(`"${addCTName.trim()}" added!`);
  };

  // ─── EDIT COLOR ───
  const openEditColor = (index) => {
    const c = activePreset.colors[index];
    setEditColorIndex(index);
    setEditColorName(c.name);
    setEditColorR(c.r);
    setEditColorG(c.g);
    setEditColorB(c.b);
    setShowEditColorModal(true);
  };

  const confirmEditColor = async () => {
    if (!editColorName.trim()) {
      showToast('Enter a color name');
      return;
    }
    const colors = [...(activePreset.colors || [])];
    colors[editColorIndex] = {
      name: editColorName.trim(),
      r: Math.max(0, Math.min(255, editColorR)),
      g: Math.max(0, Math.min(255, editColorG)),
      b: Math.max(0, Math.min(255, editColorB)),
    };
    await updatePresetField(activePreset.id, { colors });
    setActivePreset((p) => ({ ...p, colors }));
    setShowEditColorModal(false);
    showToast('Color updated!');
  };

  // ─── EDIT CT ───
  const openEditCT = (index) => {
    const ct = activePreset.colorTemps[index];
    setEditCTIndex(index);
    setEditCTName(typeof ct === 'object' ? ct.name : `${ct}K`);
    setEditCTValue(typeof ct === 'object' ? ct.value : ct);
    setShowEditCTModal(true);
  };

  const confirmEditCT = async () => {
    if (!editCTName.trim()) {
      showToast('Enter a name');
      return;
    }
    const cts = [...(activePreset.colorTemps || [])];
    cts[editCTIndex] = {
      name: editCTName.trim(),
      value: Math.max(1000, Math.min(40000, editCTValue)),
    };
    await updatePresetField(activePreset.id, { colorTemps: cts });
    setActivePreset((p) => ({ ...p, colorTemps: cts }));
    setShowEditCTModal(false);
    showToast('Temperature updated!');
  };

  // ─── REMOVE ───
  const removeColor = async (index) => {
    const colors = [...(activePreset.colors || [])];
    colors.splice(index, 1);
    await updatePresetField(activePreset.id, { colors });
    setActivePreset((p) => ({ ...p, colors }));
  };

  const removeCT = async (index) => {
    const cts = [...(activePreset.colorTemps || [])];
    cts.splice(index, 1);
    await updatePresetField(activePreset.id, { colorTemps: cts });
    setActivePreset((p) => ({ ...p, colorTemps: cts }));
  };

  const updatePresetField = async (id, updates) => {
    const ref = doc(db, 'users', user.uid, 'presets', id);
    await setDoc(ref, updates, { merge: true });
    const preset = presets.find((p) => p.id === id);
    if (preset?.shareId) {
      await setDoc(doc(db, 'sharedPresets', preset.shareId), updates, {
        merge: true,
      });
    }
    setPresets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deletePreset = async () => {
    if (!activePreset) return;
    if (!window.confirm(`Delete "${activePreset.name}"?`)) return;
    try {
      await deleteDoc(
        doc(db, 'users', user.uid, 'presets', activePreset.id)
      );
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
    navigator.clipboard
      ?.writeText(link)
      .then(() => showToast('Link copied!'))
      .catch(() => showToast('Copy failed'));
  };

  const sharePreset = (e, preset) => {
    e.stopPropagation();
    const link = `${window.location.origin}?share=${preset.shareId}`;
    navigator.clipboard
      ?.writeText(link)
      .then(() => showToast('Share link copied!'))
      .catch(() => showToast('Copy failed'));
  };

  const applyPresetColor = (c) => {
    setCurrentColor({ r: c.r, g: c.g, b: c.b, name: c.name });
    setMode('rgb');
    showToast(`Applied "${c.name}"`);
  };

  const applyPresetCT = (ct) => {
    const val = typeof ct === 'object' ? ct.value : ct;
    setCurrentCT(val);
    const rgb = kelvinToRGB(val);
    setCurrentColor({ ...rgb, name: `${val}K` });
    setMode('ct');
    showToast(`Applied ${val}K`);
  };

  const inputStyle = {
    width: '100%',
    background: 'var(--surface2)',
    border: '1px solid var(--border2)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text)',
    fontSize: 15,
    padding: '12px 16px',
    outline: 'none',
    marginBottom: 12,
    fontFamily: 'var(--font)',
  };

  const btnStyle = (primary) => ({
    width: '100%',
    padding: 14,
    borderRadius: 'var(--radius-xs)',
    border: primary ? 'none' : '1px solid var(--border2)',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    background: primary ? '#fff' : 'var(--surface2)',
    color: primary ? '#000' : 'var(--text)',
    fontFamily: 'var(--font)',
    transition: 'all 0.2s',
    marginBottom: 8,
  });

  const getCTValue = (ct) => (typeof ct === 'object' ? ct.value : ct);
  const getCTName = (ct) =>
    typeof ct === 'object' ? ct.name : `${ct}K`;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          padding: '56px 22px 16px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: -1.5,
              background:
                'linear-gradient(135deg, #fff 0%, #777 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Library
          </div>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
            {presets.length} preset{presets.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          style={{
            width: 42,
            height: 42,
            background: '#fff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: 'none',
            flexShrink: 0,
          }}
        >
          <HiPlus size={20} color="#000" strokeWidth={1} />
        </button>
      </div>

      {/* Preset List */}
      <div
        style={{
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: 60,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                border: '2px solid var(--border)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          </div>
        ) : presets.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text3)',
            }}
          >
            <RiArchiveLine
              size={48}
              style={{ opacity: 0.2, marginBottom: 16 }}
            />
            <p
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: 'var(--text2)',
                marginBottom: 4,
              }}
            >
              No presets yet
            </p>
            <span style={{ fontSize: 14 }}>
              Tap + to create your first preset
            </span>
          </div>
        ) : (
          presets.map((p) => (
            <div
              key={p.id}
              onClick={() => openDetail(p)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 16,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    letterSpacing: -0.2,
                  }}
                >
                  {p.name}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={(e) => sharePreset(e, p)}
                    style={{
                      width: 34,
                      height: 34,
                      background: 'var(--surface2)',
                      border: 'none',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <HiShare size={15} color="var(--text2)" />
                  </button>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      background: 'var(--surface2)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <HiChevronRight size={15} color="var(--text3)" />
                  </div>
                </div>
              </div>

              {/* Colors row */}
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  flexWrap: 'wrap',
                  marginBottom: 6,
                }}
              >
                {(p.colors || []).length === 0 &&
                  (p.colorTemps || []).length === 0 && (
                    <span style={{ color: 'var(--text3)', fontSize: 13 }}>
                      Empty preset — tap to add colors
                    </span>
                  )}
                {(p.colors || []).map((c, j) => (
                  <div
                    key={j}
                    style={{
                      height: 28,
                      minWidth: 28,
                      borderRadius: 8,
                      background: `rgb(${c.r},${c.g},${c.b})`,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 8px',
                      fontSize: 10,
                      fontWeight: 700,
                      color:
                        (c.r * 299 + c.g * 587 + c.b * 114) / 1000 >
                        128
                          ? 'rgba(0,0,0,0.5)'
                          : 'rgba(255,255,255,0.85)',
                    }}
                  >
                    {c.name}
                  </div>
                ))}
              </div>

              {/* CTs */}
              {(p.colorTemps || []).length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: 4,
                    flexWrap: 'wrap',
                  }}
                >
                  {(p.colorTemps || []).map((ct, j) => {
                    const val = getCTValue(ct);
                    const nm = getCTName(ct);
                    const rgb = kelvinToRGB(val);
                    return (
                      <div
                        key={j}
                        style={{
                          height: 28,
                          borderRadius: 8,
                          background: `rgb(${rgb.r},${rgb.g},${rgb.b})`,
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 8px',
                          fontSize: 10,
                          fontWeight: 700,
                          color:
                            (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) /
                              1000 >
                            128
                              ? 'rgba(0,0,0,0.5)'
                              : 'rgba(255,255,255,0.85)',
                        }}
                      >
                        {nm}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ height: 100 }} />

      {/* ════════════ NEW PRESET MODAL ════════════ */}
      <Modal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="New Preset"
      >
        <input
          style={inputStyle}
          placeholder="Preset name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createPreset()}
          autoFocus
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            margin: '12px 0',
          }}
        >
          <div
            style={{ flex: 1, height: 1, background: 'var(--border2)' }}
          />
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>
            import from link
          </span>
          <div
            style={{ flex: 1, height: 1, background: 'var(--border2)' }}
          />
        </div>
        <input
          style={inputStyle}
          placeholder="Paste shared preset link..."
          value={importLink}
          onChange={(e) => setImportLink(e.target.value)}
        />
        <button onClick={importFromLink} style={btnStyle(false)}>
          Import from Link
        </button>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            margin: '10px 0',
          }}
        >
          <div
            style={{ flex: 1, height: 1, background: 'var(--border2)' }}
          />
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>
            or create new
          </span>
          <div
            style={{ flex: 1, height: 1, background: 'var(--border2)' }}
          />
        </div>
        <button onClick={createPreset} style={btnStyle(true)}>
          Create Empty Preset
        </button>
        <button
          onClick={() => setShowNewModal(false)}
          style={btnStyle(false)}
        >
          Cancel
        </button>
      </Modal>

      {/* ════════════ PRESET DETAIL MODAL ════════════ */}
      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={null}
      >
        {activePreset && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: -0.3,
                }}
              >
                {activePreset.name}
              </h2>
              <button
                onClick={deletePreset}
                style={{
                  width: 36,
                  height: 36,
                  background: 'rgba(255,60,60,0.1)',
                  border: 'none',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <HiTrash size={16} color="#ff4444" />
              </button>
            </div>

            {/* Share */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: 'var(--text3)',
                marginBottom: 8,
              }}
            >
              Share Link
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xs)',
                padding: '10px 14px',
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: 11,
                  color: 'var(--text2)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {`${window.location.origin}?share=${activePreset.shareId}`}
              </span>
              <button
                onClick={copyLink}
                style={{
                  background: 'var(--surface3)',
                  border: 'none',
                  borderRadius: 6,
                  color: 'var(--text)',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  fontFamily: 'var(--font)',
                }}
              >
                Copy
              </button>
            </div>

            {/* ─── COLORS ─── */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: 'var(--text3)',
                marginBottom: 10,
              }}
            >
              Colors ({(activePreset.colors || []).length})
            </div>
            {(activePreset.colors || []).length === 0 ? (
              <p
                style={{
                  color: 'var(--text3)',
                  fontSize: 14,
                  marginBottom: 8,
                  textAlign: 'center',
                  padding: '12px 0',
                }}
              >
                No colors added yet
              </p>
            ) : (
              (activePreset.colors || []).map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 8,
                    padding: '8px 10px',
                    background: 'var(--surface2)',
                    borderRadius: 10,
                  }}
                >
                  <div
                    onClick={() => applyPresetColor(c)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      flexShrink: 0,
                      background: `rgb(${c.r},${c.g},${c.b})`,
                      cursor: 'pointer',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <div
                    style={{ flex: 1, cursor: 'pointer' }}
                    onClick={() => applyPresetColor(c)}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text3)',
                      }}
                    >
                      {c.r}, {c.g}, {c.b}
                    </div>
                  </div>
                  <button
                    onClick={() => openEditColor(i)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 6,
                    }}
                  >
                    <HiPencil size={14} color="var(--text3)" />
                  </button>
                  <button
                    onClick={() => removeColor(i)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text3)',
                      fontSize: 20,
                      padding: 4,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
            <button onClick={openAddColor} style={btnStyle(false)}>
              + Add Color
            </button>

            {/* ─── COLOR TEMPS ─── */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: 'var(--text3)',
                marginTop: 16,
                marginBottom: 10,
              }}
            >
              Color Temperatures ({(activePreset.colorTemps || []).length})
            </div>
            {(activePreset.colorTemps || []).length === 0 ? (
              <p
                style={{
                  color: 'var(--text3)',
                  fontSize: 14,
                  marginBottom: 8,
                  textAlign: 'center',
                  padding: '12px 0',
                }}
              >
                No temperatures added yet
              </p>
            ) : (
              (activePreset.colorTemps || []).map((ct, i) => {
                const val = getCTValue(ct);
                const nm = getCTName(ct);
                const rgb = kelvinToRGB(val);
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 8,
                      padding: '8px 10px',
                      background: 'var(--surface2)',
                      borderRadius: 10,
                    }}
                  >
                    <div
                      onClick={() => applyPresetCT(ct)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: `rgb(${rgb.r},${rgb.g},${rgb.b})`,
                        cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                    <div
                      style={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => applyPresetCT(ct)}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {nm}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text3)',
                        }}
                      >
                        {val}K
                      </div>
                    </div>
                    <button
                      onClick={() => openEditCT(i)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 6,
                      }}
                    >
                      <HiPencil size={14} color="var(--text3)" />
                    </button>
                    <button
                      onClick={() => removeCT(i)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text3)',
                        fontSize: 20,
                        padding: 4,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
            <button onClick={openAddCT} style={btnStyle(false)}>
              + Add Temperature
            </button>

            <button
              onClick={() => setShowDetailModal(false)}
              style={{ ...btnStyle(false), marginTop: 12 }}
            >
              Done
            </button>
          </>
        )}
      </Modal>

      {/* ════════════ ADD COLOR MODAL ════════════ */}
      <Modal
        open={showAddColorModal}
        onClose={() => setShowAddColorModal(false)}
        title="Add Color"
      >
        <div
          style={{
            width: '100%',
            height: 80,
            borderRadius: 14,
            background: `rgb(${addColorR},${addColorG},${addColorB})`,
            marginBottom: 16,
            transition: 'background 0.2s',
          }}
        />
        <input
          style={inputStyle}
          placeholder="Color name"
          value={addColorName}
          onChange={(e) => setAddColorName(e.target.value)}
          autoFocus
        />
        {['R', 'G', 'B'].map((ch) => {
          const val =
            ch === 'R' ? addColorR : ch === 'G' ? addColorG : addColorB;
          const setter =
            ch === 'R'
              ? setAddColorR
              : ch === 'G'
                ? setAddColorG
                : setAddColorB;
          const gradColor =
            ch === 'R' ? '#ff0000' : ch === 'G' ? '#00cc00' : '#0066ff';
          return (
            <div key={ch} style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text2)',
                  }}
                >
                  {ch === 'R' ? 'Red' : ch === 'G' ? 'Green' : 'Blue'}
                </span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={val}
                  onChange={(e) =>
                    setter(
                      Math.max(
                        0,
                        Math.min(255, parseInt(e.target.value) || 0)
                      )
                    )
                  }
                  style={{
                    width: 52,
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text)',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border2)',
                    borderRadius: 6,
                    padding: '4px 8px',
                    outline: 'none',
                    fontFamily: 'var(--font)',
                  }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={255}
                value={val}
                onChange={(e) => setter(parseInt(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #000, ${gradColor})`,
                }}
              />
            </div>
          );
        })}
        <button onClick={confirmAddColor} style={btnStyle(true)}>
          Add Color
        </button>
        <button
          onClick={() => setShowAddColorModal(false)}
          style={btnStyle(false)}
        >
          Cancel
        </button>
      </Modal>

      {/* ════════════ ADD CT MODAL ════════════ */}
      <Modal
        open={showAddCTModal}
        onClose={() => setShowAddCTModal(false)}
        title="Add Temperature"
      >
        <div
          style={{
            width: '100%',
            height: 80,
            borderRadius: 14,
            background: (() => {
              const rgb = kelvinToRGB(addCTValue);
              return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
            })(),
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.8)',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
          >
            {addCTValue}K
          </span>
        </div>
        <input
          style={inputStyle}
          placeholder="Temperature name (e.g. Warm Studio)"
          value={addCTName}
          onChange={(e) => setAddCTName(e.target.value)}
          autoFocus
        />
        <input
          type="range"
          min={1000}
          max={40000}
          step={100}
          value={addCTValue}
          onChange={(e) => setAddCTValue(parseInt(e.target.value))}
          style={{
            background:
              'linear-gradient(to right, #ff4500, #ff8c00, #ffd700, #fffacd, #ffffff, #d0e8ff, #87ceeb, #4682b4, #2e8b8b, #008080)',
            marginBottom: 12,
          }}
        />
        <input
          type="number"
          min={1000}
          max={40000}
          step={100}
          value={addCTValue}
          onChange={(e) =>
            setAddCTValue(
              Math.max(
                1000,
                Math.min(40000, parseInt(e.target.value) || 1000)
              )
            )
          }
          style={{ ...inputStyle, textAlign: 'center', fontWeight: 700 }}
        />
        <button onClick={confirmAddCT} style={btnStyle(true)}>
          Add Temperature
        </button>
        <button
          onClick={() => setShowAddCTModal(false)}
          style={btnStyle(false)}
        >
          Cancel
        </button>
      </Modal>

      {/* ════════════ EDIT COLOR MODAL ════════════ */}
      <Modal
        open={showEditColorModal}
        onClose={() => setShowEditColorModal(false)}
        title="Edit Color"
      >
        <div
          style={{
            width: '100%',
            height: 80,
            borderRadius: 14,
            background: `rgb(${editColorR},${editColorG},${editColorB})`,
            marginBottom: 16,
            transition: 'background 0.2s',
          }}
        />
        <input
          style={inputStyle}
          placeholder="Color name"
          value={editColorName}
          onChange={(e) => setEditColorName(e.target.value)}
          autoFocus
        />
        {['R', 'G', 'B'].map((ch) => {
          const val =
            ch === 'R'
              ? editColorR
              : ch === 'G'
                ? editColorG
                : editColorB;
          const setter =
            ch === 'R'
              ? setEditColorR
              : ch === 'G'
                ? setEditColorG
                : setEditColorB;
          const gradColor =
            ch === 'R' ? '#ff0000' : ch === 'G' ? '#00cc00' : '#0066ff';
          return (
            <div key={ch} style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text2)',
                  }}
                >
                  {ch === 'R' ? 'Red' : ch === 'G' ? 'Green' : 'Blue'}
                </span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={val}
                  onChange={(e) =>
                    setter(
                      Math.max(
                        0,
                        Math.min(255, parseInt(e.target.value) || 0)
                      )
                    )
                  }
                  style={{
                    width: 52,
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text)',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border2)',
                    borderRadius: 6,
                    padding: '4px 8px',
                    outline: 'none',
                    fontFamily: 'var(--font)',
                  }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={255}
                value={val}
                onChange={(e) => setter(parseInt(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #000, ${gradColor})`,
                }}
              />
            </div>
          );
        })}
        <button onClick={confirmEditColor} style={btnStyle(true)}>
          Save Changes
        </button>
        <button
          onClick={() => setShowEditColorModal(false)}
          style={btnStyle(false)}
        >
          Cancel
        </button>
      </Modal>

      {/* ════════════ EDIT CT MODAL ════════════ */}
      <Modal
        open={showEditCTModal}
        onClose={() => setShowEditCTModal(false)}
        title="Edit Temperature"
      >
        <div
          style={{
            width: '100%',
            height: 80,
            borderRadius: 14,
            background: (() => {
              const rgb = kelvinToRGB(editCTValue);
              return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
            })(),
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.8)',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
          >
            {editCTValue}K
          </span>
        </div>
        <input
          style={inputStyle}
          placeholder="Temperature name"
          value={editCTName}
          onChange={(e) => setEditCTName(e.target.value)}
          autoFocus
        />
        <input
          type="range"
          min={1000}
          max={40000}
          step={100}
          value={editCTValue}
          onChange={(e) => setEditCTValue(parseInt(e.target.value))}
          style={{
            background:
              'linear-gradient(to right, #ff4500, #ff8c00, #ffd700, #fffacd, #ffffff, #d0e8ff, #87ceeb, #4682b4, #2e8b8b, #008080)',
            marginBottom: 12,
          }}
        />
        <input
          type="number"
          min={1000}
          max={40000}
          step={100}
          value={editCTValue}
          onChange={(e) =>
            setEditCTValue(
              Math.max(
                1000,
                Math.min(40000, parseInt(e.target.value) || 1000)
              )
            )
          }
          style={{ ...inputStyle, textAlign: 'center', fontWeight: 700 }}
        />
        <button onClick={confirmEditCT} style={btnStyle(true)}>
          Save Changes
        </button>
        <button
          onClick={() => setShowEditCTModal(false)}
          style={btnStyle(false)}
        >
          Cancel
        </button>
      </Modal>
    </div>
  );
}