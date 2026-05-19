/**
 * Pixel-Art-Assets und CSS-Animationen für den CrabLair Easter Egg.
 */

// ─── Lese-Pose Pixel-Frames (14 × 14) ────────────────────────────────────────
const B = '#2563EB';
const Ds = '#1D4ED8';
const E = '#1A1A1A';
const Rb = '#8B1A1A';
const Pg = '#F5E6C8';
const _ = '';

export type PF = string[][];

const cl = (f: PF): PF => f.map((r) => [...r]);

const F0: PF = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, B, B, B, B, B, B, B, B, B, B, _, _],
  [_, _, B, B, E, E, B, B, E, E, B, B, _, _],
  [B, B, B, B, Ds, Ds, B, B, Ds, Ds, B, B, B, B],
  [B, B, Rb, Rb, Rb, Rb, Rb, Rb, Rb, Rb, Rb, Rb, B, B],
  [_, _, Pg, Pg, Pg, Pg, Pg, Pg, Pg, Pg, Pg, Pg, _, _],
  [_, _, Rb, Rb, Rb, Rb, Rb, Rb, Rb, Rb, Rb, Rb, _, _],
  [_, _, _, B, B, _, _, B, B, _, _, _, _, _],
  [_, _, _, B, B, _, _, B, B, _, _, _, _, _],
  [_, _, _, B, B, _, _, B, B, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

// Leichtes Nicken (Augen-Glanz verschoben)
const F1 = cl(F0);
F1[5][4] = Ds;
F1[5][8] = Ds;

// Umblättern: linke Klaue kurz hochgestreckt
const F2 = cl(F0);
F2[7][0] = _;
F2[7][1] = _;
F2[4][0] = B;
F2[4][1] = B;

export const FRAMES: PF[] = [F0, F1, cl(F0), F2, cl(F0)];

// ─── CSS-Keyframe-Animationen ─────────────────────────────────────────────────
export const CSS = `
  @keyframes lair-in {
    from { opacity:0; transform:scale(.97) }
    to   { opacity:1; transform:scale(1) }
  }
  @keyframes flicker {
    0%   { opacity:.82; transform:scaleY(.94) scaleX(1.04) }
    100% { opacity:1;   transform:scaleY(1.1)  scaleX(.96) }
  }
  @keyframes glow-pulse { 0%,100%{opacity:.18} 50%{opacity:.44} }
  @keyframes rain-drop  {
    from { transform:translateY(-110%) translateX(0) }
    to   { transform:translateY(120%)  translateX(-18px) }
  }
  .lair-wrapper { animation: lair-in .65s cubic-bezier(.2,.8,.3,1) both }
  .f-out  { animation: flicker .44s ease-in-out infinite alternate }
  .f-mid  { animation: flicker .30s ease-in-out infinite alternate-reverse }
  .f-core { animation: flicker .20s ease-in-out infinite alternate }
  .glow-wrap { animation: glow-pulse 2.5s ease-in-out infinite }
`;

// ─── Regen-Sound (Web Audio API, keine externen Dateien) ──────────────────────
export function startRain(): () => void {
  try {
    const ctx = new AudioContext();
    const sr = ctx.sampleRate;
    const buf = ctx.createBuffer(1, sr * 3, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2600;
    bp.Q.value = 0.35;

    const hi = ctx.createBiquadFilter();
    hi.type = 'highshelf';
    hi.frequency.value = 8000;
    hi.gain.value = -8;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 2);

    src.connect(bp);
    bp.connect(hi);
    hi.connect(g);
    g.connect(ctx.destination);
    src.start();

    return () => {
      try {
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.7);
        setTimeout(() => {
          try {
            ctx.close();
          } catch {
            /* ignoriert */
          }
        }, 900);
      } catch {
        /* ignoriert */
      }
    };
  } catch {
    return () => {};
  }
}

export const BOOK_COLS = [
  '#8B2020',
  '#1A3A6B',
  '#2A5A1A',
  '#6B4A10',
  '#4A1A6B',
  '#8B5A10',
  '#1A5A5A',
  '#8B1A4A',
  '#3A6B2A',
];
