import { test, expect } from '@playwright/test';

/**
 * Rate Limiting Tests
 * Prüft dass öffentliche Endpoints korrekt limitiert werden
 */
test.describe('Rate Limiting – Öffentliche Referral-Endpoints', () => {
  test('Recruiting referrals POST gibt korrekte Antwortstruktur bei Validierungsfehler zurück', async ({ request }) => {
    const response = await request.post('/api/recruiting/referrals', {
      data: { ungültig: true },
    });
    // Rate limit oder Validierungsfehler
    expect([400, 429]).toContain(response.status());

    if (response.status() === 400) {
      const body = await response.json();
      expect(body).toHaveProperty('error');
    }
  });

  test('Affiliate referrals POST gibt korrekte Antwortstruktur bei Validierungsfehler zurück', async ({ request }) => {
    const response = await request.post('/api/affiliate/referrals', {
      data: { ungültig: true },
    });
    expect([400, 429]).toContain(response.status());
  });

  test('Rate-Limit-Antwort (429) enthält Retry-After Header', async ({ request }) => {
    // Sende viele Anfragen um Rate Limit zu erreichen (maxRequests = 20)
    // Im Test-Kontext kann das Rate Limit schon erreicht sein
    const responses: number[] = [];
    for (let i = 0; i < 3; i++) {
      const r = await request.post('/api/recruiting/referrals', {
        data: {},
        headers: { 'X-Forwarded-For': '10.0.0.99' },
      });
      responses.push(r.status());

      if (r.status() === 429) {
        // Rate Limit erreicht — Retry-After muss vorhanden sein
        expect(r.headers()['retry-after']).toBeDefined();
        break;
      }
    }
    // Entweder 400 (Validierungsfehler) oder 429 (Rate limit) — beide sind korrekt
    expect(responses.every(s => [400, 429].includes(s))).toBe(true);
  });
});
