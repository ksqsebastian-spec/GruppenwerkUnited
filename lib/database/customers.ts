// Barrel-Datei: bündelt die nach Domäne aufgeteilten Kunden-Datenzugriffe.
// Alle bestehenden Importe von '@/lib/database/customers' bleiben gültig.

export * from './customers/crud';
export * from './customers/kommentare';
export * from './customers/dateien';
export * from './customers/prompts';
export * from './customers/render';
export * from './customers/lead-import';
export * from './customers/mappings';
export * from './customers/datei-vorlagen';
