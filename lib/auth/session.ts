/**
 * Session-Kodierung via HMAC-SHA256 (Web Crypto API).
 * Funktioniert in Edge Runtime (proxy.ts) und Node.js (API-Routes).
 *
 * Format: `<base64url(payload-json)>.<base64url(hmac-sig)>`
 *
 * Die Signatur wird zeit-konstant verifiziert (crypto.subtle.verify).
 * Eine Manipulation des companyId/isAdmin-Felds im Payload invalidiert die Signatur.
 */

export interface SessionData {
  companyId: string;
  companyName: string;
  isAdmin: boolean;
  /** Issued-at (unix ms) — gesetzt vom Server, optional für Abwärtskompatibilität */
  iat?: number;
}

export const SESSION_COOKIE = 'werkbank-session';

// Sessions älter als 30 Tage werden abgelehnt, selbst wenn die Signatur valide ist.
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function b64urlDecode(str: string): Uint8Array<ArrayBuffer> {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  const decoded = atob(pad ? b64 + '='.repeat(4 - pad) : b64);
  const result = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    result[i] = decoded.charCodeAt(i);
  }
  return result;
}

async function importKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  // In Produktion MUSS ein echtes Secret gesetzt sein. Fehlt es, würde sonst
  // still das bekannte Default-Secret genutzt — damit wären Sessions
  // (companyId/isAdmin) fälschbar (Auth-Bypass). Fail-closed: Ohne Secret wird
  // geworfen; encode/decode schlagen fehl → Nutzer landen beim Login statt mit
  // einer gefälschten Admin-Session durchzukommen.
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET ist in Produktion nicht gesetzt');
  }
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret ?? 'dev-secret-change-me'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function encodeSession(data: SessionData): Promise<string> {
  const withIat: SessionData = { ...data, iat: data.iat ?? Date.now() };
  const payloadBuf = enc.encode(JSON.stringify(withIat));
  const payload = b64urlEncode(payloadBuf);
  const key = await importKey();
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const sig = b64urlEncode(sigBuf);
  return `${payload}.${sig}`;
}

export async function decodeSession(token: string): Promise<SessionData | null> {
  try {
    const lastDot = token.lastIndexOf('.');
    if (lastDot === -1) return null;
    const payload = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);
    const key = await importKey();
    // crypto.subtle.verify ist zeit-konstant — keine Timing-Leaks bei falscher Signatur.
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sig),
      enc.encode(payload)
    );
    if (!valid) return null;
    const parsed = JSON.parse(dec.decode(b64urlDecode(payload))) as SessionData;
    // Server-seitiger Ablauf: auch valide signierte Tokens nach Max-Age ungültig machen.
    if (typeof parsed.iat === 'number' && Date.now() - parsed.iat > SESSION_MAX_AGE_MS) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
