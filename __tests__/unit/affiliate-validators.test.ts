import { describe, it, expect } from 'vitest';
import {
  empfehlungCreateSchema,
  empfehlungCompleteSchema,
  handwerkerCreateSchema,
  handwerkerUpdateSchema,
} from '@/lib/modules/affiliate/validators';

describe('Affiliate Validators', () => {
  describe('empfehlungCreateSchema', () => {
    const valid = {
      kunde_name: 'Max Mustermann',
      empfehler_name: 'Anna Beispiel',
      empfehler_email: 'anna@beispiel.de',
      handwerker_id: '550e8400-e29b-41d4-a716-446655440000',
    };

    it('akzeptiert gültige Empfehlung', () => {
      expect(empfehlungCreateSchema.safeParse(valid).success).toBe(true);
    });

    it('lehnt leeren kunde_name ab', () => {
      expect(empfehlungCreateSchema.safeParse({ ...valid, kunde_name: '' }).success).toBe(false);
    });

    it('lehnt ungültige handwerker_id (kein UUID) ab', () => {
      expect(empfehlungCreateSchema.safeParse({ ...valid, handwerker_id: 'invalid' }).success).toBe(false);
    });

    it('lehnt ungültige E-Mail ab', () => {
      expect(empfehlungCreateSchema.safeParse({ ...valid, empfehler_email: 'foo' }).success).toBe(false);
    });
  });

  describe('empfehlungCompleteSchema', () => {
    it('akzeptiert gültigen Rechnungsbetrag', () => {
      expect(empfehlungCompleteSchema.safeParse({ rechnungsbetrag: 1500.50 }).success).toBe(true);
    });

    it('lehnt negativen Betrag ab', () => {
      expect(empfehlungCompleteSchema.safeParse({ rechnungsbetrag: -1 }).success).toBe(false);
    });

    it('lehnt Betrag von 0 ab', () => {
      expect(empfehlungCompleteSchema.safeParse({ rechnungsbetrag: 0 }).success).toBe(false);
    });

    it('lehnt Betrag > 999999 ab', () => {
      expect(empfehlungCompleteSchema.safeParse({ rechnungsbetrag: 1000000 }).success).toBe(false);
    });
  });

  describe('handwerkerCreateSchema', () => {
    const valid = {
      name: 'Hans Handwerker',
      email: 'hans@handwerk.de',
      provision_prozent: 5,
    };

    it('akzeptiert gültigen Handwerker', () => {
      expect(handwerkerCreateSchema.safeParse(valid).success).toBe(true);
    });

    it('lehnt provision_prozent > 50 ab', () => {
      expect(handwerkerCreateSchema.safeParse({ ...valid, provision_prozent: 51 }).success).toBe(false);
    });

    it('lehnt provision_prozent < 0 ab', () => {
      expect(handwerkerCreateSchema.safeParse({ ...valid, provision_prozent: -1 }).success).toBe(false);
    });

    it('akzeptiert provision_prozent = 0 (kein Rabatt)', () => {
      expect(handwerkerCreateSchema.safeParse({ ...valid, provision_prozent: 0 }).success).toBe(true);
    });
  });

  describe('handwerkerUpdateSchema', () => {
    it('akzeptiert Teilaktualisierung', () => {
      expect(handwerkerUpdateSchema.safeParse({ name: 'Neuer Name' }).success).toBe(true);
    });

    it('akzeptiert nullable telefon', () => {
      expect(handwerkerUpdateSchema.safeParse({ telefon: null }).success).toBe(true);
    });

    it('akzeptiert leeres Objekt', () => {
      expect(handwerkerUpdateSchema.safeParse({}).success).toBe(true);
    });
  });
});
