'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ANIM_FRAMES, ANIM_FPS, ANIM_LOOP, type PixelFrame, type AnimName } from '@/lib/mascot-frames';

const PX   = 5;  // SVG-Einheiten pro Logik-Pixel
const COLS = 14;
const ROWS = 14;

/** Blauer Pixel-Art Werkbank-Krebs — lebt in der unteren linken Ecke */
export function MascotCrab(): React.JSX.Element {
  const [anim, setAnim]           = useState<AnimName>('idle');
  const [frameIdx, setFrameIdx]   = useState(0);
  const [pos, setPos]             = useState({ x: 0, y: 0 });
  const [scuttling, setScuttling] = useState(false);
  const [facingRight, setFacingRight] = useState(false);

  // Schlaf-Modus: per Klick umschalten
  const [sleeping, setSleeping]   = useState(false);
  const sleepingRef = useRef(sleeping);
  sleepingRef.current = sleeping;

  // Peek-Zustand: 'none' | 'entering' (sofort unter Kante) | 'showing' (sichtbar) | 'leaving'
  const [peekPhase, setPeekPhase] = useState<'none'|'entering'|'showing'|'leaving'>('none');

  const animRef = useRef(anim);
  animRef.current = anim;

  // ─── Schlaf-Modus: Animation erzwingen ────────────────────────────────────
  useEffect(() => {
    if (sleeping) {
      // Beim Einschlafen: Schlaf-Animation setzen und Peek beenden
      setAnim('sleep');
      setPeekPhase('none');
    } else {
      // Beim Aufwachen: zurück zu idle
      setAnim('idle');
    }
  }, [sleeping]);

  // ─── Frame-Ticker ──────────────────────────────────────────────────────────
  useEffect(() => {
    const frames = ANIM_FRAMES[anim];
    const loop   = ANIM_LOOP[anim];
    setFrameIdx(0);
    const id = setInterval(() => {
      setFrameIdx(prev => {
        const next = prev + 1;
        if (next >= frames.length) {
          if (!loop) {
            // Beim Aufwachen nach nicht-loopenden Animationen: zurück zu idle
            if (!sleepingRef.current) setAnim('idle');
            return 0;
          }
          return 0;
        }
        return next;
      });
    }, 1000 / ANIM_FPS[anim]);
    return () => clearInterval(id);
  }, [anim]);

  // ─── Aktions-Auswahl (pausiert während Schlaf) ────────────────────────────
  const pickNext = useCallback((): void => {
    // Im Schlaf-Modus keine spontanen Aktionen
    if (sleepingRef.current) return;
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
      setTimeout(() => { if (animRef.current === 'sleep' && !sleepingRef.current) setAnim('idle'); }, 5500);
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

  // ─── Klick-Handler: Schlafen / Aufwachen umschalten ───────────────────────
  const handleClick = useCallback((): void => {
    if (sleepingRef.current) {
      // Aufwachen: Schlaf-Modus beenden
      setSleeping(false);
    } else if (animRef.current === 'idle' || animRef.current === 'blink') {
      // Einschlafen: Schlaf-Modus aktivieren
      setSleeping(true);
    } else if (animRef.current === 'sleep') {
      // Zufällig schlafend (nicht per Klick) → per Klick feiern
      setAnim('celebrate');
    } else {
      // Andere Animation läuft → feiern
      setAnim('celebrate');
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

  // Tooltip-Text: "Aufwachen" wenn schlafend, sonst "Schlafen"
  const tooltipText = sleeping ? 'Aufwachen' : 'Schlafen';

  return (
    <div
      className={`fixed z-50 select-none cursor-pointer${sleeping ? ' crab-sleeping' : ''}`}
      style={{
        bottom: `${bottomPx}px`,
        left:   `${16 + pos.x}px`,
        transition,
      }}
      onClick={handleClick}
      title={tooltipText}
    >
      <PixelSprite frame={frame} flip={facingRight && anim === 'walk'} />
    </div>
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
