import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimit, RATE_LIMITS } from '@/lib/modules/recruiting/rate-limit';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Jeder Test bekommt eine eigene, einzigartige IP
  });

  it('erlaubt die erste Anfrage', () => {
    const result = checkRateLimit('test-ip-1', { windowMs: 60000, maxRequests: 5 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blockiert nach Erreichen des Limits', () => {
    const config = { windowMs: 60000, maxRequests: 3 };
    const ip = 'test-ip-block';

    checkRateLimit(ip, config);
    checkRateLimit(ip, config);
    checkRateLimit(ip, config);
    const result = checkRateLimit(ip, config); // 4. Anfrage — muss blockiert sein

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('verringert remaining korrekt', () => {
    const config = { windowMs: 60000, maxRequests: 10 };
    const ip = 'test-ip-remaining';

    const r1 = checkRateLimit(ip, config);
    expect(r1.remaining).toBe(9);

    const r2 = checkRateLimit(ip, config);
    expect(r2.remaining).toBe(8);
  });

  it('resetAt liegt in der Zukunft', () => {
    const config = { windowMs: 60000, maxRequests: 5 };
    const result = checkRateLimit('test-ip-reset', config);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it('verschiedene IPs haben unabhängige Counter', () => {
    const config = { windowMs: 60000, maxRequests: 2 };

    checkRateLimit('ip-a', config);
    checkRateLimit('ip-a', config);
    const blockedA = checkRateLimit('ip-a', config);
    expect(blockedA.allowed).toBe(false);

    const allowedB = checkRateLimit('ip-b', config);
    expect(allowedB.allowed).toBe(true);
  });

  it('RATE_LIMITS enthält die erwarteten Konfigurationen', () => {
    expect(RATE_LIMITS.referralCreate.maxRequests).toBe(20);
    expect(RATE_LIMITS.referralCreate.windowMs).toBe(60 * 60 * 1000);
    expect(RATE_LIMITS.general.maxRequests).toBe(60);
  });
});
