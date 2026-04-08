import { describe, it, expect } from 'vitest';
import { empfehlungCreateSchema, stelleCreateSchema, stelleUpdateSchema, paginationSchema } from '@/lib/modules/recruiting/validators';

describe('Recruiting Validators', () => {
  describe('empfehlungCreateSchema', () => {
    const valid = {
      kandidat_name: 'Max Mustermann',
      empfehler_name: 'Anna Beispiel',
      empfehler_email: 'anna@beispiel.de',
      stelle_id: '550e8400-e29b-41d4-a716-446655440000',
    };

    it('akzeptiert gültige Empfehlung', () => {
      const result = empfehlungCreateSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('lehnt leeren kandidat_name ab', () => {
      const result = empfehlungCreateSchema.safeParse({ ...valid, kandidat_name: '' });
      expect(result.success).toBe(false);
    });

    it('lehnt ungültige E-Mail ab', () => {
      const result = empfehlungCreateSchema.safeParse({ ...valid, empfehler_email: 'keine-email' });
      expect(result.success).toBe(false);
    });

    it('lehnt ungültige stelle_id (kein UUID) ab', () => {
      const result = empfehlungCreateSchema.safeParse({ ...valid, stelle_id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('lehnt zu langen kandidat_name (>120 Zeichen) ab', () => {
      const result = empfehlungCreateSchema.safeParse({ ...valid, kandidat_name: 'A'.repeat(121) });
      expect(result.success).toBe(false);
    });

    it('akzeptiert gültigen ref_code', () => {
      const result = empfehlungCreateSchema.safeParse({ ...valid, ref_code: '#SEE-2024-AB12CD' });
      expect(result.success).toBe(true);
    });

    it('lehnt ref_code mit falschem Format ab', () => {
      const result = empfehlungCreateSchema.safeParse({ ...valid, ref_code: 'SEE-2024-ABCDEF' });
      expect(result.success).toBe(false);
    });

    it('akzeptiert optionale Felder als undefined', () => {
      const result = empfehlungCreateSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.kandidat_kontakt).toBeUndefined();
        expect(result.data.ref_code).toBeUndefined();
      }
    });
  });

  describe('stelleCreateSchema', () => {
    it('akzeptiert gültige Stelle', () => {
      const result = stelleCreateSchema.safeParse({ title: 'Softwareentwickler' });
      expect(result.success).toBe(true);
    });

    it('lehnt leeren Titel ab', () => {
      const result = stelleCreateSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });

    it('lehnt Titel > 200 Zeichen ab', () => {
      const result = stelleCreateSchema.safeParse({ title: 'A'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('lehnt description > 2000 Zeichen ab', () => {
      const result = stelleCreateSchema.safeParse({ title: 'Test', description: 'A'.repeat(2001) });
      expect(result.success).toBe(false);
    });
  });

  describe('stelleUpdateSchema', () => {
    it('akzeptiert Teilaktualisierung mit nur active', () => {
      const result = stelleUpdateSchema.safeParse({ active: false });
      expect(result.success).toBe(true);
    });

    it('akzeptiert nullable description', () => {
      const result = stelleUpdateSchema.safeParse({ description: null });
      expect(result.success).toBe(true);
    });

    it('akzeptiert leeres Objekt', () => {
      const result = stelleUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('paginationSchema', () => {
    it('akzeptiert gültige Pagination', () => {
      const result = paginationSchema.safeParse({ page: '2', pageSize: '10' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.pageSize).toBe(10);
      }
    });

    it('verwendet Standardwerte bei fehlenden Params', () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it('lehnt page = 0 ab', () => {
      const result = paginationSchema.safeParse({ page: '0' });
      expect(result.success).toBe(false);
    });

    it('lehnt pageSize > 100 ab', () => {
      const result = paginationSchema.safeParse({ page: '1', pageSize: '101' });
      expect(result.success).toBe(false);
    });
  });
});
