import React, { useState, useCallback } from 'react';
import { useApp } from '../App';
import {
  cinematicPresets,
  basicColors,
  ctPresets,
  kelvinToRGB,
} from '../data/colors';
import { HiArrowsPointingOut, HiSun } from 'react-icons/hi2';

export default function LightScreen({ onFullscreen }) {
  const {
    currentColor,
    setCurrentColor,
    currentCT,
    setCurrentCT,
    brightness,
    setBrightness,
    mode,
    setMode,
    showToast,
    getAdjustedColor,
  } = useApp();
  const [activePreset, setActivePreset] = useState(null);
  const [customName, setCustomName] = useState('');

  const getCustomColors = () => {
    try {
      return JSON.parse(
        localStorage.getItem('photon_custom_colors') || '[]'
      );
    } catch {
      return [];
    }
  };

  const [customColors, setCustomColors] = useState(getCustomColors);

  const applyColor = useCallback(
    (c) => {
      setCurrentColor({ r: c.r, g: c.g, b: c.b, name: c.name });
    },
    [setCurrentColor]
  );

  const handleSlider = (ch, val) => {
    val = Math.max(0, Math.min(255, parseInt(val) || 0));
    const updated = { ...currentColor, [ch]: val, name: 'Custom' };
    setCurrentColor(updated);
  };

  const handleCT = (k) => {
    k = Math.max(1000, Math.min(40000, parseInt(k) || 5600));
    setCurrentCT(k);
    const rgb = kelvinToRGB(k);
    setCurrentColor({ ...rgb, name: `${k}K` });
  };

  const saveCustomColor = () => {
    if (!customName.trim()) {
      showToast('Enter a color name first');
      return;
    }
    const newColor = {
      name: customName.trim(),
      r: currentColor.r,
      g: currentColor.g,
      b: currentColor.b,
    };
    const updated = [...customColors, newColor];
    setCustomColors(updated);
    localStorage.setItem('photon_custom_colors', JSON.stringify(updated));
    setCustomName('');
    showToast(`"${newColor.name}" saved!`);
  };

  const deleteCustomColor = (index) => {
    const updated = [...customColors];
    updated.splice(index, 1);
    setCustomColors(updated);
    localStorage.setItem('photon_custom_colors', JSON.stringify(updated));
    showToast('Color deleted');
  };

  const { r, g, b, name } = currentColor;
  const adjusted = getAdjustedColor();
  const colorCSS = `rgb(${adjusted.r},${adjusted.g},${adjusted.b})`;
  const brt =
    (adjusted.r * 299 + adjusted.g * 587 + adjusted.b * 114) / 1000;
  const textOnColor =
    brt > 128 ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)';

  const labelStyle = {
    padding: '16px 24px 10px',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'var(--text3)',
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          padding: '56px 24px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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
            Photon
          </div>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text3)',
              marginTop: 2,
              letterSpacing: 0.3,
            }}
          >
            Lighting Studio
          </p>
        </div>
      </div>

      {/* Color Display */}
      <div style={{ padding: '0 20px' }}>
        <div
          style={{
            width: '100%',
            height: 200,
            borderRadius: 20,
            background: colorCSS,
            position: 'relative',
            transition: 'background 0.3s ease',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 16,
              fontSize: 13,
              fontWeight: 700,
              color: textOnColor,
              background:
                brt > 128
                  ? 'rgba(0,0,0,0.12)'
                  : 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              padding: '5px 12px',
              borderRadius: 8,
            }}
          >
            {name}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: 16,
              fontSize: 11,
              fontWeight: 600,
              color: textOnColor,
              opacity: 0.7,
            }}
          >
            {adjusted.r}, {adjusted.g}, {adjusted.b} · {brightness}%
          </div>
          <button
            onClick={onFullscreen}
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              width: 40,
              height: 40,
              background:
                brt > 128
                  ? 'rgba(0,0,0,0.15)'
                  : 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${brt > 128 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: textOnColor,
            }}
          >
            <HiArrowsPointingOut size={18} />
          </button>
        </div>
      </div>

      {/* Brightness Slider */}
      <div style={{ padding: '16px 20px 0' }}>
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <HiSun size={16} color="var(--text2)" />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text2)',
                }}
              >
                Brightness
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <input
                type="number"
                min={0}
                max={100}
                value={brightness}
                onChange={(e) => {
                  let v = Math.max(
                    0,
                    Math.min(100, parseInt(e.target.value) || 0)
                  );
                  setBrightness(v);
                }}
                style={{
                  width: 48,
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text)',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border2)',
                  borderRadius: 6,
                  padding: '3px 6px',
                  outline: 'none',
                  fontFamily: 'var(--font)',
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--text3)',
                  fontWeight: 600,
                }}
              >
                %
              </span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={brightness}
            onChange={(e) => setBrightness(parseInt(e.target.value))}
            style={{
              background: `linear-gradient(to right, #000 0%, rgb(${r},${g},${b}) 100%)`,
            }}
          />
        </div>
      </div>

      {/* Mode Tabs */}
      <div
        style={{
          display: 'flex',
          background: 'var(--surface2)',
          borderRadius: 'var(--radius-xs)',
          padding: 3,
          margin: '16px 20px 0',
        }}
      >
        {['rgb', 'ct'].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              padding: '10px 0',
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 600,
              color: mode === m ? 'var(--text)' : 'var(--text3)',
              borderRadius: 7,
              cursor: 'pointer',
              border: 'none',
              background:
                mode === m ? 'var(--surface3)' : 'transparent',
              transition: 'all 0.2s',
              fontFamily: 'var(--font)',
            }}
          >
            {m === 'rgb' ? 'RGB Color' : 'Color Temp'}
          </button>
        ))}
      </div>

      {/* ════════════════════ RGB PANEL ════════════════════ */}
      {mode === 'rgb' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          {/* ─── MANUAL RGB FIRST ─── */}
          <div style={labelStyle}>Manual RGB</div>
          <div style={{ padding: '0 20px 8px' }}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '16px',
              }}
            >
              {['r', 'g', 'b'].map((ch) => {
                const label =
                  ch === 'r' ? 'Red' : ch === 'g' ? 'Green' : 'Blue';
                const gradColor =
                  ch === 'r'
                    ? '#ff0000'
                    : ch === 'g'
                      ? '#00cc00'
                      : '#0066ff';
                const dotColor =
                  ch === 'r'
                    ? '#ff4444'
                    : ch === 'g'
                      ? '#44cc44'
                      : '#4488ff';
                return (
                  <div key={ch} style={{ marginBottom: ch === 'b' ? 0 : 16 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: dotColor,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--text2)',
                          }}
                        >
                          {label}
                        </span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={255}
                        value={currentColor[ch]}
                        onChange={(e) =>
                          handleSlider(ch, e.target.value)
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
                      value={currentColor[ch]}
                      onChange={(e) =>
                        handleSlider(ch, e.target.value)
                      }
                      style={{
                        background: `linear-gradient(to right, #000, ${gradColor})`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── CINEMATIC PRESETS ─── */}
          <div style={labelStyle}>Cinematic Presets</div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              padding: '0 20px 4px',
              scrollbarWidth: 'none',
            }}
          >
            {cinematicPresets.map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  setActivePreset(i);
                  applyColor(p.colors[0]);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  background:
                    activePreset === i
                      ? 'var(--surface3)'
                      : 'var(--surface2)',
                  border: `1px solid ${activePreset === i ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
                  borderRadius: 20,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  color:
                    activePreset === i
                      ? 'var(--text)'
                      : 'var(--text2)',
                  flexShrink: 0,
                  fontFamily: 'var(--font)',
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: `rgb(${p.colors[0].r},${p.colors[0].g},${p.colors[0].b})`,
                  }}
                />
                {p.name}
              </button>
            ))}
          </div>

          {/* Sub-colors */}
          {activePreset !== null && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                padding: '8px 20px',
                animation: 'fadeIn 0.2s',
              }}
            >
              {cinematicPresets[activePreset].colors.map((c, j) => (
                <button
                  key={j}
                  onClick={() => applyColor(c)}
                  style={{
                    flex: 1,
                    padding: '10px 6px',
                    borderRadius: 10,
                    background: `rgb(${c.r},${c.g},${c.b})`,
                    border: 'none',
                    fontSize: 10,
                    fontWeight: 700,
                    color:
                      (c.r * 299 + c.g * 587 + c.b * 114) / 1000 >
                      128
                        ? '#000'
                        : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* ─── BASIC COLORS ─── */}
          <div style={labelStyle}>Basic Colors</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 10,
              padding: '0 20px 8px',
            }}
          >
            {basicColors.map((c, i) => {
              const isActive =
                c.r === r && c.g === g && c.b === b && c.name === name;
              return (
                <button
                  key={i}
                  onClick={() => applyColor(c)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 'var(--radius-xs)',
                    background: `rgb(${c.r},${c.g},${c.b})`,
                    border: isActive
                      ? '2px solid white'
                      : '2px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: 6,
                    transition: 'transform 0.15s',
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color:
                        (c.r * 299 + c.g * 587 + c.b * 114) / 1000 >
                        128
                          ? 'rgba(0,0,0,0.5)'
                          : 'rgba(255,255,255,0.8)',
                      lineHeight: 1.2,
                    }}
                  >
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ─── CUSTOM COLORS ─── */}
          {customColors.length > 0 && (
            <>
              <div style={labelStyle}>Your Colors</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 10,
                  padding: '0 20px 8px',
                }}
              >
                {customColors.map((c, i) => {
                  const isActive =
                    c.r === r &&
                    c.g === g &&
                    c.b === b &&
                    c.name === name;
                  return (
                    <button
                      key={i}
                      onClick={() => applyColor(c)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        deleteCustomColor(i);
                      }}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 'var(--radius-xs)',
                        background: `rgb(${c.r},${c.g},${c.b})`,
                        border: isActive
                          ? '2px solid white'
                          : '2px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color:
                            (c.r * 299 + c.g * 587 + c.b * 114) /
                              1000 >
                            128
                              ? 'rgba(0,0,0,0.5)'
                              : 'rgba(255,255,255,0.8)',
                          lineHeight: 1.2,
                        }}
                      >
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ─── SAVE CUSTOM COLOR ─── */}
          <div style={labelStyle}>Save Custom Color</div>
          <div style={{ padding: '0 20px 20px' }}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 16,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: 56,
                  borderRadius: 'var(--radius-xs)',
                  background: colorCSS,
                  marginBottom: 12,
                  transition: 'background 0.2s',
                }}
              />
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Color name (e.g. Sunset Orange)"
                onKeyDown={(e) =>
                  e.key === 'Enter' && saveCustomColor()
                }
                style={{
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
                }}
              />
              <button
                onClick={saveCustomColor}
                style={{
                  width: '100%',
                  padding: 14,
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border2)',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'var(--surface2)',
                  color: 'var(--text)',
                  fontFamily: 'var(--font)',
                  transition: 'all 0.2s',
                }}
              >
                Save Color
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ COLOR TEMP PANEL ════════════════════ */}
      {mode === 'ct' && (
        <div style={{ padding: 20, animation: 'fadeIn 0.2s ease' }}>
          {/* Display */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <span
              style={{
                fontSize: 56,
                fontWeight: 800,
                letterSpacing: -3,
                color: 'var(--text)',
              }}
            >
              {currentCT >= 1000
                ? (currentCT / 1000).toFixed(
                    currentCT % 1000 === 0 ? 0 : 1
                  )
                : currentCT}
            </span>
            <span
              style={{
                fontSize: 20,
                color: 'var(--text2)',
                marginLeft: 2,
                fontWeight: 500,
              }}
            >
              {currentCT >= 1000 ? ',000 K' : ' K'}
            </span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={1000}
            max={40000}
            step={100}
            value={currentCT}
            onChange={(e) => handleCT(e.target.value)}
            style={{
              background:
                'linear-gradient(to right, #ff4500, #ff8c00, #ffd700, #fffacd, #ffffff, #d0e8ff, #87ceeb, #4682b4, #2e8b8b, #008080)',
              marginBottom: 20,
            }}
          />

          {/* Manual Input */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <input
              type="number"
              min={1000}
              max={40000}
              step={100}
              value={currentCT}
              onChange={(e) => handleCT(e.target.value)}
              style={{
                flex: 1,
                background: 'var(--surface2)',
                border: '1px solid var(--border2)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text)',
                fontSize: 16,
                fontWeight: 600,
                padding: '12px 16px',
                outline: 'none',
                textAlign: 'center',
                fontFamily: 'var(--font)',
              }}
            />
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--text2)',
              }}
            >
              K
            </span>
          </div>

          {/* Common Values */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: 'var(--text3)',
              marginBottom: 12,
            }}
          >
            Presets
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}
          >
            {ctPresets.map((p, i) => {
              const rgb = kelvinToRGB(p.k);
              const isActive = currentCT === p.k;
              return (
                <button
                  key={i}
                  onClick={() => handleCT(p.k)}
                  style={{
                    padding: '14px 8px',
                    background: isActive
                      ? 'var(--surface3)'
                      : 'var(--surface2)',
                    border: isActive
                      ? '1px solid rgba(255,255,255,0.3)'
                      : '1px solid var(--border)',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font)',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      margin: '0 auto 8px',
                      background: `rgb(${rgb.r},${rgb.g},${rgb.b})`,
                      boxShadow: `0 0 12px rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--text)',
                    }}
                  >
                    {p.k >= 1000
                      ? `${(p.k / 1000).toFixed(p.k % 1000 === 0 ? 0 : 1)}K`
                      : `${p.k}K`}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--text3)',
                      marginTop: 2,
                    }}
                  >
                    {p.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ height: 80 }} />
    </div>
  );
}