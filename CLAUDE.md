# CLAUDE.md – Verbindliche Regeln für Claude Code

**Projekt:** Fuhrpark Management App  
**Version:** 1.0  
**Status:** VERBINDLICH – Keine Ausnahmen erlaubt

---

## 0. GIT & DEPLOYMENT

- Nach jedem Commit **automatisch pushen** – kein Warten auf Bestätigung.
- Immer auf `main` pushen (Vercel deployed von `main`): `git push origin HEAD:main`
- Feature-Branch ebenfalls synchron halten.

---

## ⚠️ KRITISCHE ANWEISUNGEN

Diese Regeln sind **ABSOLUT VERBINDLICH**. Bei jeder Code-Änderung, jedem neuen Feature und jeder Fehlerbehebung MÜSSEN diese Regeln befolgt werden. Es gibt **KEINE AUSNAHMEN**.

**Bei Unsicherheit:** Frage nach, bevor du Code schreibst. Falsch implementierter Code muss komplett neu geschrieben werden.

---

## 1. SPRACHE & LOKALISIERUNG

### 1.1 Deutsche Sprache – AUSNAHMSLOS

```
✅ RICHTIG:
- "Speichern"
- "Fahrzeug erfolgreich angelegt"
- "Bitte gib ein gültiges Kennzeichen ein"
- "Löschen"
- "Abbrechen"
- "Weiter"
- "Zurück"
- "Suchen..."
- "Keine Ergebnisse gefunden"
- "Wird geladen..."

❌ FALSCH:
- "Save"
- "Vehicle created successfully"
- "Please enter a valid license plate"
- "Delete"
- "Cancel"
- "Loading..."
```

### 1.2 Alle UI-Texte auf Deutsch

| Bereich | Regel |
|---------|-------|
| Buttons | Deutsche Beschriftung |
| Labels | Deutsche Beschriftung |
| Placeholder | Deutsche Texte |
| Fehlermeldungen | Deutsche, verständliche Texte |
| Toasts | Deutsche Benachrichtigungen |
| Tooltips | Deutsche Erklärungen |
| Tabellen-Header | Deutsche Spaltenüberschriften |
| Leere Zustände | Deutsche Texte |
| Bestätigungsdialoge | Deutsche Fragen und Buttons |

### 1.3 Code-Kommentare

- Kommentare im Code: **DEUTSCH**
- Variablennamen: **ENGLISCH** (technischer Standard)
- Funktionsnamen: **ENGLISCH** (technischer Standard)
- TypeScript-Typen: **ENGLISCH** (technischer Standard)

```typescript
// ✅ RICHTIG
// Lädt alle Fahrzeuge aus der Datenbank
async function fetchVehicles(): Promise<Vehicle[]> {
  // Filtert nach aktiven Fahrzeugen
  const { data } = await supabase
    .from('vehicles')
    .select('*')
    .eq('status', 'active');
  
  return data ?? [];
}

// ❌ FALSCH
// Fetches all vehicles from database
async function fetchVehicles(): Promise<Vehicle[]> {
  // Filter by active status
  ...
}
```

---

## 2. CODE-ARCHITEKTUR

### 2.1 Datei-Organisation – STRIKT

```
REGEL: Eine Komponente = Eine Datei
REGEL: Keine Komponente über 300 Zeilen
REGEL: Bei >300 Zeilen → In kleinere Komponenten aufteilen
```

**Dateinamen:**
```
✅ RICHTIG:
vehicle-form.tsx
vehicle-table.tsx
damage-status-badge.tsx

❌ FALSCH:
VehicleForm.tsx        (Kein PascalCase für Dateien)
vehicleform.tsx        (Kein zusammengeschrieben)
vehicle_form.tsx       (Keine Underscores)
```

### 2.2 Ordnerstruktur – UNVERÄNDERLICH

Die Ordnerstruktur aus dem PRD ist **VERBINDLICH**. Neue Dateien MÜSSEN in den korrekten Ordner:

```
/app                    → Nur Seiten (page.tsx, layout.tsx)
/components/ui          → Nur shadcn Komponenten
/components/[feature]   → Feature-spezifische Komponenten
/components/shared      → Übergreifende Komponenten
/components/layout      → Layout-Komponenten
/lib                    → Hilfsfunktionen, Validierung, Supabase
/hooks                  → Custom React Hooks
/types                  → TypeScript Typen
```

**VERBOTEN:**
- Neue Top-Level-Ordner erstellen
- Dateien außerhalb der Struktur ablegen
- `/utils`, `/helpers`, `/services` Ordner (→ gehört in `/lib`)

### 2.3 Import-Reihenfolge – IMMER EINHALTEN

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Externe Libraries
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// 3. UI Komponenten
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 4. Feature Komponenten
import { VehicleCard } from '@/components/vehicles/vehicle-card';

// 5. Hooks
import { useVehicles } from '@/hooks/use-vehicles';

// 6. Lib/Utils
import { supabase } from '@/lib/supabase/client';
import { vehicleSchema } from '@/lib/validations/vehicle';

// 7. Types
import type { Vehicle } from '@/types';

// 8. Styles (falls nötig)
import './styles.css';
```

---

## 3. TYPESCRIPT – STRIKT

### 3.1 Keine `any` Types – NIEMALS

```typescript
// ✅ RICHTIG
function processData(data: Vehicle[]): ProcessedVehicle[] { ... }

// ❌ VERBOTEN
function processData(data: any): any { ... }
```

### 3.2 Explizite Return Types – IMMER

```typescript
// ✅ RICHTIG
function calculateTotal(items: CostItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

async function fetchVehicle(id: string): Promise<Vehicle | null> {
  ...
}

// ❌ FALSCH
function calculateTotal(items: CostItem[]) {  // Fehlender Return Type
  return items.reduce((sum, item) => sum + item.amount, 0);
}
```

### 3.3 Typen-Definition – ZENTRAL

```typescript
// ✅ RICHTIG: Typen in /types/index.ts definieren
// /types/index.ts
export interface Vehicle {
  id: string;
  license_plate: string;
  brand: string;
  model: string;
  // ...
}

// In Komponente importieren
import type { Vehicle } from '@/types';

// ❌ FALSCH: Typen lokal in Komponente definieren
// /components/vehicles/vehicle-card.tsx
interface Vehicle {  // NEIN! Gehört in /types
  id: string;
  ...
}
```

### 3.4 Null-Safety – IMMER PRÜFEN

```typescript
// ✅ RICHTIG
const vehicle = data?.vehicle;
if (!vehicle) {
  return <EmptyState message="Fahrzeug nicht gefunden" />;
}

// ❌ FALSCH
const vehicle = data.vehicle;  // Kann crashen wenn data undefined
return <div>{vehicle.license_plate}</div>;
```

---

## 4. REACT PATTERNS

### 4.1 Funktionale Komponenten – AUSSCHLIESSLICH

```typescript
// ✅ RICHTIG
export function VehicleCard({ vehicle }: VehicleCardProps): JSX.Element {
  return <div>...</div>;
}

// ❌ VERBOTEN
export class VehicleCard extends React.Component {
  render() { ... }
}
```

### 4.2 Props Interface – IMMER DEFINIEREN

```typescript
// ✅ RICHTIG
interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export function VehicleCard({ 
  vehicle, 
  onEdit, 
  onDelete,
  isLoading = false 
}: VehicleCardProps): JSX.Element {
  ...
}

// ❌ FALSCH
export function VehicleCard(props: any) {  // Kein any!
  ...
}

export function VehicleCard({ vehicle, onEdit }) {  // Fehlende Types
  ...
}
```

### 4.3 Event Handler Naming – KONVENTION

```typescript
// ✅ RICHTIG
const handleSubmit = () => { ... };
const handleDelete = () => { ... };
const handleInputChange = () => { ... };

// Props
onSubmit?: () => void;
onDelete?: () => void;
onChange?: () => void;

// ❌ FALSCH
const submitHandler = () => { ... };
const doDelete = () => { ... };
const inputChanged = () => { ... };
```

### 4.4 Conditional Rendering – KLARE STRUKTUR

```typescript
// ✅ RICHTIG
if (isLoading) {
  return <LoadingSpinner />;
}

if (error) {
  return <ErrorMessage message={error.message} />;
}

if (!data || data.length === 0) {
  return <EmptyState message="Keine Fahrzeuge gefunden" />;
}

return <VehicleTable data={data} />;

// ❌ FALSCH
return (
  <>
    {isLoading && <LoadingSpinner />}
    {error && <ErrorMessage />}
    {!isLoading && !error && data && data.length > 0 && <VehicleTable />}
    {!isLoading && !error && (!data || data.length === 0) && <EmptyState />}
  </>
);
```

---

## 5. FORMULARE

### 5.1 React Hook Form + Zod – IMMER

```typescript
// ✅ RICHTIG: Vollständige Formular-Implementierung
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vehicleSchema, type VehicleFormData } from '@/lib/validations/vehicle';

export function VehicleForm(): JSX.Element {
  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      license_plate: '',
      brand: '',
      model: '',
      // Alle Felder mit Default-Werten
    },
  });

  const onSubmit = async (data: VehicleFormData): Promise<void> => {
    // Verarbeitung
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form Fields */}
      </form>
    </Form>
  );
}
```

### 5.2 Validierungs-Schemas – IN /lib/validations/

```typescript
// /lib/validations/vehicle.ts
import { z } from 'zod';

export const vehicleSchema = z.object({
  license_plate: z
    .string()
    .min(1, 'Kennzeichen ist erforderlich')
    .regex(/^[A-ZÄÖÜ]{1,3}-[A-ZÄÖÜ]{1,2}\s?\d{1,4}[A-Z]?$/i, 
      'Ungültiges Kennzeichen-Format (z.B. HH-AB 1234)'),
  
  brand: z
    .string()
    .min(2, 'Marke muss mindestens 2 Zeichen haben'),
  
  model: z
    .string()
    .min(2, 'Modell muss mindestens 2 Zeichen haben'),
  
  year: z
    .number()
    .min(1990, 'Baujahr muss nach 1990 sein')
    .max(new Date().getFullYear(), 'Baujahr darf nicht in der Zukunft liegen'),
  
  // Alle Felder mit deutschen Fehlermeldungen
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
```

### 5.3 Fehlermeldungen – IMMER DEUTSCH UND HILFREICH

```typescript
// ✅ RICHTIG
'Kennzeichen ist erforderlich'
'Bitte gib eine gültige E-Mail-Adresse ein'
'Das Datum darf nicht in der Zukunft liegen'
'Die Datei ist zu groß (maximal 10 MB)'
'Nur PDF, JPG, PNG und WEBP Dateien sind erlaubt'

// ❌ FALSCH
'Required'
'Invalid email'
'Invalid date'
'File too large'
```

### 5.4 Auto-Save – PFLICHT FÜR ALLE FORMULARE

```typescript
// Jedes Formular MUSS Auto-Save implementieren
import { useAutoSave } from '@/hooks/use-auto-save';

export function VehicleForm(): JSX.Element {
  const form = useForm<VehicleFormData>({ ... });
  
  // Auto-Save Hook MUSS verwendet werden
  useAutoSave({
    key: 'vehicle-form',
    data: form.watch(),
    onRestore: (data) => form.reset(data),
  });
  
  return ( ... );
}
```

---

## 6. DATENBANK & SUPABASE

### 6.1 Supabase Client – KORREKTE VERWENDUNG

```typescript
// Client-Komponenten (use client)
import { supabase } from '@/lib/supabase/client';

// Server-Komponenten / API Routes
import { createServerClient } from '@/lib/supabase/server';
```

### 6.2 Queries – IMMER MIT ERROR HANDLING

```typescript
// ✅ RICHTIG
async function fetchVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('status', 'active')
    .order('license_plate');
  
  if (error) {
    console.error('Fehler beim Laden der Fahrzeuge:', error);
    throw new Error('Fahrzeuge konnten nicht geladen werden');
  }
  
  return data ?? [];
}

// ❌ FALSCH
async function fetchVehicles() {
  const { data } = await supabase.from('vehicles').select('*');
  return data;  // Error wird ignoriert!
}
```

### 6.3 Mutations – MIT VALIDIERUNG

```typescript
// ✅ RICHTIG
async function createVehicle(formData: VehicleFormData): Promise<Vehicle> {
  // 1. Validierung
  const validated = vehicleSchema.parse(formData);
  
  // 2. Insert
  const { data, error } = await supabase
    .from('vehicles')
    .insert(validated)
    .select()
    .single();
  
  // 3. Error Handling
  if (error) {
    if (error.code === '23505') {  // Unique constraint
      throw new Error('Ein Fahrzeug mit diesem Kennzeichen existiert bereits');
    }
    throw new Error('Fahrzeug konnte nicht angelegt werden');
  }
  
  return data;
}
```

### 6.4 TanStack Query – IMMER FÜR DATA FETCHING

```typescript
// ✅ RICHTIG
// /hooks/use-vehicles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useVehicles(filters?: VehicleFilters) {
  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => fetchVehicles(filters),
    staleTime: 5 * 60 * 1000,  // 5 Minuten
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      // Cache invalidieren nach Mutation
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}
```

---

## 7. ERROR HANDLING

### 7.1 Fehler-Hierarchie – IMMER EINHALTEN

```
1. Validierungsfehler → Inline bei Formularfeld
2. API-Fehler → Toast-Benachrichtigung
3. Kritische Fehler → Error-Boundary mit Fallback-UI
```

### 7.2 Error Messages – ZENTRAL DEFINIERT

```typescript
// /lib/errors/messages.ts
export const ERROR_MESSAGES = {
  // Allgemein
  UNKNOWN: 'Ein unbekannter Fehler ist aufgetreten. Bitte versuche es erneut.',
  NETWORK: 'Keine Internetverbindung. Bitte prüfe dein Netzwerk.',
  UNAUTHORIZED: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
  
  // Fahrzeuge
  VEHICLE_NOT_FOUND: 'Fahrzeug nicht gefunden.',
  VEHICLE_CREATE_FAILED: 'Fahrzeug konnte nicht angelegt werden.',
  VEHICLE_UPDATE_FAILED: 'Fahrzeug konnte nicht aktualisiert werden.',
  VEHICLE_DELETE_FAILED: 'Fahrzeug konnte nicht gelöscht werden.',
  VEHICLE_DUPLICATE_PLATE: 'Ein Fahrzeug mit diesem Kennzeichen existiert bereits.',
  
  // Uploads
  FILE_TOO_LARGE: 'Die Datei ist zu groß. Maximal 10 MB erlaubt.',
  FILE_INVALID_TYPE: 'Ungültiges Dateiformat. Erlaubt: PDF, JPG, PNG, WEBP.',
  UPLOAD_FAILED: 'Datei konnte nicht hochgeladen werden.',
  
  // ... weitere Fehlermeldungen
} as const;
```

### 7.3 Error Handling in Komponenten

```typescript
// ✅ RICHTIG
export function VehicleList(): JSX.Element {
  const { data, error, isLoading } = useVehicles();
  
  if (isLoading) {
    return <LoadingSpinner text="Fahrzeuge werden geladen..." />;
  }
  
  if (error) {
    return (
      <ErrorState 
        message="Fahrzeuge konnten nicht geladen werden"
        onRetry={() => window.location.reload()}
      />
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <EmptyState 
        title="Keine Fahrzeuge"
        description="Es wurden noch keine Fahrzeuge angelegt."
        action={
          <Button asChild>
            <Link href="/vehicles/new">Erstes Fahrzeug anlegen</Link>
          </Button>
        }
      />
    );
  }
  
  return <VehicleTable data={data} />;
}
```

### 7.4 Toast-Benachrichtigungen

```typescript
// ✅ RICHTIG
import { toast } from 'sonner';

// Erfolg
toast.success('Fahrzeug erfolgreich gespeichert');

// Fehler
toast.error('Speichern fehlgeschlagen. Bitte versuche es erneut.');

// Warnung
toast.warning('Einige Daten konnten nicht geladen werden');

// Info
toast.info('Änderungen werden gespeichert...');

// Mit Aktion
toast.error('Speichern fehlgeschlagen', {
  action: {
    label: 'Erneut versuchen',
    onClick: () => handleRetry(),
  },
});
```

---

## 8. UI KOMPONENTEN

### 8.1 shadcn/ui – IMMER VERWENDEN

```
REGEL: Für Standard-UI-Elemente IMMER shadcn/ui verwenden
REGEL: Keine eigenen Button, Input, Select, etc. bauen
REGEL: shadcn Komponenten NUR in /components/ui/
```

### 8.2 Styling – NUR TAILWIND

```typescript
// ✅ RICHTIG
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
  <Button className="w-full">Speichern</Button>
</div>

// ❌ VERBOTEN
<div style={{ display: 'flex', alignItems: 'center' }}>  // Keine Inline-Styles
<div className={styles.container}>  // Keine CSS-Modules
```

### 8.3 Responsive Design – MOBILE BEACHTEN

```typescript
// ✅ RICHTIG: Mobile-First
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/3">Sidebar</div>
  <div className="w-full md:w-2/3">Content</div>
</div>

// Tabellen responsiv
<div className="overflow-x-auto">
  <Table>...</Table>
</div>
```

### 8.4 Loading States – IMMER ANZEIGEN

```typescript
// ✅ RICHTIG
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Wird gespeichert...
    </>
  ) : (
    'Speichern'
  )}
</Button>

// ❌ FALSCH
<Button disabled={isLoading}>
  Speichern
</Button>
```

### 8.5 Leere Zustände – NIEMALS LEER LASSEN

```typescript
// ✅ RICHTIG
if (vehicles.length === 0) {
  return (
    <EmptyState
      icon={<Car className="h-12 w-12 text-muted-foreground" />}
      title="Keine Fahrzeuge vorhanden"
      description="Lege dein erstes Fahrzeug an, um zu beginnen."
      action={
        <Button asChild>
          <Link href="/vehicles/new">
            <Plus className="mr-2 h-4 w-4" />
            Fahrzeug anlegen
          </Link>
        </Button>
      }
    />
  );
}

// ❌ VERBOTEN
if (vehicles.length === 0) {
  return null;  // NIEMALS!
}

if (vehicles.length === 0) {
  return <p>Keine Daten</p>;  // Zu wenig Information
}
```

---

## 9. SICHERHEIT

### 9.1 Umgebungsvariablen – NIEMALS IM CODE

```typescript
// ✅ RICHTIG
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// ❌ VERBOTEN
const supabaseUrl = 'https://xyz.supabase.co';  // NIEMALS!
const apiKey = 'eyJhbG...';  // NIEMALS!
```

### 9.2 Server-Only Secrets – STRIKT TRENNEN

```
NEXT_PUBLIC_*   → Kann im Browser sichtbar sein
Ohne NEXT_PUBLIC_ → NUR auf Server verfügbar

REGEL: Service Role Key NIEMALS mit NEXT_PUBLIC_ prefix
```

### 9.3 Input Sanitization – IMMER

```typescript
// ✅ RICHTIG: Zod validiert und sanitized automatisch
const schema = z.object({
  name: z.string().trim().min(1),  // .trim() entfernt Whitespace
  email: z.string().email().toLowerCase(),  // .toLowerCase() normalisiert
});

// Bei HTML-Ausgabe
<div dangerouslySetInnerHTML={{ __html: content }} />  // ❌ VERBOTEN
<div>{content}</div>  // ✅ React escaped automatisch
```

### 9.4 Datei-Upload – STRENGE PRÜFUNG

```typescript
// /lib/validations/file-upload.ts
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      'Die Datei ist zu groß. Maximal 10 MB erlaubt.'
    )
    .refine(
      (file) => ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Ungültiges Dateiformat. Erlaubt: PDF, JPG, PNG, WEBP.'
    )
    .refine(
      (file) => !file.name.includes('..'),  // Path Traversal verhindern
      'Ungültiger Dateiname.'
    ),
});
```

---

## 10. PERFORMANCE

### 10.1 Lazy Loading – FÜR GROSSE KOMPONENTEN

```typescript
// ✅ RICHTIG
import dynamic from 'next/dynamic';

const VehicleCalendar = dynamic(
  () => import('@/components/appointments/appointment-calendar'),
  { 
    loading: () => <LoadingSpinner text="Kalender wird geladen..." />,
    ssr: false  // Falls Client-only
  }
);
```

### 10.2 Bilder – NEXT/IMAGE VERWENDEN

```typescript
// ✅ RICHTIG
import Image from 'next/image';

<Image 
  src={vehicle.image_url}
  alt={`Foto von ${vehicle.license_plate}`}
  width={400}
  height={300}
  className="rounded-lg"
/>

// ❌ FALSCH
<img src={vehicle.image_url} />
```

### 10.3 Query Stale Time – SINNVOLL SETZEN

```typescript
// Daten die sich selten ändern
useQuery({
  queryKey: ['companies'],
  queryFn: fetchCompanies,
  staleTime: 30 * 60 * 1000,  // 30 Minuten
});

// Daten die sich oft ändern
useQuery({
  queryKey: ['damages'],
  queryFn: fetchDamages,
  staleTime: 2 * 60 * 1000,  // 2 Minuten
});
```

---

## 11. TESTING

### 11.1 E2E Tests – PLAYWRIGHT

```typescript
// ✅ RICHTIG: Deutsche Test-Beschreibungen
import { test, expect } from '@playwright/test';

test.describe('Fahrzeugverwaltung', () => {
  test('sollte ein neues Fahrzeug anlegen können', async ({ page }) => {
    await page.goto('/vehicles/new');
    
    await page.fill('[name="license_plate"]', 'HH-TE 1234');
    await page.fill('[name="brand"]', 'Mercedes');
    await page.fill('[name="model"]', 'Sprinter');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Fahrzeug erfolgreich gespeichert')).toBeVisible();
  });
});
```

### 11.2 Test-Selektoren – DATA-TESTID VERWENDEN

```typescript
// Komponente
<Button data-testid="submit-vehicle-form">Speichern</Button>

// Test
await page.click('[data-testid="submit-vehicle-form"]');
```

---

## 12. DOKUMENTATION

### 12.1 Komponenten-Dokumentation

```typescript
/**
 * Zeigt eine Karte mit Fahrzeug-Informationen an.
 * 
 * @example
 * ```tsx
 * <VehicleCard 
 *   vehicle={vehicle} 
 *   onEdit={(id) => router.push(`/vehicles/${id}/edit`)}
 * />
 * ```
 */
interface VehicleCardProps {
  /** Das anzuzeigende Fahrzeug */
  vehicle: Vehicle;
  /** Callback wenn "Bearbeiten" geklickt wird */
  onEdit?: (id: string) => void;
  /** Callback wenn "Löschen" geklickt wird */
  onDelete?: (id: string) => void;
}

export function VehicleCard({ vehicle, onEdit, onDelete }: VehicleCardProps): JSX.Element {
  // ...
}
```

### 12.2 Komplexe Logik – IMMER KOMMENTIEREN

```typescript
// ✅ RICHTIG
/**
 * Berechnet den Status eines Termins basierend auf dem Fälligkeitsdatum.
 * 
 * - überfällig: Fälligkeitsdatum liegt in der Vergangenheit
 * - dringend: Fälligkeitsdatum innerhalb der nächsten 14 Tage
 * - bald: Fälligkeitsdatum innerhalb der nächsten 30 Tage
 * - geplant: Fälligkeitsdatum liegt weiter in der Zukunft
 */
function calculateAppointmentStatus(dueDate: Date): AppointmentStatus {
  const today = new Date();
  const daysUntilDue = differenceInDays(dueDate, today);
  
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 14) return 'urgent';
  if (daysUntilDue <= 30) return 'soon';
  return 'scheduled';
}
```

---

## 13. GIT & COMMITS

### 13.1 Commit Messages – DEUTSCHE KONVENTION

```
feat: Fahrzeugformular mit Validierung hinzugefügt
fix: Fehler beim Speichern von Schäden behoben
refactor: Komponente VehicleTable vereinfacht
docs: README aktualisiert
style: Formatierung korrigiert
test: E2E-Test für Login hinzugefügt
chore: Abhängigkeiten aktualisiert
```

### 13.2 Branch-Namen

```
feature/fahrzeug-formular
fix/schaden-speichern
refactor/vehicle-table
```

---

## 14. VERBOTENE PRAKTIKEN

### 14.1 NIEMALS ERLAUBT

| Verboten | Warum |
|----------|-------|
| `any` Type | Keine Type-Safety |
| Inline Styles | Nicht wartbar |
| CSS Modules | Tailwind ist Standard |
| Class Components | Veraltet |
| `var` Keyword | `const` oder `let` nutzen |
| `==` Vergleich | `===` nutzen |
| `console.log` in Production | Nur `console.error` für echte Fehler |
| Hardcoded Strings in UI | Konstanten verwenden |
| Englische UI-Texte | Nur Deutsch |
| Fetch ohne Error Handling | Immer try/catch oder .catch() |
| Leere catch-Blöcke | Fehler mindestens loggen |
| Magic Numbers | Konstanten mit Namen |
| Komponenten >300 Zeilen | Aufteilen |
| Direkte DOM-Manipulation | React State nutzen |
| LocalStorage für sensible Daten | Nur für Auto-Save |

### 14.2 CODE REVIEW CHECKLIST

Vor jedem Commit prüfen:

- [ ] Alle UI-Texte auf Deutsch
- [ ] Keine `any` Types
- [ ] Alle Funktionen haben Return Types
- [ ] Error Handling vorhanden
- [ ] Loading States implementiert
- [ ] Empty States implementiert
- [ ] Formular hat Auto-Save
- [ ] Validierung mit Zod
- [ ] Deutsche Fehlermeldungen
- [ ] Keine console.log (außer Fehler)
- [ ] Komponente <300 Zeilen
- [ ] Imports sortiert
- [ ] TypeScript Errors = 0

---

## 15. CHECKLISTE FÜR NEUE FEATURES

Bevor ein Feature als "fertig" gilt:

### 15.1 Funktionalität
- [ ] Feature funktioniert wie im PRD beschrieben
- [ ] Alle Edge Cases behandelt
- [ ] Validierung funktioniert
- [ ] Daten werden korrekt gespeichert

### 15.2 UI/UX
- [ ] Alle Texte auf Deutsch
- [ ] Loading State vorhanden
- [ ] Error State vorhanden
- [ ] Empty State vorhanden
- [ ] Responsive (mindestens Desktop)
- [ ] Feedback bei Aktionen (Toast)

### 15.3 Code-Qualität
- [ ] TypeScript ohne Errors
- [ ] Keine `any` Types
- [ ] Komponente <300 Zeilen
- [ ] Dokumentation/Kommentare
- [ ] Konsistente Namensgebung

### 15.4 Sicherheit
- [ ] Input validiert
- [ ] Keine Secrets im Code
- [ ] Dateien geprüft (Typ, Größe)

---

**DIESE REGELN SIND NICHT VERHANDELBAR.**

Bei Fragen oder Unklarheiten: **FRAGE NACH** statt zu raten.
