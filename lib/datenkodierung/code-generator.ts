// Erlaubte Zeichen: Großbuchstaben ohne O, Zahlen ohne 0 – vermeidet Verwechslungen
const ALPHABET = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';

function randomSegment(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((byte) => ALPHABET[byte % ALPHABET.length])
    .join('');
}

export function generateCode(): string {
  return `GW-${randomSegment(4)}-${randomSegment(4)}`;
}
