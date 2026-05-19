'use client';

export function Ceiling(): React.JSX.Element {
  const drops = Array.from({ length: 14 }, (__, i) => (
    <div
      key={i}
      style={{
        position: 'absolute',
        width: 1.5,
        height: 6 + (i % 4) * 3,
        background: 'rgba(110,155,200,.6)',
        left: `${4 + i * 6.8}%`,
        top: 0,
        animation: `rain-drop ${0.6 + i * 0.06}s linear ${i * 0.09}s infinite`,
        transform: 'rotate(-12deg)',
      }}
    />
  ));

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '16%',
        background: '#1C0F08',
        borderBottom: '4px solid #2D1810',
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      {Array.from({ length: 10 }, (__, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: i % 2 === 0 ? '62%' : '78%',
            background: i % 2 === 0 ? '#2D1810' : '#251208',
            borderLeft: '2px solid #1C0F08',
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 108,
          height: 72,
          borderRadius: '50% 50% 42% 42%',
          background: '#06080E',
          border: '5px solid #3D2010',
          overflow: 'hidden',
        }}
      >
        {[10, 28, 48, 68, 85, 20, 60].map((l, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 2,
              height: 2,
              background: '#D8D4C4',
              left: `${l}%`,
              top: `${6 + (i % 3) * 14}%`,
              opacity: 0.5,
            }}
          />
        ))}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>{drops}</div>
      </div>
    </div>
  );
}
