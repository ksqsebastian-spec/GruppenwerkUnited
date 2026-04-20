'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ANIM_FRAMES, ANIM_FPS, ANIM_LOOP, type PixelFrame, type AnimName } from '@/lib/mascot-frames';
import { CrabLair } from '@/components/shared/crab-lair';

const PX   = 5;  // SVG-Einheiten pro Logik-Pixel
const COLS = 14;
const ROWS = 14;

interface MascotCrabProps {
  onHide?: () => void;
}

/** Blauer Pixel-Art Werkbank-Krebs — lebt in der unteren linken Ecke */
export function MascotCrab({ onHide }: MascotCrabProps): React.JSX.Element {
  const [anim, setAnim]           = useState<AnimName>('idle');
  const [frameIdx, setFrameIdx]   = useState(0);
  const [pos, setPos]             = useState({ x: 0, y: 0 });
  const [scuttling, setScuttling] = useState(false);
  const [facingRight, setFacingRight] = useState(false);

  // Easter Egg: Krabben-Höhle nach 5 Klicks öffnen
  const [lairOpen, setLairOpen]   = useState(false);
  const clickCountRef             = useRef(0);

  // Peek-Zustand: 'none' | 'entering' (sofort unter Kante) | 'showing' (sichtbar) | 'leaving'
  const [peekPhase, setPeekPhase] = useState<'none'|'entering'|'showing'|'leaving'>('none');

  const animRef = useRef(anim);
  animRef.current = anim;

  // ─── Frame-Ticker ─────────────────────────────────────────────────────────
  useEffect(() => {
    const frames = ANIM_FRAMES[anim];
    const loop   = ANIM_LOOP[anim];
    setFrameIdx(0);
    const id = setInterval(() => {
      setFrameIdx(prev => {
        const next = prev + 1;
        if (next >= frames.length) {
          if (!loop) {
            setAnim('idle');
            return 0;
          }
          return 0;
        }
        return next;
      });
    }, 1000 / ANIM_FPS[anim]);
    return () => clearInterval(id);
  }, [anim]);

  // ─── Aktions-Auswahl ─────────────────────────────────────────────────────
  const pickNext = useCallback((): void => {
    if (animRef.current !== 'idle') return;
    const roll = Math.random();

    if (roll < 0.28) {
      // Trappeln
      const dx = (Math.random() - 0.5) * 64;
      const dy = (Math.random() - 0.4) * 20;
      setPos(prev => ({
        x: Math.max(0, Math.min(64, prev.x + dx)),
        y: Math.max(-8, Math.min(12, prev.y + dy)),
      }));
      setFacingRight(dx > 0);
      setScuttling(true);
      setAnim('walk');
      setTimeout(() => { setScuttling(false); setAnim('idle'); }, 850);
    } else if (roll < 0.40) {
      setAnim('blink');
    } else if (roll < 0.51) {
      setAnim('wave');
    } else if (roll < 0.60) {
      setAnim('dance');
    } else if (roll < 0.68) {
      setAnim('hammer');
    } else if (roll < 0.75) {
      setAnim('type');
      setTimeout(() => { if (animRef.current === 'type') setAnim('idle'); }, 4000);
    } else if (roll < 0.81) {
      setAnim('sleep');
      setTimeout(() => { if (animRef.current === 'sleep') setAnim('idle'); }, 5500);
    } else if (roll < 0.92) {
      // Peek: zuerst unter Bildschirmkante, dann hochschieben, dann wieder weg
      setAnim('peek');
      setPeekPhase('entering');
      requestAnimationFrame(() => requestAnimationFrame(() => setPeekPhase('showing')));
      setTimeout(() => setPeekPhase('leaving'), 2200);
      setTimeout(() => { setPeekPhase('none'); setAnim('idle'); }, 2900);
    }
    // sonst: idle
  }, []);

  useEffect(() => {
    const id = setInterval(pickNext, 2500);
    return () => clearInterval(id);
  }, [pickNext]);

  // ─── Klick-Handler: 5 Klicks öffnen die Krabben-Höhle ────────────────────
  const handleClick = useCallback((): void => {
    clickCountRef.current += 1;

    // Jeder Klick: kurze Celebrate-Animation als Feedback
    setAnim('celebrate');
    setPeekPhase('none');

    if (clickCountRef.current >= 5) {
      // 5. Klick: Höhle öffnen, Zähler zurücksetzen
      clickCountRef.current = 0;
      setTimeout(() => setLairOpen(true), 500);
    } else {
      // 1.–4. Klick: Animation wieder auf Idle zurücksetzen
      setTimeout(() => {
        if (animRef.current === 'celebrate') setAnim('idle');
      }, 700);
    }
  }, []);

  // ─── CSS-Position ──────────────────────────────────────────────────────────
  const hiddenBottom = -(ROWS * PX + 12);
  let bottomPx: number;
  let transition: string;

  if (peekPhase === 'none') {
    bottomPx   = 16 - pos.y;
    transition = scuttling ? 'bottom 0.85s ease-in-out, left 0.85s ease-in-out' : 'none';
  } else if (peekPhase === 'entering') {
    bottomPx   = hiddenBottom;
    transition = 'none';
  } else if (peekPhase === 'showing') {
    bottomPx   = 20;
    transition = 'bottom 0.5s ease-out';
  } else {
    bottomPx   = hiddenBottom;
    transition = 'bottom 0.5s ease-in';
  }

  const frame = ANIM_FRAMES[anim][Math.min(frameIdx, ANIM_FRAMES[anim].length - 1)];

  return (
    <>
      <div
        className="fixed z-50 select-none cursor-pointer"
        style={{
          bottom: `${bottomPx}px`,
          left:   `${16 + pos.x}px`,
          transition,
        }}
        onClick={handleClick}
        title="🦀"
      >
        <PixelSprite frame={frame} flip={facingRight && anim === 'walk'} />
      </div>

      {/* Ausblenden-Button */}
      {onHide && (
        <button
          className="fixed bottom-3 left-3 z-40 text-xs leading-none opacity-30 hover:opacity-80 transition-opacity select-none"
          onClick={onHide}
          title="Maskottchen ausblenden"
        >
          ✕
        </button>
      )}

      {/* Easter Egg: Krabben-Höhle */}
      <CrabLair isOpen={lairOpen} onClose={() => setLairOpen(false)} />
    </>
  );
}

// ─── SVG-Renderer ─────────────────────────────────────────────────────────────
function PixelSprite({ frame, flip }: { frame: PixelFrame; flip: boolean }): React.JSX.Element {
  const rects: React.JSX.Element[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const color = frame[row]?.[col];
      if (!color) continue;
      rects.push(
        <rect
          key={`${row}-${col}`}
          x={col * PX}
          y={row * PX}
          width={PX}
          height={PX}
          fill={color}
        />
      );
    }
  }
  return (
    <svg
      width={COLS * PX}
      height={ROWS * PX}
      viewBox={`0 0 ${COLS * PX} ${ROWS * PX}`}
      style={{
        imageRendering: 'pixelated',
        transform: flip ? 'scaleX(-1)' : undefined,
      }}
    >
      {rects}
    </svg>
  );
}
