import { describe, it, expect } from 'vitest';

// Validierungslogik wie in den PATCH-Routen implementiert
function validateIban(iban: unknown): boolean {
  return typeof iban === 'string' && iban.length <= 34;
}

function validateBic(bic: unknown): boolean {
  return typeof bic === 'string' && bic.length <= 11;
}

function validateKontoinhaber(kontoinhaber: unknown): boolean {
  return typeof kontoinhaber === 'string' && kontoinhaber.length <= 120;
}

describe('Bankdaten-Validierung (Empfehlungen PATCH)', () => {
  describe('IBAN', () => {
    it('akzeptiert gültige deutsche IBAN', () => {
      expect(validateIban('DE89370400440532013000')).toBe(true);
    });

    it('akzeptiert maximale Länge (34 Zeichen)', () => {
      expect(validateIban('A'.repeat(34))).toBe(true);
    });

    it('lehnt zu lange IBAN ab', () => {
      expect(validateIban('A'.repeat(35))).toBe(false);
    });

    it('lehnt nicht-String ab', () => {
      expect(validateIban(12345)).toBe(false);
      expect(validateIban(null)).toBe(false);
      expect(validateIban(undefined)).toBe(false);
    });
  });

  describe('BIC', () => {
    it('akzeptiert gültige BIC', () => {
      expect(validateBic('COBADEFFXXX')).toBe(true);
    });

    it('akzeptiert maximale Länge (11 Zeichen)', () => {
      expect(validateBic('COBADEFFXXX')).toBe(true); // 11 Zeichen
    });

    it('lehnt zu lange BIC ab', () => {
      expect(validateBic('A'.repeat(12))).toBe(false);
    });

    it('lehnt nicht-String ab', () => {
      expect(validateBic(12345)).toBe(false);
    });
  });

  describe('Kontoinhaber', () => {
    it('akzeptiert gültigen Namen', () => {
      expect(validateKontoinhaber('Max Mustermann')).toBe(true);
    });

    it('akzeptiert Maximallänge (120 Zeichen)', () => {
      expect(validateKontoinhaber('A'.repeat(120))).toBe(true);
    });

    it('lehnt zu langen Namen ab', () => {
      expect(validateKontoinhaber('A'.repeat(121))).toBe(false);
    });
  });
});

describe('Einstellungen-Validierung (settings PATCH)', () => {
  function validatePraemieBetrag(val: unknown): boolean {
    return (
      typeof val === 'number' &&
      val >= 0 &&
      val <= 99999 &&
      isFinite(val)
    );
  }

  it('akzeptiert gültigen Betrag', () => {
    expect(validatePraemieBetrag(1000)).toBe(true);
  });

  it('akzeptiert 0', () => {
    expect(validatePraemieBetrag(0)).toBe(true);
  });

  it('akzeptiert Maximalbetrag 99999', () => {
    expect(validatePraemieBetrag(99999)).toBe(true);
  });

  it('lehnt negativen Betrag ab', () => {
    expect(validatePraemieBetrag(-1)).toBe(false);
  });

  it('lehnt Betrag > 99999 ab', () => {
    expect(validatePraemieBetrag(100000)).toBe(false);
  });

  it('lehnt Infinity ab', () => {
    expect(validatePraemieBetrag(Infinity)).toBe(false);
  });

  it('lehnt NaN ab', () => {
    expect(validatePraemieBetrag(NaN)).toBe(false);
  });

  it('lehnt String ab', () => {
    expect(validatePraemieBetrag('1000')).toBe(false);
  });
});
