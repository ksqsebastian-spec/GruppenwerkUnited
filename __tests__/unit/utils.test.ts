import { describe, it, expect } from 'vitest';
import { berechneProvision, getInitials, formatCurrency } from '@/lib/modules/affiliate/utils';
import { getInitials as getRecruitingInitials } from '@/lib/modules/recruiting/utils';

describe('berechneProvision', () => {
  it('berechnet 5% Provision korrekt', () => {
    expect(berechneProvision(1000, 5)).toBe(50);
  });

  it('berechnet 10% Provision korrekt', () => {
    expect(berechneProvision(2500, 10)).toBe(250);
  });

  it('rundet auf 2 Dezimalstellen', () => {
    // 1000 * (7.5 / 100) = 75 (genau)
    expect(berechneProvision(1000, 7.5)).toBe(75);
  });

  it('rundet korrekt bei Fließkommazahl', () => {
    // 100 * (1/3) = 33.333... → 33.33
    const result = berechneProvision(100, 1 / 3);
    expect(result).toBeCloseTo(0.33, 2);
  });

  it('gibt 0 zurück bei 0% Provision', () => {
    expect(berechneProvision(1000, 0)).toBe(0);
  });

  it('berechnet Provision für hohe Beträge', () => {
    expect(berechneProvision(99999, 5)).toBeCloseTo(4999.95, 2);
  });
});

describe('getInitials (Affiliate)', () => {
  it('gibt Initialen von Vor- und Nachname zurück', () => {
    expect(getInitials('Hans Mustermann')).toBe('HM');
  });

  it('gibt maximal 2 Zeichen zurück', () => {
    expect(getInitials('Anna Maria Beispiel')).toBe('AM');
  });

  it('gibt Großbuchstaben zurück', () => {
    expect(getInitials('anna mustermann')).toBe('AM');
  });

  it('behandelt einstelligen Namen', () => {
    expect(getInitials('Hans')).toBe('H');
  });

  it('behandelt mehrfache Leerzeichen', () => {
    expect(getInitials('Hans  Mustermann')).toBe('HM');
  });
});

describe('getInitials (Recruiting)', () => {
  it('gibt Initialen korrekt zurück', () => {
    expect(getRecruitingInitials('Max Muster')).toBe('MM');
  });
});

describe('formatCurrency', () => {
  it('formatiert Euro-Beträge im deutschen Format', () => {
    const result = formatCurrency(1234.56);
    // Verschiedene Node.js-Versionen können das Format leicht variieren
    expect(result).toContain('1.234,56');
    expect(result).toContain('€');
  });

  it('formatiert 0 korrekt', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0,00');
  });
});

describe('CSV Formel-Injection Schutz (Export-Routen)', () => {
  // Diese Logik wird in beiden Export-Routen verwendet
  // Wir testen die Funktion isoliert
  function escapeCsv(val: string | number | null | undefined): string {
    if (val === null || val === undefined) return '';
    const str = String(val);
    const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
    if (safe.includes(',') || safe.includes('"') || safe.includes('\n') || safe.includes('\r')) {
      return `"${safe.replace(/"/g, '""')}"`;
    }
    return safe;
  }

  it('lässt normale Strings unverändert', () => {
    expect(escapeCsv('Max Mustermann')).toBe('Max Mustermann');
  });

  it('escaped Kommas mit Anführungszeichen', () => {
    expect(escapeCsv('Mustermann, Max')).toBe('"Mustermann, Max"');
  });

  it('escaped eingebettete Anführungszeichen', () => {
    expect(escapeCsv('Say "hello"')).toBe('"Say ""hello"""');
  });

  it('schützt vor Formel-Injection mit =', () => {
    // Wert enthält Anführungszeichen → wird CSV-gequoted, Apostrophe-Präfix im CSV-Wert enthalten
    const result = escapeCsv('=HYPERLINK("http://evil.com")');
    expect(result).toContain("'=");
  });

  it('schützt vor Formel-Injection mit + (ohne Sonderzeichen)', () => {
    // Kein Komma/Anführungszeichen → direktes Startswith
    const result = escapeCsv('+FORMEL');
    expect(result.startsWith("'+")).toBe(true);
  });

  it('schützt vor Formel-Injection mit -', () => {
    const result = escapeCsv('-FORMEL');
    expect(result.startsWith("'-")).toBe(true);
  });

  it('schützt vor Formel-Injection mit @ (ohne Sonderzeichen)', () => {
    expect(escapeCsv('@SUM(A1)').startsWith("'@")).toBe(true);
  });

  it('gibt leeren String für null zurück', () => {
    expect(escapeCsv(null)).toBe('');
  });

  it('gibt leeren String für undefined zurück', () => {
    expect(escapeCsv(undefined)).toBe('');
  });

  it('konvertiert Zahlen korrekt', () => {
    expect(escapeCsv(1234)).toBe('1234');
  });
});
