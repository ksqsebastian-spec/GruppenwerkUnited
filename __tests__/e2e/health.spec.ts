import { test, expect } from '@playwright/test';

/**
 * Health-Endpoint Tests
 * Prüft grundlegende Erreichbarkeit und Antwortstruktur
 */
test.describe('Health Endpoint', () => {
  test('gibt HTTP 200 und Status ok zurück', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
  });

  test('timestamp ist valides ISO-Datum', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();
    const date = new Date(body.timestamp);
    expect(date.getTime()).not.toBeNaN();
  });
});
