'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DoorOpen } from 'lucide-react';

// ─── Lese-Pose Pixel-Frames (14 × 14) ────────────────────────────────────────
const B = '#2563EB', Ds = '#1D4ED8', E = '#1A1A1A', Rb = '#8B1A1A', Pg = '#F5E6C8', _ = '';
type PF = string[][];
const cl = (f: PF): PF => f.map(r => [...r]);

const F0: PF = [
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,B,B,B,B,B,B,B,B,B,B,_,_],
  [_,_,B,B,E,E,B,B,E,E,B,B,_,_],
  [B,B,B,B,Ds,Ds,B,B,Ds,Ds,B,B,B,B],
  [B,B,Rb,Rb,Rb,Rb,Rb,Rb,Rb,Rb,Rb,Rb,B,B],
  [_,_,Pg,Pg,Pg,Pg,Pg,Pg,Pg,Pg,Pg,Pg,_,_],
  [_,_,Rb,Rb,Rb,Rb,Rb,Rb,Rb,Rb,Rb,Rb,_,_],
  [_,_,_,B,B,_,_,B,B,_,_,_,_,_],
  [_,_,_,B,B,_,_,B,B,_,_,_,_,_],
  [_,_,_,B,B,_,_,B,B,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
];
// Leichtes Nicken (Augen-Glanz verschoben)
const F1 = cl(F0); F1[5][4] = Ds; F1[5][8] = Ds;
// Umblättern: linke Klaue kurz hochgestreckt
const F2 = cl(F0); F2[7][0] = _; F2[7][1] = _; F2[4][0] = B; F2[4][1] = B;

const FRAMES: PF[] = [F0, F1, cl(F0), F2, cl(F0)];

// ─── CSS-Keyframe-Animationen ─────────────────────────────────────────────────
const CSS = `
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
function startRain(): () => void {
  try {
    const ctx = new AudioContext();
    const sr  = ctx.sampleRate;
    const buf = ctx.createBuffer(1, sr * 3, sr);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;

    const bp  = ctx.createBiquadFilter();
    bp.type   = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.35;

    const hi  = ctx.createBiquadFilter();
    hi.type   = 'highshelf'; hi.frequency.value = 8000; hi.gain.value = -8;

    const g   = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 2);

    src.connect(bp); bp.connect(hi); hi.connect(g); g.connect(ctx.destination);
    src.start();

    return () => {
      try {
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.7);
        setTimeout(() => { try { ctx.close(); } catch { /* ignoriert */ } }, 900);
      } catch { /* ignoriert */ }
    };
  } catch { return () => {}; }
}

// ─── Pixel-Sprite-Renderer ────────────────────────────────────────────────────
function PSprite({ frame, scale = 8 }: { frame: PF; scale?: number }): React.JSX.Element {
  const rects: React.JSX.Element[] = [];
  for (let r = 0; r < 14; r++)
    for (let c = 0; c < 14; c++) {
      const col = frame[r]?.[c];
      if (!col) continue;
      rects.push(<rect key={`${r}-${c}`} x={c * scale} y={r * scale} width={scale} height={scale} fill={col} />);
    }
  return (
    <svg
      width={14 * scale} height={14 * scale}
      viewBox={`0 0 ${14 * scale} ${14 * scale}`}
      style={{ imageRendering: 'pixelated', transform: 'scaleX(-1)' }}
    >
      {rects}
    </svg>
  );
}

// ─── Bücherregal ─────────────────────────────────────────────────────────────
const BOOK_COLS = ['#8B2020','#1A3A6B','#2A5A1A','#6B4A10','#4A1A6B','#8B5A10','#1A5A5A','#8B1A4A','#3A6B2A'];
function Shelf(): React.JSX.Element {
  const shelves: [number, number][] = [[0,3],[3,6],[6,9]];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, padding:6 }}>
      {shelves.map(([a, b], si) => (
        <div key={si} style={{
          display:'flex', gap:2, alignItems:'flex-end',
          background:'#3D1E08', border:'2px solid #2A1208',
          padding:'3px 4px 0', height:32,
        }}>
          {BOOK_COLS.slice(a, b).map((c, i) => (
            <div key={i} style={{
              width: 7 + i % 3 * 2, height: 18 + i % 2 * 6,
              background: c, border: '1px solid rgba(0,0,0,.4)',
              alignSelf: 'flex-end',
            }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Haupt-Overlay ────────────────────────────────────────────────────────────
interface CrabLairProps { isOpen: boolean; onClose: () => void; }

export function CrabLair({ isOpen, onClose }: CrabLairProps): React.JSX.Element | null {
  const [fi, setFi]   = useState(0);
  const stopRef       = useRef<() => void>(() => {});

  // Lese-Animation des Krebses
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => setFi(p => (p + 1) % FRAMES.length), 480);
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
    const h = (e: KeyboardEvent): void => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  // Regentropfen im Fenster
  const drops = Array.from({ length: 14 }, (__, i) => (
    <div key={i} style={{
      position:'absolute', width:1.5, height: 6 + i % 4 * 3,
      background: 'rgba(110,155,200,.6)',
      left: `${4 + i * 6.8}%`, top: 0,
      animation: `rain-drop ${.6 + i * .06}s linear ${i * .09}s infinite`,
      transform: 'rotate(-12deg)',
    }} />
  ));

  return (
    <div className="lair-wrapper" style={{ position:'fixed', inset:0, zIndex:9999, overflow:'hidden', background:'#0F0906' }}>
      <style>{CSS}</style>

      {/* Warmes Feuerleuchten von rechts */}
      <div className="glow-wrap" style={{
        position:'absolute', inset:0, pointerEvents:'none',
        background:'radial-gradient(ellipse 52% 46% at 78% 60%, rgba(255,148,30,.38) 0%, transparent 68%)',
      }} />

      {/* Vignette – Ränder abdunkeln */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        background:'radial-gradient(ellipse 84% 80% at 50% 50%, transparent 38%, rgba(0,0,0,.7) 100%)',
      }} />

      {/* ── Decke / Steinbogen ─────────────────────────────────────────────── */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:'16%',
        background:'#1C0F08', borderBottom:'4px solid #2D1810',
        display:'flex', alignItems:'flex-end',
      }}>
        {/* Steinblock-Textur */}
        {Array.from({ length: 10 }, (__, i) => (
          <div key={i} style={{
            flex:1, height: i % 2 === 0 ? '62%' : '78%',
            background: i % 2 === 0 ? '#2D1810' : '#251208',
            borderLeft: '2px solid #1C0F08',
          }} />
        ))}

        {/* Rundes Fenster mit Regen */}
        <div style={{
          position:'absolute', top:8, left:'50%', transform:'translateX(-50%)',
          width:108, height:72,
          borderRadius:'50% 50% 42% 42%',
          background:'#06080E', border:'5px solid #3D2010',
          overflow:'hidden',
        }}>
          {/* Sterne */}
          {[10,28,48,68,85,20,60].map((l, i) => (
            <div key={i} style={{
              position:'absolute', width:2, height:2, background:'#D8D4C4',
              left:`${l}%`, top:`${6 + i % 3 * 14}%`, opacity:.5,
            }} />
          ))}
          {/* Regen */}
          <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>{drops}</div>
        </div>
      </div>

      {/* ── Linke Wand – Bücherregal ─────────────────────────────────────── */}
      <div style={{
        position:'absolute', left:0, top:'16%', bottom:'14%', width:'13%',
        background:'#271610', borderRight:'4px solid #1C0F08',
        display:'flex', flexDirection:'column', justifyContent:'center',
      }}>
        <Shelf />
      </div>

      {/* ── Rechte Wand – Kamin ─────────────────────────────────────────── */}
      <div style={{
        position:'absolute', right:0, top:'16%', bottom:'14%', width:'20%',
        background:'#221408', borderLeft:'4px solid #1C0F08',
      }}>
        {/* Kamin-Körper */}
        <div style={{
          position:'absolute', bottom:0, left:'8%', right:'8%', height:'74%',
          background:'#4A3525', border:'5px solid #3A2818',
        }}>
          {/* Kamin-Öffnung */}
          <div style={{ position:'absolute', bottom:10, left:8, right:8, top:14, background:'#060402' }}>
            {/* Feuer – drei geschichtete Zungen */}
            <div className="f-out" style={{
              position:'absolute', bottom:0, left:'8%', right:'8%', height:'72%',
              background:'linear-gradient(to top,#AA2200,#DD4400)',
              borderRadius:'46% 46% 18% 18%',
            }}>
              <div className="f-mid" style={{
                position:'absolute', bottom:0, left:'12%', right:'12%', height:'82%',
                background:'linear-gradient(to top,#EE5500,#FF8800)',
                borderRadius:'46% 46% 18% 18%',
              }}>
                <div className="f-core" style={{
                  position:'absolute', bottom:0, left:'18%', right:'18%', height:'78%',
                  background:'linear-gradient(to top,#FF9900,#FFDD00)',
                  borderRadius:'46% 46% 18% 18%',
                }} />
              </div>
            </div>
            {/* Holzscheite */}
            <div style={{
              position:'absolute', bottom:0, left:0, right:0, height:10,
              background:'#3D1E08', borderTop:'3px solid #5C2E10',
              display:'flex', gap:3, padding:'0 3px',
            }}>
              {[38,26,34].map((w, i) => (
                <div key={i} style={{ width:w, height:7, background:'#2A1208', borderRadius:1 }} />
              ))}
            </div>
          </div>
          {/* Kaminsims */}
          <div style={{
            position:'absolute', top:-8, left:-10, right:-10, height:14,
            background:'#6B5545', border:'3px solid #5A4535',
          }} />
          {/* Kerze auf dem Sims */}
          <div style={{ position:'absolute', top:-28, right:10, width:6, height:16, background:'#EED8A4' }}>
            <div style={{
              position:'absolute', top:-7, left:'50%', transform:'translateX(-50%)',
              width:5, height:7,
              background:'#FF9900', borderRadius:'50% 50% 20% 20%', opacity:.9,
            }} />
          </div>
        </div>
      </div>

      {/* ── Raum-Mitte – Krebs auf Teppich ───────────────────────────────── */}
      <div style={{
        position:'absolute', left:'13%', right:'20%', top:'16%', bottom:'14%',
        background:'#3A1E0C',
        display:'flex', alignItems:'flex-end', justifyContent:'center',
        paddingBottom:20,
      }}>
        {/* Dielenlinien */}
        {Array.from({ length: 7 }, (__, i) => (
          <div key={i} style={{
            position:'absolute', left:`${i * 14.3}%`, top:0, bottom:0, width:2,
            background:'rgba(0,0,0,.2)',
          }} />
        ))}

        {/* Teppich */}
        <div style={{
          position:'absolute', bottom:16, left:'14%', right:'14%', height:50,
          background:'#7A1A1A', border:'4px solid #5A1010',
          backgroundImage:'repeating-linear-gradient(45deg,transparent,transparent 6px,rgba(0,0,0,.1) 6px,rgba(0,0,0,.1) 7px)',
        }}>
          <div style={{ position:'absolute', inset:4, border:'2px solid rgba(200,100,80,.28)' }} />
        </div>

        {/* Krebs + Feuerschein */}
        <div style={{ position:'relative', zIndex:2, marginBottom:2 }}>
          <div style={{
            position:'absolute', inset:-30,
            background:'radial-gradient(circle,rgba(255,130,30,.26) 0%,transparent 65%)',
            pointerEvents:'none',
          }} />
          <PSprite frame={FRAMES[fi]} />
        </div>
      </div>

      {/* ── Bodenfries (Holzdielen) ───────────────────────────────────────── */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:'14%',
        background:'#5C2E10', borderTop:'4px solid #3D1E08',
        display:'flex',
      }}>
        {Array.from({ length: 14 }, (__, i) => (
          <div key={i} style={{
            flex:1, borderLeft:'2px solid rgba(0,0,0,.22)',
            background: i % 2 === 0 ? 'rgba(255,255,255,.018)' : 'transparent',
          }} />
        ))}
      </div>

      {/* ── Verlassen-Button ──────────────────────────────────────────────── */}
      <button
        onClick={handleClose}
        style={{
          position:'absolute', bottom:16, right:16,
          display:'flex', alignItems:'center', gap:6,
          background:'#5C2E10', border:'3px solid #2A1208',
          color:'#F0DDB0',
          fontFamily:'"Courier New", monospace',
          fontSize:12, fontWeight:'bold', letterSpacing:2,
          padding:'7px 14px', cursor:'pointer',
          boxShadow:'3px 3px 0 #1C0F08, 0 0 14px rgba(255,120,20,.28)',
          imageRendering:'pixelated',
        } as React.CSSProperties}
        onMouseEnter={e => (e.currentTarget.style.background = '#7A4020')}
        onMouseLeave={e => (e.currentTarget.style.background = '#5C2E10')}
      >
        <DoorOpen size={14} />
        VERLASSEN
      </button>
    </div>
  );
}
