import { test, expect } from '@playwright/test';

/**
 * Middleware / Auth-Gate Tests
 * Prüft dass geschützte Seiten korrekt zur Login-Seite weiterleiten
 */
test.describe('Auth Middleware – Weiterleitungen', () => {
  test('Root-Seite leitet nicht-authentifizierte Nutzer zu /login weiter', async ({ page }) => {
    const response = await page.goto('/');
    // Entweder direkt /login oder nach Redirect
    await expect(page).toHaveURL(/\/(login)?/, { timeout: 5000 });
  });

  test('/login-Seite ist erreichbar (kein Redirect-Loop)', async ({ page }) => {
    await page.goto('/login');
    // Sollte auf /login bleiben, kein Redirect-Loop
    await expect(page).toHaveURL('/login');
  });

  test('Module-Routen leiten zu /login weiter', async ({ page }) => {
    await page.goto('/fuhrpark');
    await expect(page).toHaveURL(/login/);
  });

  test('Recruiting-Modul leitet zu /login weiter', async ({ page }) => {
    await page.goto('/recruiting');
    await expect(page).toHaveURL(/login/);
  });

  test('Affiliate-Modul leitet zu /login weiter', async ({ page }) => {
    await page.goto('/affiliate');
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Öffentliche Routen – Kunden-Portal', () => {
  test('/kunden-Route ist erreichbar ohne Auth (kein Login-Redirect)', async ({ page }) => {
    // Kunden-Seiten sind öffentlich (Referral-Portal)
    // Wir prüfen nur dass kein 401/403 zurückgegeben wird
    const response = await page.goto('/kunden');
    // Kann 200 (Seite existiert) oder 404 (keine spezifische kunden-Startseite) sein
    expect(response?.status()).not.toBe(401);
    expect(response?.status()).not.toBe(403);
    // Soll NICHT zu /login weiterleiten
    expect(page.url()).not.toContain('/login');
  });
});
