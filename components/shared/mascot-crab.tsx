'use client';

import { useEffect, useState, useCallback } from 'react';

type Mood = 'idle' | 'wave' | 'dance';

/** Blauer Werkbank-Maskottchen-Krebs – lebt in der unteren linken Ecke */
export function MascotCrab(): React.JSX.Element {
  const [mood, setMood] = useState<Mood>('idle');

  const triggerRandom = useCallback((): void => {
    const opts: Mood[] = ['idle', 'idle', 'idle', 'wave', 'dance'];
    setMood(opts[Math.floor(Math.random() * opts.length)]);
  }, []);

  useEffect(() => {
    const id = setInterval(triggerRandom, 3500);
    return () => clearInterval(id);
  }, [triggerRandom]);

  // Nach einer Animations-Runde zurück zu idle
  useEffect(() => {
    if (mood === 'wave' || mood === 'dance') {
      const id = setTimeout(() => setMood('idle'), 1600);
      return () => clearTimeout(id);
    }
  }, [mood]);

  return (
    <div className="fixed bottom-4 left-4 z-50 select-none">
      <style>{`
        @keyframes crab-bob {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes crab-wave {
          0%   { transform: rotate(0deg); }
          20%  { transform: rotate(-12deg) translateY(-3px); }
          50%  { transform: rotate(10deg) translateY(-3px); }
          80%  { transform: rotate(-8deg) translateY(-2px); }
          100% { transform: rotate(0deg); }
        }
        @keyframes crab-dance {
          0%   { transform: translateX(0) rotate(0deg); }
          20%  { transform: translateX(-6px) rotate(-10deg); }
          50%  { transform: translateX(6px) rotate(10deg); }
          80%  { transform: translateX(-4px) rotate(-6deg); }
          100% { transform: translateX(0) rotate(0deg); }
        }
        @keyframes claw-raise {
          0%, 100% { transform: rotate(0deg); }
          40%, 60% { transform: rotate(-45deg); }
        }
      `}</style>

      <div
        style={{
          animation:
            mood === 'idle'  ? 'crab-bob 2.2s ease-in-out infinite' :
            mood === 'wave'  ? 'crab-wave 0.55s ease-in-out 3' :
                               'crab-dance 0.4s ease-in-out 4',
          cursor: 'pointer',
          willChange: 'transform',
        }}
        onClick={() => setMood('dance')}
        title="🦀"
      >
        <CrabSvg waving={mood === 'wave'} />
      </div>
    </div>
  );
}

function CrabSvg({ waving }: { waving: boolean }): React.JSX.Element {
  const blue = 'hsl(var(--primary))';
  const blueDark = 'hsl(var(--primary) / 0.75)';

  return (
    <svg width="52" height="48" viewBox="0 0 52 48" fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* Linke Schere – wedelt wenn waving */}
      <g
        style={waving ? {
          animation: 'claw-raise 0.55s ease-in-out 3',
          transformOrigin: '16px 22px',
        } : {}}
      >
        <ellipse cx="9" cy="16" rx="7" ry="5" fill={blue} />
        <ellipse cx="5"  cy="20" rx="4" ry="3" fill={blueDark} />
        <ellipse cx="12" cy="21" rx="3" ry="2.5" fill={blueDark} />
      </g>

      {/* Rechte Schere */}
      <ellipse cx="43" cy="16" rx="7" ry="5" fill={blue} />
      <ellipse cx="47" cy="20" rx="4" ry="3" fill={blueDark} />
      <ellipse cx="40" cy="21" rx="3" ry="2.5" fill={blueDark} />

      {/* Körper */}
      <ellipse cx="26" cy="31" rx="15" ry="11" fill={blue} />

      {/* Augenstiele */}
      <rect x="18" y="20" width="3.5" height="7" rx="1.75" fill={blue} />
      <rect x="30.5" y="20" width="3.5" height="7" rx="1.75" fill={blue} />

      {/* Augen */}
      <circle cx="19.75" cy="19" r="5" fill={blue} />
      <circle cx="32.25" cy="19" r="5" fill={blue} />
      <circle cx="19.75" cy="19" r="3.2" fill="white" />
      <circle cx="32.25" cy="19" r="3.2" fill="white" />
      <circle cx="20.5"  cy="18.3" r="2" fill="#1a2540" />
      <circle cx="33"    cy="18.3" r="2" fill="#1a2540" />
      {/* Glanz */}
      <circle cx="21.2" cy="17.6" r="0.7" fill="white" />
      <circle cx="33.7" cy="17.6" r="0.7" fill="white" />

      {/* Beine links */}
      <line x1="15" y1="34" x2="7"  y2="40" stroke={blue} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="14" y1="38" x2="5"  y2="46" stroke={blue} strokeWidth="2.5" strokeLinecap="round" />

      {/* Beine rechts */}
      <line x1="37" y1="34" x2="45" y2="40" stroke={blue} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="38" y1="38" x2="47" y2="46" stroke={blue} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
