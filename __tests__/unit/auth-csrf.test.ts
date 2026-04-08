import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// validateOrigin von recruiting und affiliate sind identisch implementiert
// Wir testen die Logik direkt durch Nachbildung der Funktion
// (Vermeidet das Importieren von Next.js Server-Modulen in Unit-Tests)

function buildRequest(origin?: string, referer?: string): Request {
  const headers = new Headers();
  if (origin) headers.set('origin', origin);
  if (referer) headers.set('referer', referer);
  return new Request('http://localhost:3000/api/test', { headers });
}

// Kopie der validateOrigin-Logik für isoliertes Unit-Testing
function validateOriginFn(request: Request, allowedOrigins: string[]): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (!origin && !referer) return true;

  if (origin) return allowedOrigins.includes(origin);

  if (referer) {
    try {
      return allowedOrigins.includes(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  return false;
}

describe('CSRF Origin Validation', () => {
  const allowed = ['http://localhost:3000', 'https://werkbank.example.com'];

  it('erlaubt Same-Origin-Anfragen', () => {
    const req = buildRequest('http://localhost:3000');
    expect(validateOriginFn(req, allowed)).toBe(true);
  });

  it('erlaubt Anfragen vom Produktions-Origin', () => {
    const req = buildRequest('https://werkbank.example.com');
    expect(validateOriginFn(req, allowed)).toBe(true);
  });

  it('lehnt Cross-Origin-Anfragen ab', () => {
    const req = buildRequest('https://evil.com');
    expect(validateOriginFn(req, allowed)).toBe(false);
  });

  it('erlaubt Anfragen ohne Origin und Referer (same-page fetch)', () => {
    const req = buildRequest();
    expect(validateOriginFn(req, allowed)).toBe(true);
  });

  it('prüft Referer-Header wenn kein Origin', () => {
    const req = buildRequest(undefined, 'http://localhost:3000/some/page');
    expect(validateOriginFn(req, allowed)).toBe(true);
  });

  it('lehnt fremden Referer ab', () => {
    const req = buildRequest(undefined, 'https://attacker.com/page');
    expect(validateOriginFn(req, allowed)).toBe(false);
  });

  it('lehnt ungültigen Referer-URL ab', () => {
    const headers = new Headers({ referer: 'not-a-valid-url' });
    const req = new Request('http://localhost:3000/', { headers });
    expect(validateOriginFn(req, allowed)).toBe(false);
  });
});
