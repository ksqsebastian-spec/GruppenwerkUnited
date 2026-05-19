'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DoorOpen } from 'lucide-react';
import { CSS, FRAMES, startRain } from './crab-lair-assets';
import { Ceiling, Fireplace, RoomCenter, Shelf } from './crab-lair-scenery';

interface CrabLairProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Easter-Egg-Overlay: pixelartiges Lese-Versteck mit Regen, Kamin und ESC-Schließen.
 */
export function CrabLair({ isOpen, onClose }: CrabLairProps): React.JSX.Element | null {
  const [fi, setFi] = useState(0);
  const stopRef = useRef<() => void>(() => {});

  // Lese-Animation des Krebses
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => setFi((p) => (p + 1) % FRAMES.length), 480);
    return () => clearInterval(id);
  }, [isOpen]);

  // Regen-Audio starten / stoppen
  useEffect(() => {
    if (!isOpen) return;
    stopRef.current = startRain();
    return () => stopRef.current();
  }, [isOpen]);

  const handleClose = useCallback((): void => {
    onClose();
  }, [onClose]);

  // ESC-Taste zum Schließen
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="lair-wrapper"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, overflow: 'hidden', background: '#0F0906' }}
    >
      <style>{CSS}</style>

      <div
        className="glow-wrap"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse 52% 46% at 78% 60%, rgba(255,148,30,.38) 0%, transparent 68%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse 84% 80% at 50% 50%, transparent 38%, rgba(0,0,0,.7) 100%)',
        }}
      />

      <Ceiling />

      {/* Linke Wand – Bücherregal */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '16%',
          bottom: '14%',
          width: '13%',
          background: '#271610',
          borderRight: '4px solid #1C0F08',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Shelf />
      </div>

      <Fireplace />

      <RoomCenter frameIndex={fi} />

      {/* Bodenfries (Holzdielen) */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '14%',
          background: '#5C2E10',
          borderTop: '4px solid #3D1E08',
          display: 'flex',
        }}
      >
        {Array.from({ length: 14 }, (__, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              borderLeft: '2px solid rgba(0,0,0,.22)',
              background: i % 2 === 0 ? 'rgba(255,255,255,.018)' : 'transparent',
            }}
          />
        ))}
      </div>

      {/* Verlassen-Button */}
      <button
        onClick={handleClose}
        style={
          {
            position: 'absolute',
            bottom: 16,
            right: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#5C2E10',
            border: '3px solid #2A1208',
            color: '#F0DDB0',
            fontFamily: '"Courier New", monospace',
            fontSize: 12,
            fontWeight: 'bold',
            letterSpacing: 2,
            padding: '7px 14px',
            cursor: 'pointer',
            boxShadow: '3px 3px 0 #1C0F08, 0 0 14px rgba(255,120,20,.28)',
            imageRendering: 'pixelated',
          } as React.CSSProperties
        }
        onMouseEnter={(e) => (e.currentTarget.style.background = '#7A4020')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#5C2E10')}
      >
        <DoorOpen size={14} />
        VERLASSEN
      </button>
    </div>
  );
}
