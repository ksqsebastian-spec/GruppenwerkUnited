'use client';

import { BOOK_COLS, FRAMES, type PF } from './crab-lair-assets';
export { Ceiling } from './crab-lair-ceiling';

// ─── Pixel-Sprite-Renderer ────────────────────────────────────────────────────
export function PSprite({ frame, scale = 8 }: { frame: PF; scale?: number }): React.JSX.Element {
  const rects: React.JSX.Element[] = [];
  for (let r = 0; r < 14; r++)
    for (let c = 0; c < 14; c++) {
      const col = frame[r]?.[c];
      if (!col) continue;
      rects.push(<rect key={`${r}-${c}`} x={c * scale} y={r * scale} width={scale} height={scale} fill={col} />);
    }
  return (
    <svg
      width={14 * scale}
      height={14 * scale}
      viewBox={`0 0 ${14 * scale} ${14 * scale}`}
      style={{ imageRendering: 'pixelated', transform: 'scaleX(-1)' }}
    >
      {rects}
    </svg>
  );
}

// ─── Bücherregal ─────────────────────────────────────────────────────────────
export function Shelf(): React.JSX.Element {
  const shelves: [number, number][] = [
    [0, 3],
    [3, 6],
    [6, 9],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 6 }}>
      {shelves.map(([a, b], si) => (
        <div
          key={si}
          style={{
            display: 'flex',
            gap: 2,
            alignItems: 'flex-end',
            background: '#3D1E08',
            border: '2px solid #2A1208',
            padding: '3px 4px 0',
            height: 32,
          }}
        >
          {BOOK_COLS.slice(a, b).map((c, i) => (
            <div
              key={i}
              style={{
                width: 7 + (i % 3) * 2,
                height: 18 + (i % 2) * 6,
                background: c,
                border: '1px solid rgba(0,0,0,.4)',
                alignSelf: 'flex-end',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function Flames(): React.JSX.Element {
  return (
    <div className="f-out" style={{
      position: 'absolute', bottom: 0, left: '8%', right: '8%', height: '72%',
      background: 'linear-gradient(to top,#AA2200,#DD4400)',
      borderRadius: '46% 46% 18% 18%',
    }}>
      <div className="f-mid" style={{
        position: 'absolute', bottom: 0, left: '12%', right: '12%', height: '82%',
        background: 'linear-gradient(to top,#EE5500,#FF8800)',
        borderRadius: '46% 46% 18% 18%',
      }}>
        <div className="f-core" style={{
          position: 'absolute', bottom: 0, left: '18%', right: '18%', height: '78%',
          background: 'linear-gradient(to top,#FF9900,#FFDD00)',
          borderRadius: '46% 46% 18% 18%',
        }} />
      </div>
    </div>
  );
}

export function Fireplace(): React.JSX.Element {
  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: '16%',
        bottom: '14%',
        width: '20%',
        background: '#221408',
        borderLeft: '4px solid #1C0F08',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '8%',
          right: '8%',
          height: '74%',
          background: '#4A3525',
          border: '5px solid #3A2818',
        }}
      >
        <div style={{ position: 'absolute', bottom: 10, left: 8, right: 8, top: 14, background: '#060402' }}>
          <Flames />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 10,
              background: '#3D1E08',
              borderTop: '3px solid #5C2E10',
              display: 'flex',
              gap: 3,
              padding: '0 3px',
            }}
          >
            {[38, 26, 34].map((w, i) => (
              <div key={i} style={{ width: w, height: 7, background: '#2A1208', borderRadius: 1 }} />
            ))}
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            top: -8,
            left: -10,
            right: -10,
            height: 14,
            background: '#6B5545',
            border: '3px solid #5A4535',
          }}
        />
        <div style={{ position: 'absolute', top: -28, right: 10, width: 6, height: 16, background: '#EED8A4' }}>
          <div
            style={{
              position: 'absolute',
              top: -7,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 5,
              height: 7,
              background: '#FF9900',
              borderRadius: '50% 50% 20% 20%',
              opacity: 0.9,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function RoomCenter({ frameIndex }: { frameIndex: number }): React.JSX.Element {
  return (
    <div
      style={{
        position: 'absolute',
        left: '13%',
        right: '20%',
        top: '16%',
        bottom: '14%',
        background: '#3A1E0C',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: 20,
      }}
    >
      {Array.from({ length: 7 }, (__, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${i * 14.3}%`,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'rgba(0,0,0,.2)',
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '14%',
          right: '14%',
          height: 50,
          background: '#7A1A1A',
          border: '4px solid #5A1010',
          backgroundImage:
            'repeating-linear-gradient(45deg,transparent,transparent 6px,rgba(0,0,0,.1) 6px,rgba(0,0,0,.1) 7px)',
        }}
      >
        <div style={{ position: 'absolute', inset: 4, border: '2px solid rgba(200,100,80,.28)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 2, marginBottom: 2 }}>
        <div
          style={{
            position: 'absolute',
            inset: -30,
            background: 'radial-gradient(circle,rgba(255,130,30,.26) 0%,transparent 65%)',
            pointerEvents: 'none',
          }}
        />
        <PSprite frame={FRAMES[frameIndex]} />
      </div>
    </div>
  );
}
