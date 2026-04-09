/**
 * Pixel-Art Frames für den Werkbank-Maskottchen-Krebs.
 * Raster: 14 × 14 Logik-Pixel (je 6 SVG-Einheiten → 84×84 SVG).
 * Reihen 0-3: Prop-Bereich (Hammer, Zzz …)
 * Reihen 4-12: Körper + Beine
 * Reihe 13: leer (Boden-Puffer)
 */

const B = '#C87140'; // Körper (Terrakotta)
const D = '#A05828'; // Dunkel / Schatten
const E = '#1A1A1A'; // Augen
const H = '#2C1A0E'; // Hammer-Kopf
const T = '#6B4226'; // Hammer-Stiel
const L = '#8BAABF'; // Laptop-Bildschirm
const K = '#5A6478'; // Laptop-Tastatur
const S = '#FFD040'; // Funke / Glitzer
const Z = '#A0A0A0'; // Zzz-Buchstabe
const _ = '';        // transparent

export type PixelFrame = string[][];
export type AnimName =
  | 'idle' | 'blink' | 'walk' | 'hammer'
  | 'type' | 'wave' | 'dance' | 'sleep'
  | 'peek' | 'celebrate';

// ─── Basis-Sprite ─────────────────────────────────────────────────────────────
const BASE: PixelFrame = [
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 0  Prop-Bereich
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 1
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 2
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 3
  [_,_,_,B,B,B,B,B,B,B,B,_,_,_], // 4  Oberkörper
  [_,_,B,B,B,B,B,B,B,B,B,B,_,_], // 5
  [_,B,B,B,B,B,B,B,B,B,B,B,B,_], // 6  Körper mit kleinen Klauen-Ansätzen
  [B,B,B,B,E,E,B,B,E,E,B,B,B,B], // 7  Augen-Reihe + volle Klauen
  [_,B,B,B,E,E,B,B,E,E,B,B,B,_], // 8  Augen unten
  [_,B,B,B,B,B,B,B,B,B,B,B,B,_], // 9  Unterkörper
  [_,_,B,B,B,B,B,B,B,B,B,B,_,_], // 10
  [_,_,_,B,B,_,_,_,B,B,_,_,_,_], // 11 Beine
  [_,_,_,B,B,_,_,_,B,B,_,_,_,_], // 12 Beine
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 13
];

const cl = (f: PixelFrame): PixelFrame => f.map(r => [...r]);

// ─── 1. IDLE (2 Frames, 2 fps) ───────────────────────────────────────────────
const i1 = cl(BASE); i1[7][4] = D; i1[7][8] = D; // leichter Augen-Glanz
export const IDLE: PixelFrame[] = [cl(BASE), i1];

// ─── 2. BLINK (5 Frames, 10 fps) ─────────────────────────────────────────────
const blHalf = cl(BASE);
blHalf[7][4]=B; blHalf[7][5]=B; blHalf[7][8]=B; blHalf[7][9]=B;
const blClosed = cl(BASE);
blClosed[7][4]=B; blClosed[7][5]=B; blClosed[7][8]=B; blClosed[7][9]=B;
blClosed[8][4]=D; blClosed[8][5]=D; blClosed[8][8]=D; blClosed[8][9]=D;
export const BLINK: PixelFrame[] = [cl(BASE), blHalf, blClosed, blHalf, cl(BASE)];

// ─── 3. WALK (4 Frames, 10 fps) ──────────────────────────────────────────────
const wL = cl(BASE); wL[11][3]=_; wL[12][3]=_;           // linkes Bein gehoben
const wR = cl(BASE); wR[11][9]=_; wR[12][9]=_;            // rechtes Bein gehoben
export const WALK: PixelFrame[] = [cl(BASE), wL, cl(BASE), wR];

// ─── 4. HAMMER (6 Frames, 7 fps) ─────────────────────────────────────────────
// F0: Hammer-Bereitschaft (Hammer über rechter Klaue)
const hm0 = cl(BASE);
hm0[3][11]=H; hm0[3][12]=H; hm0[3][13]=H;  // Hammer-Kopf
hm0[4][12]=T; hm0[5][12]=T;                  // Stiel
hm0[6][12]=B; hm0[6][13]=B;                  // Klaue angehoben

// F1-F2: voll hochgehoben
const hm1 = cl(BASE);
hm1[2][11]=H; hm1[2][12]=H; hm1[2][13]=H;
hm1[3][12]=T; hm1[4][12]=T;
hm1[7][12]=_; hm1[7][13]=_;
hm1[5][12]=B; hm1[5][13]=B;

// F3: Schlag
const hm2 = cl(BASE); hm2[7][11]=D; hm2[7][12]=D;

// F4: Funke
const hm3 = cl(BASE); hm3[7][12]=S; hm3[8][12]=S;

export const HAMMER: PixelFrame[] = [hm0, hm1, hm1, hm2, hm3, cl(BASE)];

// ─── 5. TYPE (4 Frames, 10 fps) ──────────────────────────────────────────────
function addLaptop(base: PixelFrame): PixelFrame {
  const f = cl(base);
  f[11] = [_,_,_,_,L,L,L,L,L,_,_,_,_,_];
  f[12] = [_,_,_,_,L,_,_,_,L,_,_,_,_,_];
  f[13] = [_,_,_,_,K,K,K,K,K,_,_,_,_,_];
  return f;
}
const ty1 = addLaptop(BASE); ty1[9][2]  = D; // linke Klaue tippt
const ty2 = addLaptop(BASE); ty2[9][11] = D; // rechte Klaue tippt
export const TYPE: PixelFrame[] = [addLaptop(BASE), ty1, addLaptop(BASE), ty2];

// ─── 6. WAVE (6 Frames, 7 fps) ───────────────────────────────────────────────
const wv1 = cl(BASE);
wv1[7][0]=_; wv1[7][1]=_; wv1[5][0]=B; wv1[5][1]=B;  // Klaue bei Reihe 5

const wv2 = cl(BASE);
wv2[7][0]=_; wv2[7][1]=_; wv2[6][1]=_;
wv2[3][0]=B; wv2[3][1]=B; wv2[4][0]=B;                // voll oben

export const WAVE: PixelFrame[] = [cl(BASE), wv1, wv2, wv1, wv2, cl(BASE)];

// ─── 7. DANCE (4 Frames, 8 fps) ──────────────────────────────────────────────
const dn1 = cl(BASE); dn1[3][0]=B; dn1[3][1]=B; dn1[7][0]=_; dn1[7][1]=_;   // links hoch
const dn3 = cl(BASE); dn3[3][12]=B; dn3[3][13]=B; dn3[7][12]=_; dn3[7][13]=_; // rechts hoch
export const DANCE: PixelFrame[] = [cl(BASE), dn1, cl(BASE), dn3];

// ─── 8. SLEEP (6 Frames, 2 fps) ──────────────────────────────────────────────
const sleepEyes = cl(BASE);
sleepEyes[7][4]=B; sleepEyes[7][5]=B; sleepEyes[7][8]=B; sleepEyes[7][9]=B;
sleepEyes[8][4]=D; sleepEyes[8][5]=D; sleepEyes[8][8]=D; sleepEyes[8][9]=D;

const sl1 = cl(sleepEyes);
[9,10,11].forEach(c => { sl1[1][c]=Z; sl1[3][c]=Z; }); sl1[2][11]=Z; // Z tief

const sl2 = cl(sleepEyes);
[10,11,12].forEach(c => { sl2[0][c]=Z; sl2[2][c]=Z; }); sl2[1][12]=Z; // Z hoch

export const SLEEP: PixelFrame[] = [sleepEyes, sleepEyes, sl1, sl1, sl2, sl2];

// ─── 9. PEEK – benutzt IDLE-Frames, Bewegung via CSS ─────────────────────────
export const PEEK: PixelFrame[] = IDLE;

// ─── 10. CELEBRATE (5 Frames, 8 fps) ─────────────────────────────────────────
const cel1 = cl(BASE);
cel1[4][0]=B; cel1[4][1]=B; cel1[4][12]=B; cel1[4][13]=B;
cel1[7][0]=_; cel1[7][13]=_;

const cel2 = cl(BASE);
cel2[3][0]=B; cel2[3][1]=B; cel2[3][12]=B; cel2[3][13]=B;
cel2[7][0]=_; cel2[7][13]=_;
cel2[1][0]=S; cel2[1][13]=S; cel2[0][2]=S; cel2[0][11]=S;

export const CELEBRATE: PixelFrame[] = [cl(BASE), cel1, cel2, cel1, cl(BASE)];

// ─── Registry ─────────────────────────────────────────────────────────────────
export const ANIM_FRAMES: Record<AnimName, PixelFrame[]> = {
  idle: IDLE, blink: BLINK, walk: WALK, hammer: HAMMER,
  type: TYPE, wave: WAVE, dance: DANCE, sleep: SLEEP,
  peek: PEEK, celebrate: CELEBRATE,
};
export const ANIM_FPS: Record<AnimName, number> = {
  idle: 2, blink: 10, walk: 10, hammer: 7,
  type: 10, wave: 7, dance: 8, sleep: 2,
  peek: 2, celebrate: 8,
};
export const ANIM_LOOP: Record<AnimName, boolean> = {
  idle: true, blink: false, walk: true, hammer: false,
  type: true, wave: false, dance: false, sleep: true,
  peek: true, celebrate: false,
};
