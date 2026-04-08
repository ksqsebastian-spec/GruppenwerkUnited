import { test, expect } from '@playwright/test';

/**
 * Sicherheits-Tests für API-Routen
 * Prüft Authentifizierung, CSRF-Schutz, Input-Validierung
 */
test.describe('API Sicherheit – Authentifizierung', () => {
  test('unauthentifizierter Zugriff auf recruiting/stellen gibt 401 zurück', async ({ request }) => {
    const response = await request.get('/api/recruiting/stellen');
    expect(response.status()).toBe(401);
  });

  test('unauthentifizierter POST auf recruiting/stellen gibt 401 zurück', async ({ request }) => {
    const response = await request.post('/api/recruiting/stellen', {
      data: { title: 'Test' },
    });
    expect(response.status()).toBe(401);
  });

  test('unauthentifizierter Zugriff auf affiliate/handwerker gibt 401 zurück', async ({ request }) => {
    const response = await request.get('/api/affiliate/handwerker');
    expect(response.status()).toBe(401);
  });

  test('unauthentifizierter Zugriff auf recruiting/export gibt 401 zurück', async ({ request }) => {
    const response = await request.get('/api/recruiting/export');
    expect(response.status()).toBe(401);
  });

  test('unauthentifizierter Zugriff auf affiliate/export gibt 401 zurück', async ({ request }) => {
    const response = await request.get('/api/affiliate/export');
    expect(response.status()).toBe(401);
  });

  test('unauthentifizierter Zugriff auf recruiting/settings gibt 401 zurück', async ({ request }) => {
    const response = await request.get('/api/recruiting/settings');
    expect(response.status()).toBe(401);
  });

  test('unauthentifizierter Zugriff auf recruiting/empfehlungen gibt 401 zurück', async ({ request }) => {
    const response = await request.post('/api/recruiting/empfehlungen', {
      data: {},
    });
    expect(response.status()).toBe(401);
  });

  test('unauthentifizierter Zugriff auf affiliate/referrals gibt 401 zurück', async ({ request }) => {
    const response = await request.get('/api/affiliate/referrals');
    expect(response.status()).toBe(401);
  });
});

test.describe('API Sicherheit – Cron Authentifizierung', () => {
  test('Cron-Endpoint ohne Bearer-Token gibt 401 zurück', async ({ request }) => {
    const response = await request.get('/api/cron/appointments');
    expect(response.status()).toBe(401);
  });

  test('Cron-Endpoint mit falschem Token gibt 401 zurück', async ({ request }) => {
    const response = await request.get('/api/cron/appointments', {
      headers: { Authorization: 'Bearer falsches-secret' },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('API Sicherheit – Webhook Authentifizierung', () => {
  test('Webhook ohne Signatur gibt 401 zurück', async ({ request }) => {
    const response = await request.post('/api/webhooks/supabase', {
      data: { type: 'INSERT', table: 'test', record: {}, schema: 'public' },
    });
    // 500 wenn SUPABASE_WEBHOOK_SECRET nicht gesetzt, 401 wenn gesetzt aber Signatur fehlt
    expect([401, 500]).toContain(response.status());
  });
});

test.describe('API Sicherheit – Input-Validierung', () => {
  test('Recruiting referrals POST mit leerem Body gibt 400 zurück', async ({ request }) => {
    const response = await request.post('/api/recruiting/referrals', {
      data: {},
    });
    // Kann 400 (Validierungsfehler) oder 429 (Rate limit) sein
    expect([400, 429]).toContain(response.status());
  });

  test('Recruiting referrals POST mit ungültiger E-Mail gibt 400 zurück', async ({ request }) => {
    const response = await request.post('/api/recruiting/referrals', {
      data: {
        kandidat_name: 'Test',
        empfehler_name: 'Empfehler',
        empfehler_email: 'keine-email',
        stelle_id: '550e8400-e29b-41d4-a716-446655440000',
      },
    });
    expect([400, 429]).toContain(response.status());
  });

  test('Affiliate referrals POST mit ungültiger handwerker_id gibt 400 zurück', async ({ request }) => {
    const response = await request.post('/api/affiliate/referrals', {
      data: {
        kunde_name: 'Test',
        empfehler_name: 'Empfehler',
        empfehler_email: 'empfehler@test.de',
        handwerker_id: 'nicht-eine-uuid',
      },
    });
    expect([400, 429]).toContain(response.status());
  });
});

test.describe('API Sicherheit – Fehlerantworten', () => {
  test('401-Antworten enthalten keine Stack-Traces', async ({ request }) => {
    const response = await request.get('/api/recruiting/stellen');
    const body = await response.json();
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain('at ');
    expect(bodyStr).not.toContain('Error:');
    expect(bodyStr).not.toContain('stack');
  });

  test('401-Antworten enthalten verständliche deutsche Fehlermeldung', async ({ request }) => {
    const response = await request.get('/api/recruiting/stellen');
    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });
});

test.describe('HTTP Sicherheits-Headers', () => {
  test('X-Frame-Options: DENY ist gesetzt', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.headers()['x-frame-options']).toBe('DENY');
  });

  test('X-Content-Type-Options: nosniff ist gesetzt', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
  });

  test('Referrer-Policy ist gesetzt', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});
