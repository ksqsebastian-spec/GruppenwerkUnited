/**
 * Pixel-Art Frames für den Werkbank-Maskottchen-Krebs.
 * Raster: 14 × 14 Logik-Pixel (je 5 SVG-Einheiten → 70×70 SVG).
 * Reihen 0-3:  Prop-Bereich (Hammer, Zzz …)
 * Reihen 4-9:  Körper (rechteckig, wie der Claude-Krebs)
 * Reihe 6-7:   Klauen-Reihen (volle Breite, 2px Überhang links/rechts)
 * Reihen 10-12: Beine (direkt unter Körper, keine Lücke)
 */

const B = '#2563EB'; // Körper (Blau)
const D = '#1D4ED8'; // Dunkel / Schatten
const E = '#1A1A1A'; // Augen
const H = '#1A1A1A'; // Hammer-Kopf
const T = '#374151'; // Hammer-Stiel
const L = '#93C5FD'; // Laptop-Bildschirm (helles Blau)
const K = '#3B82F6'; // Laptop-Tastatur
const S = '#FACC15'; // Funke / Glitzer
const Z = '#A0A0A0'; // Zzz-Buchstabe
const _ = '';        // transparent

export type PixelFrame = string[][];
export type AnimName =
  | 'idle' | 'blink' | 'walk' | 'hammer'
  | 'type' | 'wave' | 'dance' | 'sleep'
  | 'peek' | 'celebrate';

// ─── Basis-Sprite (14 × 14) ───────────────────────────────────────────────────
// Körper: gleichmäßig rechteckig (cols 2-11, 10px breit)
// Klauen: Reihen 6-7 gehen bis cols 0 und 13 (je 2px Überhang)
// Augen:  2×2 bei (rows 5-6, cols 4-5) und (rows 5-6, cols 8-9)
// Beine:  cols 3-4 und 7-8, rows 10-12 (direkt unter Körper)
const BASE: PixelFrame = [
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 0  Prop-Bereich
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 1
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 2
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 3
  [_,_,B,B,B,B,B,B,B,B,B,B,_,_], // 4  Körper oben  (10 breit, cols 2-11)
  [_,_,B,B,E,E,B,B,E,E,B,B,_,_], // 5  Augen oben
  [B,B,B,B,E,E,B,B,E,E,B,B,B,B], // 6  Augen unten + Klauen (voll, 14 breit)
  [B,B,B,B,B,B,B,B,B,B,B,B,B,B], // 7  Klauen (voll, 14 breit)
  [_,_,B,B,B,B,B,B,B,B,B,B,_,_], // 8  Körper unten
  [_,_,B,B,B,B,B,B,B,B,B,B,_,_], // 9  Körper unten
  [_,_,_,B,B,_,_,B,B,_,_,_,_,_], // 10 Beine (cols 3-4 und 7-8)
  [_,_,_,B,B,_,_,B,B,_,_,_,_,_], // 11
  [_,_,_,B,B,_,_,B,B,_,_,_,_,_], // 12
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 13 leer
];

const cl = (f: PixelFrame): PixelFrame => f.map(r => [...r]);

// ─── 1. IDLE (4 Frames, 3 fps) ───────────────────────────────────────────────
// Leichtes Schaukeln: Körper-Pixel wechseln für subtile Bewegung
const i1 = cl(BASE);
i1[5][4] = D; i1[5][8] = D;             // Augen-Glanz oben links
const i2 = cl(BASE);
i2[9][2] = D; i2[9][11] = D;            // Körper unten leicht dunkler
const i3 = cl(BASE);
i3[5][5] = D; i3[5][9] = D;             // Augen-Glanz oben rechts
export const IDLE: PixelFrame[] = [cl(BASE), i1, i2, i3];

// ─── 2. BLINK (5 Frames, 10 fps) ─────────────────────────────────────────────
const blHalf = cl(BASE);
blHalf[5][4]=B; blHalf[5][5]=B; blHalf[5][8]=B; blHalf[5][9]=B; // oben zu
const blClosed = cl(blHalf);
blClosed[6][4]=D; blClosed[6][5]=D; blClosed[6][8]=D; blClosed[6][9]=D; // Linie
export const BLINK: PixelFrame[] = [cl(BASE), blHalf, blClosed, blHalf, cl(BASE)];

// ─── 3. WALK (4 Frames, 10 fps) ──────────────────────────────────────────────
const wL = cl(BASE); wL[10][3]=_; wL[11][3]=_; wL[12][3]=_; // linkes Bein gehoben
const wR = cl(BASE); wR[10][7]=_; wR[11][7]=_; wR[12][7]=_; // rechtes Bein gehoben
export const WALK: PixelFrame[] = [cl(BASE), wL, cl(BASE), wR];

// ─── 4. HAMMER (6 Frames, 7 fps) ─────────────────────────────────────────────
const hm0 = cl(BASE); // Bereitschaft: Hammer über rechte Klaue
hm0[3][11]=H; hm0[3][12]=H; hm0[3][13]=H; // Hammer-Kopf
hm0[4][12]=T; hm0[5][12]=T;               // Stiel

const hm1 = cl(BASE); // Arm hochgehoben
hm1[6][12]=_; hm1[6][13]=_;  // rechte Klaue aus Reihe 6 entfernt
hm1[7][12]=_; hm1[7][13]=_;  // rechte Klaue aus Reihe 7 entfernt
hm1[4][12]=B; hm1[4][13]=B;  // Arm jetzt bei Reihe 4
hm1[2][11]=H; hm1[2][12]=H; hm1[2][13]=H; // Hammer hoch
hm1[3][12]=T; hm1[4][12]=T;

const hm2 = cl(BASE); // Schlag!
hm2[7][11]=D; hm2[7][12]=D;

const hm3 = cl(BASE); // Funke
hm3[7][11]=S; hm3[7][12]=S; hm3[6][12]=S;

export const HAMMER: PixelFrame[] = [hm0, hm1, hm1, hm2, hm3, cl(BASE)];

// ─── 5. TYPE (4 Frames, 10 fps) ──────────────────────────────────────────────
function addLaptop(base: PixelFrame): PixelFrame {
  const f = cl(base);
  f[10] = [_,_,_,L,L,L,L,L,L,_,_,_,_,_]; // Bildschirm (cols 3-8)
  f[11] = [_,_,_,L,_,_,_,_,L,_,_,_,_,_];
  f[12] = [_,_,_,K,K,K,K,K,K,_,_,_,_,_]; // Tastatur
  return f;
}
const ty1 = addLaptop(BASE); ty1[9][2]  = D; // linke Klaue tippt
const ty2 = addLaptop(BASE); ty2[9][11] = D; // rechte Klaue tippt
export const TYPE: PixelFrame[] = [addLaptop(BASE), ty1, addLaptop(BASE), ty2];

// ─── 6. WAVE (6 Frames, 7 fps) ───────────────────────────────────────────────
const wv1 = cl(BASE); // Arm auf halber Höhe
wv1[6][0]=_; wv1[6][1]=_; wv1[7][0]=_; wv1[7][1]=_; // aus Klauen-Reihen
wv1[4][0]=B; wv1[4][1]=B; wv1[5][0]=B; wv1[5][1]=B; // Arm bei Reihen 4-5

const wv2 = cl(BASE); // Arm ganz oben
wv2[6][0]=_; wv2[6][1]=_; wv2[7][0]=_; wv2[7][1]=_;
wv2[2][0]=B; wv2[2][1]=B; wv2[3][0]=B; wv2[3][1]=B; // Arm bei Reihen 2-3

export const WAVE: PixelFrame[] = [cl(BASE), wv1, wv2, wv1, wv2, cl(BASE)];

// ─── 7. DANCE (4 Frames, 8 fps) ──────────────────────────────────────────────
const dn1 = cl(BASE); // linke Klaue hoch
dn1[6][0]=_; dn1[6][1]=_; dn1[7][0]=_; dn1[7][1]=_;
dn1[3][0]=B; dn1[3][1]=B; dn1[4][0]=B; dn1[4][1]=B;

const dn3 = cl(BASE); // rechte Klaue hoch
dn3[6][12]=_; dn3[6][13]=_; dn3[7][12]=_; dn3[7][13]=_;
dn3[3][12]=B; dn3[3][13]=B; dn3[4][12]=B; dn3[4][13]=B;

export const DANCE: PixelFrame[] = [cl(BASE), dn1, cl(BASE), dn3];

// ─── 8. SLEEP (6 Frames, 2 fps) ──────────────────────────────────────────────
const sleepEyes = cl(BASE);
// Augen schließen: oben → Körperfarbe, unten → dunkle Linie
sleepEyes[5][4]=B; sleepEyes[5][5]=B; sleepEyes[5][8]=B; sleepEyes[5][9]=B;
sleepEyes[6][4]=D; sleepEyes[6][5]=D; sleepEyes[6][8]=D; sleepEyes[6][9]=D;

const sl1 = cl(sleepEyes); // Z tief
[9,10,11].forEach(c => { sl1[1][c]=Z; sl1[3][c]=Z; }); sl1[2][11]=Z;

const sl2 = cl(sleepEyes); // Z hoch
[10,11,12].forEach(c => { sl2[0][c]=Z; sl2[2][c]=Z; }); sl2[1][12]=Z;

export const SLEEP: PixelFrame[] = [sleepEyes, sleepEyes, sl1, sl1, sl2, sl2];

// ─── 9. PEEK – benutzt IDLE-Frames, Bewegung via CSS ─────────────────────────
export const PEEK: PixelFrame[] = IDLE;

// ─── 10. CELEBRATE (5 Frames, 8 fps) ─────────────────────────────────────────
const cel1 = cl(BASE); // Klauen auf halber Höhe
cel1[6][0]=_; cel1[6][1]=_; cel1[7][0]=_; cel1[7][13]=_;
cel1[6][12]=_; cel1[6][13]=_; cel1[7][12]=_;
cel1[4][0]=B; cel1[4][1]=B; cel1[4][12]=B; cel1[4][13]=B;
cel1[5][0]=B; cel1[5][12]=B;

const cel2 = cl(BASE); // Klauen ganz oben + Funken
cel2[6][0]=_; cel2[6][1]=_; cel2[7][0]=_; cel2[7][1]=_;
cel2[6][12]=_; cel2[6][13]=_; cel2[7][12]=_; cel2[7][13]=_;
cel2[2][0]=B; cel2[2][1]=B; cel2[2][12]=B; cel2[2][13]=B;
cel2[3][0]=B; cel2[3][13]=B;
cel2[0][1]=S; cel2[0][12]=S; cel2[1][0]=S; cel2[1][13]=S; // Funken

export const CELEBRATE: PixelFrame[] = [cl(BASE), cel1, cel2, cel1, cl(BASE)];

// ─── Registry ─────────────────────────────────────────────────────────────────
export const ANIM_FRAMES: Record<AnimName, PixelFrame[]> = {
  idle: IDLE, blink: BLINK, walk: WALK, hammer: HAMMER,
  type: TYPE, wave: WAVE, dance: DANCE, sleep: SLEEP,
  peek: PEEK, celebrate: CELEBRATE,
};
export const ANIM_FPS: Record<AnimName, number> = {
  idle: 3, blink: 10, walk: 10, hammer: 7,
  type: 10, wave: 7, dance: 8, sleep: 2,
  peek: 3, celebrate: 8,
};
export const ANIM_LOOP: Record<AnimName, boolean> = {
  idle: true, blink: false, walk: true, hammer: false,
  type: true, wave: false, dance: false, sleep: true,
  peek: true, celebrate: false,
};
