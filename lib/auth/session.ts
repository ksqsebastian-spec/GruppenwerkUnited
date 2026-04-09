/**
 * Session-Kodierung via HMAC-SHA256 (Web Crypto API).
 * Funktioniert in Edge Runtime (proxy.ts) und Node.js (API-Routes).
 */

export interface SessionData {
  companyId: string;
  companyName: string;
  isAdmin: boolean;
}

export const SESSION_COOKIE = 'werkbank-session';

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
  const secret = process.env.SESSION_SECRET ?? 'dev-secret-change-me';
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function encodeSession(data: SessionData): Promise<string> {
  const payloadBuf = enc.encode(JSON.stringify(data));
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
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sig),
      enc.encode(payload)
    );
    if (!valid) return null;
    return JSON.parse(dec.decode(b64urlDecode(payload))) as SessionData;
  } catch {
    return null;
  }
}
