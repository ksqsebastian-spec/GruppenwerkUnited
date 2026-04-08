# CODE-HANDBUCH – Fuhrpark Management App

**Version:** 1.0  
**Zweck:** Nachschlagewerk für alle Code-Patterns, Komponenten und Implementierungen

---

## Inhaltsverzeichnis

1. [Projekt-Setup](#1-projekt-setup)
2. [Supabase Konfiguration](#2-supabase-konfiguration)
3. [Authentifizierung](#3-authentifizierung)
4. [Datenbank-Operationen](#4-datenbank-operationen)
5. [Custom Hooks](#5-custom-hooks)
6. [Komponenten-Bibliothek](#6-komponenten-bibliothek)
7. [Formulare](#7-formulare)
8. [Validierungs-Schemas](#8-validierungs-schemas)
9. [Datei-Upload](#9-datei-upload)
10. [Error Handling](#10-error-handling)
11. [Konstanten & Typen](#11-konstanten--typen)
12. [Utility Funktionen](#12-utility-funktionen)
13. [API Routes](#13-api-routes)
14. [Webhooks & Events](#14-webhooks--events)
15. [Seiten-Templates](#15-seiten-templates)

---

## 1. Projekt-Setup

### 1.1 Neue Next.js App erstellen

```bash
npx create-next-app@latest fuhrpark-app --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

### 1.2 Abhängigkeiten installieren

```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# UI
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
npm install sonner

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Data Fetching
npm install @tanstack/react-query

# Date Handling
npm install date-fns react-day-picker

# Tables
npm install @tanstack/react-table
```

### 1.3 shadcn/ui initialisieren

```bash
npx shadcn@latest init
```

Konfiguration wählen:
- Style: Default
- Base color: Slate
- CSS variables: Yes

### 1.4 shadcn Komponenten hinzufügen

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add form
npx shadcn@latest add select
npx shadcn@latest add textarea
npx shadcn@latest add checkbox
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add table
npx shadcn@latest add calendar
npx shadcn@latest add popover
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add alert
npx shadcn@latest add tabs
npx shadcn@latest add separator
npx shadcn@latest add skeleton
npx shadcn@latest add avatar
npx shadcn@latest add tooltip
```

### 1.5 Umgebungsvariablen

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Webhooks
N8N_WEBHOOK_URL=https://your-n8n.example.de/webhook
N8N_WEBHOOK_SECRET=your-secret-token

# Cron
CRON_SECRET=your-cron-secret
```

### 1.6 TypeScript Konfiguration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 1.7 Tailwind Konfiguration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... weitere Farben (shadcn generiert diese)
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

## 2. Supabase Konfiguration

### 2.1 Browser Client

```typescript
// /lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton für Client-Komponenten
export const supabase = createClient();
```

### 2.2 Server Client

```typescript
// /lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Wird in Server Components ignoriert
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Wird in Server Components ignoriert
          }
        },
      },
    }
  );
}
```

### 2.3 Middleware Client

```typescript
// /lib/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Session auffrischen
  await supabase.auth.getUser();

  return response;
}
```

### 2.4 Hauptmiddleware

```typescript
// /middleware.ts
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### 2.5 Datenbank-Typen generieren

```bash
# Supabase CLI installieren
npm install supabase --save-dev

# Typen generieren
npx supabase gen types typescript --project-id your-project-id > lib/supabase/types.ts
```

---

## 3. Authentifizierung

### 3.1 Auth Provider

```typescript
// /components/providers/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initiale Session laden
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Auf Auth-Änderungen hören
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw new Error('Anmeldung fehlgeschlagen. Bitte prüfe E-Mail und Passwort.');
    }
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error('Abmelden fehlgeschlagen.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth muss innerhalb eines AuthProviders verwendet werden');
  }
  return context;
}
```

### 3.2 Login-Seite

```typescript
// /app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/components/providers/auth-provider';

const loginSchema = z.object({
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein'),
  password: z.string().min(1, 'Passwort ist erforderlich'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      toast.success('Erfolgreich angemeldet');
      router.push('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Anmeldung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Fuhrpark Management</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@firma.de"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Anmelden...
                </>
              ) : (
                'Anmelden'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3.3 Auth Guard (Protected Routes)

```typescript
// /components/auth/auth-guard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps): JSX.Element {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Wird geladen..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Weiterleitung zur Anmeldung..." />
      </div>
    );
  }

  return <>{children}</>;
}
```

---

## 4. Datenbank-Operationen

### 4.1 Fahrzeuge

```typescript
// /lib/database/vehicles.ts
import { supabase } from '@/lib/supabase/client';
import type { Vehicle, VehicleInsert, VehicleUpdate } from '@/types';

// Alle Fahrzeuge laden
export async function fetchVehicles(filters?: {
  companyId?: string;
  status?: 'active' | 'archived';
}): Promise<Vehicle[]> {
  let query = supabase
    .from('vehicles')
    .select(`
      *,
      company:companies(id, name),
      appointments(
        id,
        due_date,
        status,
        appointment_type:appointment_types(name, color)
      )
    `)
    .order('license_plate');

  if (filters?.companyId) {
    query = query.eq('company_id', filters.companyId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Fahrzeuge:', error);
    throw new Error('Fahrzeuge konnten nicht geladen werden');
  }

  return data ?? [];
}

// Einzelnes Fahrzeug laden
export async function fetchVehicle(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      company:companies(id, name),
      appointments(*),
      damages(*),
      documents(*),
      costs(*),
      vehicle_drivers(
        driver:drivers(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Nicht gefunden
    }
    console.error('Fehler beim Laden des Fahrzeugs:', error);
    throw new Error('Fahrzeug konnte nicht geladen werden');
  }

  return data;
}

// Fahrzeug erstellen
export async function createVehicle(vehicle: VehicleInsert): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicle)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ein Fahrzeug mit diesem Kennzeichen existiert bereits');
    }
    console.error('Fehler beim Erstellen des Fahrzeugs:', error);
    throw new Error('Fahrzeug konnte nicht angelegt werden');
  }

  return data;
}

// Fahrzeug aktualisieren
export async function updateVehicle(
  id: string,
  updates: VehicleUpdate
): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('vehicles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Aktualisieren des Fahrzeugs:', error);
    throw new Error('Fahrzeug konnte nicht aktualisiert werden');
  }

  return data;
}

// Fahrzeug archivieren (nicht löschen!)
export async function archiveVehicle(id: string): Promise<void> {
  const { error } = await supabase
    .from('vehicles')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Archivieren des Fahrzeugs:', error);
    throw new Error('Fahrzeug konnte nicht archiviert werden');
  }
}
```

### 4.2 Schäden

```typescript
// /lib/database/damages.ts
import { supabase } from '@/lib/supabase/client';
import type { Damage, DamageInsert, DamageUpdate } from '@/types';

// Alle Schäden laden
export async function fetchDamages(filters?: {
  vehicleId?: string;
  status?: string;
}): Promise<Damage[]> {
  let query = supabase
    .from('damages')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model),
      damage_type:damage_types(id, name),
      damage_images(id, file_path, uploaded_at)
    `)
    .order('date', { ascending: false });

  if (filters?.vehicleId) {
    query = query.eq('vehicle_id', filters.vehicleId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Schäden:', error);
    throw new Error('Schäden konnten nicht geladen werden');
  }

  return data ?? [];
}

// Schaden erstellen
export async function createDamage(damage: DamageInsert): Promise<Damage> {
  const { data, error } = await supabase
    .from('damages')
    .insert(damage)
    .select()
    .single();

  if (error) {
    console.error('Fehler beim Erstellen des Schadens:', error);
    throw new Error('Schaden konnte nicht gemeldet werden');
  }

  return data;
}

// Schadensstatus aktualisieren
export async function updateDamageStatus(
  id: string,
  status: 'reported' | 'approved' | 'in_repair' | 'completed'
): Promise<void> {
  const { error } = await supabase
    .from('damages')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Aktualisieren des Schadensstatus:', error);
    throw new Error('Status konnte nicht aktualisiert werden');
  }
}
```

### 4.3 Termine

```typescript
// /lib/database/appointments.ts
import { supabase } from '@/lib/supabase/client';
import type { Appointment, AppointmentInsert } from '@/types';

// Alle Termine laden
export async function fetchAppointments(filters?: {
  vehicleId?: string;
  status?: string;
  dueBefore?: Date;
  dueAfter?: Date;
}): Promise<Appointment[]> {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model),
      appointment_type:appointment_types(id, name, color)
    `)
    .order('due_date');

  if (filters?.vehicleId) {
    query = query.eq('vehicle_id', filters.vehicleId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.dueBefore) {
    query = query.lte('due_date', filters.dueBefore.toISOString());
  }

  if (filters?.dueAfter) {
    query = query.gte('due_date', filters.dueAfter.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Laden der Termine:', error);
    throw new Error('Termine konnten nicht geladen werden');
  }

  return data ?? [];
}

// Überfällige und bald fällige Termine laden (für Dashboard)
export async function fetchUpcomingAppointments(): Promise<{
  overdue: Appointment[];
  urgent: Appointment[];
  upcoming: Appointment[];
}> {
  const today = new Date();
  const in14Days = new Date(today);
  in14Days.setDate(today.getDate() + 14);
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model),
      appointment_type:appointment_types(id, name, color)
    `)
    .neq('status', 'completed')
    .lte('due_date', in30Days.toISOString())
    .order('due_date');

  if (error) {
    console.error('Fehler beim Laden der Termine:', error);
    throw new Error('Termine konnten nicht geladen werden');
  }

  const appointments = data ?? [];
  
  return {
    overdue: appointments.filter(a => new Date(a.due_date) < today),
    urgent: appointments.filter(a => {
      const dueDate = new Date(a.due_date);
      return dueDate >= today && dueDate <= in14Days;
    }),
    upcoming: appointments.filter(a => {
      const dueDate = new Date(a.due_date);
      return dueDate > in14Days && dueDate <= in30Days;
    }),
  };
}

// Termin als erledigt markieren
export async function completeAppointment(id: string): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Abschließen des Termins:', error);
    throw new Error('Termin konnte nicht als erledigt markiert werden');
  }
}
```

---

## 5. Custom Hooks

### 5.1 useVehicles

```typescript
// /hooks/use-vehicles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchVehicles,
  fetchVehicle,
  createVehicle,
  updateVehicle,
  archiveVehicle,
} from '@/lib/database/vehicles';
import type { VehicleInsert, VehicleUpdate } from '@/types';
import { toast } from 'sonner';

interface UseVehiclesOptions {
  companyId?: string;
  status?: 'active' | 'archived';
}

// Alle Fahrzeuge
export function useVehicles(options?: UseVehiclesOptions) {
  return useQuery({
    queryKey: ['vehicles', options],
    queryFn: () => fetchVehicles(options),
    staleTime: 5 * 60 * 1000, // 5 Minuten
  });
}

// Einzelnes Fahrzeug
export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => fetchVehicle(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Fahrzeug erstellen
export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VehicleInsert) => createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Fahrzeug erfolgreich angelegt');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Fahrzeug aktualisieren
export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VehicleUpdate }) =>
      updateVehicle(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.id] });
      toast.success('Fahrzeug erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Fahrzeug archivieren
export function useArchiveVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Fahrzeug erfolgreich archiviert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
```

### 5.2 useAutoSave

```typescript
// /hooks/use-auto-save.ts
import { useEffect, useRef } from 'react';

interface UseAutoSaveOptions<T> {
  /** Eindeutiger Schlüssel für LocalStorage */
  key: string;
  /** Aktuelle Formulardaten */
  data: T;
  /** Callback wenn gespeicherte Daten wiederhergestellt werden */
  onRestore?: (data: T) => void;
  /** Intervall in Millisekunden (Standard: 10000 = 10 Sekunden) */
  interval?: number;
}

export function useAutoSave<T>({
  key,
  data,
  onRestore,
  interval = 10000,
}: UseAutoSaveOptions<T>): void {
  const storageKey = `autosave_${key}`;
  const hasRestored = useRef(false);

  // Beim ersten Laden: Gespeicherte Daten wiederherstellen
  useEffect(() => {
    if (hasRestored.current) return;
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && onRestore) {
        const parsed = JSON.parse(saved) as T;
        onRestore(parsed);
        // Hinweis anzeigen
        console.info('Formulardaten wurden wiederhergestellt');
      }
    } catch (error) {
      console.error('Fehler beim Wiederherstellen der Formulardaten:', error);
    }
    
    hasRestored.current = true;
  }, [storageKey, onRestore]);

  // Periodisch speichern
  useEffect(() => {
    const save = (): void => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        console.error('Fehler beim Auto-Speichern:', error);
      }
    };

    const intervalId = setInterval(save, interval);
    
    // Auch beim Unmount speichern
    return () => {
      clearInterval(intervalId);
      save();
    };
  }, [storageKey, data, interval]);
}

// Gespeicherte Daten löschen (nach erfolgreichem Submit)
export function clearAutoSave(key: string): void {
  try {
    localStorage.removeItem(`autosave_${key}`);
  } catch (error) {
    console.error('Fehler beim Löschen der Auto-Save Daten:', error);
  }
}
```

### 5.3 useDebounce

```typescript
// /hooks/use-debounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 6. Komponenten-Bibliothek

### 6.1 LoadingSpinner

```typescript
// /components/shared/loading-spinner.tsx
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  /** Optionaler Text unter dem Spinner */
  text?: string;
  /** Größe des Spinners */
  size?: 'sm' | 'md' | 'lg';
  /** Zusätzliche CSS-Klassen */
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function LoadingSpinner({
  text,
  size = 'md',
  className,
}: LoadingSpinnerProps): JSX.Element {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
```

### 6.2 EmptyState

```typescript
// /components/shared/empty-state.tsx
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Icon-Komponente */
  icon?: React.ReactNode;
  /** Titel */
  title: string;
  /** Beschreibung */
  description?: string;
  /** Aktions-Button */
  action?: React.ReactNode;
  /** Zusätzliche CSS-Klassen */
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps): JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

### 6.3 StatusBadge

```typescript
// /components/shared/status-badge.tsx
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusVariant = 
  | 'active' 
  | 'archived' 
  | 'pending' 
  | 'completed' 
  | 'overdue'
  | 'reported'
  | 'approved'
  | 'in_repair';

interface StatusBadgeProps {
  status: StatusVariant;
  className?: string;
}

const statusConfig: Record<StatusVariant, { label: string; className: string }> = {
  active: {
    label: 'Aktiv',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
  archived: {
    label: 'Archiviert',
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  },
  pending: {
    label: 'Ausstehend',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  },
  completed: {
    label: 'Erledigt',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
  overdue: {
    label: 'Überfällig',
    className: 'bg-red-100 text-red-800 hover:bg-red-100',
  },
  reported: {
    label: 'Gemeldet',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  },
  approved: {
    label: 'Freigegeben',
    className: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  },
  in_repair: {
    label: 'In Reparatur',
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps): JSX.Element {
  const config = statusConfig[status];
  
  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
```

### 6.4 ConfirmDialog

```typescript
// /components/shared/confirm-dialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  /** Ist der Dialog geöffnet? */
  open: boolean;
  /** Callback zum Schließen */
  onOpenChange: (open: boolean) => void;
  /** Titel */
  title: string;
  /** Beschreibung */
  description: string;
  /** Text für Abbrechen-Button */
  cancelText?: string;
  /** Text für Bestätigen-Button */
  confirmText?: string;
  /** Callback bei Bestätigung */
  onConfirm: () => void;
  /** Ist die Aktion destruktiv? (roter Button) */
  destructive?: boolean;
  /** Wird gerade geladen? */
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelText = 'Abbrechen',
  confirmText = 'Bestätigen',
  onConfirm,
  destructive = false,
  isLoading = false,
}: ConfirmDialogProps): JSX.Element {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={destructive ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {isLoading ? 'Bitte warten...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### 6.5 PageHeader

```typescript
// /components/layout/page-header.tsx
interface PageHeaderProps {
  /** Seitentitel */
  title: string;
  /** Optionale Beschreibung */
  description?: string;
  /** Aktionen (Buttons) auf der rechten Seite */
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
```

---

## 7. Formulare

### 7.1 Fahrzeug-Formular

```typescript
// /components/vehicles/vehicle-form.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { vehicleSchema, type VehicleFormData } from '@/lib/validations/vehicle';
import { useAutoSave, clearAutoSave } from '@/hooks/use-auto-save';
import { useCompanies } from '@/hooks/use-companies';
import { FUEL_TYPES } from '@/lib/constants';
import type { Vehicle } from '@/types';

interface VehicleFormProps {
  /** Bestehendes Fahrzeug (für Bearbeitung) */
  vehicle?: Vehicle;
  /** Callback bei Submit */
  onSubmit: (data: VehicleFormData) => Promise<void>;
  /** Wird gerade gespeichert? */
  isSubmitting?: boolean;
}

export function VehicleForm({
  vehicle,
  onSubmit,
  isSubmitting = false,
}: VehicleFormProps): JSX.Element {
  const router = useRouter();
  const { data: companies = [] } = useCompanies();
  
  const isEditing = !!vehicle;
  const autoSaveKey = isEditing ? `vehicle-edit-${vehicle.id}` : 'vehicle-new';

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      license_plate: vehicle?.license_plate ?? '',
      brand: vehicle?.brand ?? '',
      model: vehicle?.model ?? '',
      year: vehicle?.year ?? new Date().getFullYear(),
      vin: vehicle?.vin ?? '',
      fuel_type: vehicle?.fuel_type ?? 'diesel',
      purchase_date: vehicle?.purchase_date ?? '',
      purchase_price: vehicle?.purchase_price ?? undefined,
      mileage: vehicle?.mileage ?? 0,
      is_leased: vehicle?.is_leased ?? false,
      insurance_number: vehicle?.insurance_number ?? '',
      insurance_company: vehicle?.insurance_company ?? '',
      tuv_due_date: vehicle?.tuv_due_date ?? '',
      company_id: vehicle?.company_id ?? '',
      status: vehicle?.status ?? 'active',
      notes: vehicle?.notes ?? '',
    },
  });

  // Auto-Save aktivieren
  useAutoSave({
    key: autoSaveKey,
    data: form.watch(),
    onRestore: (data) => {
      if (!isEditing) {
        form.reset(data);
      }
    },
  });

  const handleSubmit = async (data: VehicleFormData): Promise<void> => {
    await onSubmit(data);
    clearAutoSave(autoSaveKey);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Grunddaten */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="license_plate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kennzeichen *</FormLabel>
                <FormControl>
                  <Input placeholder="HH-AB 1234" {...field} />
                </FormControl>
                <FormDescription>
                  Format: Stadt-Buchstaben Zahlen (z.B. HH-AB 1234)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firma *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Firma auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marke *</FormLabel>
                <FormControl>
                  <Input placeholder="Mercedes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modell *</FormLabel>
                <FormControl>
                  <Input placeholder="Sprinter 316 CDI" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Baujahr *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1990}
                    max={new Date().getFullYear()}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fuel_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kraftstoffart *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FUEL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kilometerstand *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fahrgestellnummer (VIN)</FormLabel>
                <FormControl>
                  <Input placeholder="WDB9066351S123456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Finanzdaten */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="purchase_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anschaffungsdatum</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchase_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anschaffungspreis (€)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="45000.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_leased"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Leasingfahrzeug</FormLabel>
                  <FormDescription>
                    Dieses Fahrzeug ist geleast
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Versicherung & TÜV */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="insurance_company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Versicherungsgesellschaft</FormLabel>
                <FormControl>
                  <Input placeholder="Allianz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="insurance_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Versicherungsnummer</FormLabel>
                <FormControl>
                  <Input placeholder="VS-123456789" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tuv_due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TÜV fällig am</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="archived">Archiviert</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notizen */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notizen</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Zusätzliche Informationen zum Fahrzeug..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird gespeichert...
              </>
            ) : isEditing ? (
              'Änderungen speichern'
            ) : (
              'Fahrzeug anlegen'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## 8. Validierungs-Schemas

### 8.1 Fahrzeug

```typescript
// /lib/validations/vehicle.ts
import { z } from 'zod';

export const vehicleSchema = z.object({
  license_plate: z
    .string()
    .min(1, 'Kennzeichen ist erforderlich')
    .regex(
      /^[A-ZÄÖÜ]{1,3}-[A-ZÄÖÜ]{1,2}\s?\d{1,4}[A-Z]?$/i,
      'Ungültiges Kennzeichen-Format (z.B. HH-AB 1234)'
    ),
  
  brand: z
    .string()
    .min(2, 'Marke muss mindestens 2 Zeichen haben'),
  
  model: z
    .string()
    .min(2, 'Modell muss mindestens 2 Zeichen haben'),
  
  year: z
    .number()
    .min(1990, 'Baujahr muss nach 1990 sein')
    .max(new Date().getFullYear() + 1, 'Baujahr darf nicht in der Zukunft liegen'),
  
  vin: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 17,
      'Fahrgestellnummer muss genau 17 Zeichen haben'
    ),
  
  fuel_type: z.enum(['diesel', 'benzin', 'elektro', 'hybrid_benzin', 'hybrid_diesel', 'gas'], {
    errorMap: () => ({ message: 'Bitte Kraftstoffart auswählen' }),
  }),
  
  purchase_date: z.string().optional(),
  
  purchase_price: z
    .number()
    .positive('Preis muss größer als 0 sein')
    .optional(),
  
  mileage: z
    .number()
    .min(0, 'Kilometerstand kann nicht negativ sein'),
  
  is_leased: z.boolean().optional().default(false),
  
  insurance_number: z.string().optional(),
  
  insurance_company: z.string().optional(),
  
  tuv_due_date: z.string().optional(),
  
  company_id: z
    .string()
    .min(1, 'Bitte Firma auswählen'),
  
  status: z.enum(['active', 'archived']).default('active'),
  
  notes: z
    .string()
    .max(2000, 'Notizen dürfen maximal 2000 Zeichen haben')
    .optional(),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
```

### 8.2 Schaden

```typescript
// /lib/validations/damage.ts
import { z } from 'zod';

export const damageSchema = z.object({
  vehicle_id: z
    .string()
    .min(1, 'Bitte Fahrzeug auswählen'),
  
  damage_type_id: z
    .string()
    .min(1, 'Bitte Schadensart auswählen'),
  
  date: z
    .string()
    .min(1, 'Schadensdatum ist erforderlich'),
  
  description: z
    .string()
    .min(10, 'Beschreibung muss mindestens 10 Zeichen haben')
    .max(2000, 'Beschreibung darf maximal 2000 Zeichen haben'),
  
  location: z
    .string()
    .max(255, 'Ort darf maximal 255 Zeichen haben')
    .optional(),
  
  cost_estimate: z
    .number()
    .min(0, 'Kosten können nicht negativ sein')
    .optional(),
  
  actual_cost: z
    .number()
    .min(0, 'Kosten können nicht negativ sein')
    .optional(),
  
  insurance_claim: z.boolean().default(false),
  
  insurance_claim_number: z
    .string()
    .max(100, 'Schadensnummer darf maximal 100 Zeichen haben')
    .optional(),
  
  reported_by: z
    .string()
    .min(2, 'Name muss mindestens 2 Zeichen haben'),
  
  notes: z
    .string()
    .max(2000, 'Notizen dürfen maximal 2000 Zeichen haben')
    .optional(),
});

export type DamageFormData = z.infer<typeof damageSchema>;
```

### 8.3 Datei-Upload

```typescript
// /lib/validations/file-upload.ts
import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const fileUploadSchema = z.object({
  file: z
    .instanceof(File, { message: 'Bitte Datei auswählen' })
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      'Die Datei ist zu groß. Maximal 10 MB erlaubt.'
    )
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      'Ungültiges Dateiformat. Erlaubt: PDF, JPG, PNG, WEBP.'
    )
    .refine(
      (file) => !file.name.includes('..'),
      'Ungültiger Dateiname.'
    ),
});

export const multiFileUploadSchema = z.object({
  files: z
    .array(fileUploadSchema.shape.file)
    .min(1, 'Mindestens eine Datei erforderlich')
    .max(10, 'Maximal 10 Dateien erlaubt'),
});

export type FileUploadData = z.infer<typeof fileUploadSchema>;
export type MultiFileUploadData = z.infer<typeof multiFileUploadSchema>;
```

---

## 9. Datei-Upload

### 9.1 Upload-Komponente

```typescript
// /components/shared/file-upload.tsx
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  /** Akzeptierte Dateitypen */
  accept?: Record<string, string[]>;
  /** Maximale Dateigröße in Bytes */
  maxSize?: number;
  /** Mehrere Dateien erlaubt? */
  multiple?: boolean;
  /** Callback bei Dateiauswahl */
  onFilesSelected: (files: File[]) => void;
  /** Ausgewählte Dateien */
  selectedFiles?: File[];
  /** Callback zum Entfernen einer Datei */
  onRemoveFile?: (index: number) => void;
  /** Ist deaktiviert? */
  disabled?: boolean;
}

export function FileUpload({
  accept = {
    'application/pdf': ['.pdf'],
    'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
  },
  maxSize = 10 * 1024 * 1024, // 10 MB
  multiple = false,
  onFilesSelected,
  selectedFiles = [],
  onRemoveFile,
  disabled = false,
}: FileUploadProps): JSX.Element {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError('Die Datei ist zu groß. Maximal 10 MB erlaubt.');
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('Ungültiges Dateiformat. Erlaubt: PDF, JPG, PNG, WEBP.');
        } else {
          setError('Datei konnte nicht hochgeladen werden.');
        }
        return;
      }

      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled,
  });

  const getFileIcon = (file: File): JSX.Element => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-sm text-primary">Datei hier ablegen...</p>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground">
              Datei hierher ziehen oder{' '}
              <span className="text-primary font-medium">durchsuchen</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, JPG, PNG, WEBP (max. 10 MB)
            </p>
          </div>
        )}
      </div>

      {/* Fehlermeldung */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Ausgewählte Dateien */}
      {selectedFiles.length > 0 && (
        <ul className="space-y-2">
          {selectedFiles.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getFileIcon(file)}
                <div>
                  <p className="text-sm font-medium truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              {onRemoveFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### 9.2 Upload zu Supabase Storage

```typescript
// /lib/storage/upload.ts
import { supabase } from '@/lib/supabase/client';

interface UploadResult {
  path: string;
  url: string;
}

/**
 * Lädt eine Datei zu Supabase Storage hoch
 */
export async function uploadFile(
  file: File,
  bucket: string,
  folder: string
): Promise<UploadResult> {
  // Eindeutigen Dateinamen generieren
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `${folder}/${timestamp}_${sanitizedName}`;

  // Upload durchführen
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Fehler beim Hochladen:', error);
    throw new Error('Datei konnte nicht hochgeladen werden');
  }

  // Öffentliche URL generieren
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    url: urlData.publicUrl,
  };
}

/**
 * Löscht eine Datei aus Supabase Storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('Fehler beim Löschen:', error);
    throw new Error('Datei konnte nicht gelöscht werden');
  }
}

/**
 * Lädt mehrere Dateien hoch
 */
export async function uploadMultipleFiles(
  files: File[],
  bucket: string,
  folder: string
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const file of files) {
    const result = await uploadFile(file, bucket, folder);
    results.push(result);
  }

  return results;
}
```

---

## 10. Error Handling

### 10.1 Fehlermeldungen

```typescript
// /lib/errors/messages.ts
export const ERROR_MESSAGES = {
  // Allgemein
  UNKNOWN: 'Ein unbekannter Fehler ist aufgetreten. Bitte versuche es erneut.',
  NETWORK: 'Keine Internetverbindung. Bitte prüfe dein Netzwerk.',
  UNAUTHORIZED: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
  FORBIDDEN: 'Du hast keine Berechtigung für diese Aktion.',
  NOT_FOUND: 'Die angeforderte Ressource wurde nicht gefunden.',
  
  // Fahrzeuge
  VEHICLE_NOT_FOUND: 'Fahrzeug nicht gefunden.',
  VEHICLE_CREATE_FAILED: 'Fahrzeug konnte nicht angelegt werden.',
  VEHICLE_UPDATE_FAILED: 'Fahrzeug konnte nicht aktualisiert werden.',
  VEHICLE_DELETE_FAILED: 'Fahrzeug konnte nicht gelöscht werden.',
  VEHICLE_DUPLICATE_PLATE: 'Ein Fahrzeug mit diesem Kennzeichen existiert bereits.',
  
  // Fahrer
  DRIVER_NOT_FOUND: 'Fahrer nicht gefunden.',
  DRIVER_CREATE_FAILED: 'Fahrer konnte nicht angelegt werden.',
  DRIVER_UPDATE_FAILED: 'Fahrer konnte nicht aktualisiert werden.',
  
  // Schäden
  DAMAGE_NOT_FOUND: 'Schaden nicht gefunden.',
  DAMAGE_CREATE_FAILED: 'Schaden konnte nicht gemeldet werden.',
  DAMAGE_UPDATE_FAILED: 'Schaden konnte nicht aktualisiert werden.',
  
  // Termine
  APPOINTMENT_NOT_FOUND: 'Termin nicht gefunden.',
  APPOINTMENT_CREATE_FAILED: 'Termin konnte nicht erstellt werden.',
  APPOINTMENT_UPDATE_FAILED: 'Termin konnte nicht aktualisiert werden.',
  
  // Kosten
  COST_CREATE_FAILED: 'Kosten konnten nicht erfasst werden.',
  
  // Dokumente
  DOCUMENT_NOT_FOUND: 'Dokument nicht gefunden.',
  DOCUMENT_UPLOAD_FAILED: 'Dokument konnte nicht hochgeladen werden.',
  DOCUMENT_DELETE_FAILED: 'Dokument konnte nicht gelöscht werden.',
  
  // Uploads
  FILE_TOO_LARGE: 'Die Datei ist zu groß. Maximal 10 MB erlaubt.',
  FILE_INVALID_TYPE: 'Ungültiges Dateiformat. Erlaubt: PDF, JPG, PNG, WEBP.',
  UPLOAD_FAILED: 'Datei konnte nicht hochgeladen werden.',
  
  // Validierung
  VALIDATION_FAILED: 'Bitte überprüfe deine Eingaben.',
  REQUIRED_FIELD: 'Dieses Feld ist erforderlich.',
  INVALID_EMAIL: 'Bitte gib eine gültige E-Mail-Adresse ein.',
  INVALID_DATE: 'Bitte gib ein gültiges Datum ein.',
  INVALID_NUMBER: 'Bitte gib eine gültige Zahl ein.',
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
```

### 10.2 Error Handler

```typescript
// /lib/errors/handler.ts
import { ERROR_MESSAGES, type ErrorMessageKey } from './messages';

/**
 * Wandelt einen Fehler in eine benutzerfreundliche Nachricht um
 */
export function getErrorMessage(error: unknown): string {
  // Bekannter Error-Key
  if (typeof error === 'string' && error in ERROR_MESSAGES) {
    return ERROR_MESSAGES[error as ErrorMessageKey];
  }
  
  // Error-Objekt mit message
  if (error instanceof Error) {
    // Supabase-Fehler
    if ('code' in error) {
      const code = (error as any).code;
      
      // Bekannte Supabase-Fehlercodes
      switch (code) {
        case '23505':
          return 'Ein Eintrag mit diesen Daten existiert bereits.';
        case '23503':
          return 'Die verknüpften Daten existieren nicht mehr.';
        case 'PGRST116':
          return 'Eintrag nicht gefunden.';
        default:
          break;
      }
    }
    
    return error.message;
  }
  
  return ERROR_MESSAGES.UNKNOWN;
}

/**
 * Loggt einen Fehler mit Kontext
 */
export function logError(
  context: string,
  error: unknown,
  additionalData?: Record<string, unknown>
): void {
  console.error(`[${context}]`, {
    error,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...additionalData,
  });
}
```

---

## 11. Konstanten & Typen

### 11.1 Konstanten

```typescript
// /lib/constants.ts

// Kraftstoffarten
export const FUEL_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'benzin', label: 'Benzin' },
  { value: 'elektro', label: 'Elektro' },
  { value: 'hybrid_benzin', label: 'Hybrid (Benzin)' },
  { value: 'hybrid_diesel', label: 'Hybrid (Diesel)' },
  { value: 'gas', label: 'Gas (LPG/CNG)' },
] as const;

// Fahrzeugstatus
export const VEHICLE_STATUS = [
  { value: 'active', label: 'Aktiv' },
  { value: 'archived', label: 'Archiviert' },
] as const;

// Schadensstatus
export const DAMAGE_STATUS = [
  { value: 'reported', label: 'Gemeldet' },
  { value: 'approved', label: 'Freigegeben' },
  { value: 'in_repair', label: 'In Reparatur' },
  { value: 'completed', label: 'Abgeschlossen' },
] as const;

// Terminstatus
export const APPOINTMENT_STATUS = [
  { value: 'pending', label: 'Ausstehend' },
  { value: 'completed', label: 'Erledigt' },
  { value: 'overdue', label: 'Überfällig' },
] as const;

// Dateilimits
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10 MB
  ACCEPTED_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  ACCEPTED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
} as const;

// Query Stale Times
export const STALE_TIMES = {
  COMPANIES: 30 * 60 * 1000, // 30 Minuten
  VEHICLES: 5 * 60 * 1000,   // 5 Minuten
  APPOINTMENTS: 2 * 60 * 1000, // 2 Minuten
  DAMAGES: 2 * 60 * 1000,    // 2 Minuten
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;
```

### 11.2 App-Typen

```typescript
// /types/index.ts
import type { Database } from '@/lib/supabase/types';

// Tabellen-Typen aus Supabase
export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];

export type Driver = Database['public']['Tables']['drivers']['Row'];
export type DriverInsert = Database['public']['Tables']['drivers']['Insert'];
export type DriverUpdate = Database['public']['Tables']['drivers']['Update'];

export type Damage = Database['public']['Tables']['damages']['Row'];
export type DamageInsert = Database['public']['Tables']['damages']['Insert'];
export type DamageUpdate = Database['public']['Tables']['damages']['Update'];

export type Appointment = Database['public']['Tables']['appointments']['Row'];
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

export type Cost = Database['public']['Tables']['costs']['Row'];
export type CostInsert = Database['public']['Tables']['costs']['Insert'];

export type Document = Database['public']['Tables']['documents']['Row'];
export type DocumentInsert = Database['public']['Tables']['documents']['Insert'];

export type Company = Database['public']['Tables']['companies']['Row'];

// Erweiterte Typen mit Relationen
export interface VehicleWithRelations extends Vehicle {
  company: Company;
  appointments?: Appointment[];
  damages?: Damage[];
  documents?: Document[];
  costs?: Cost[];
}

export interface DamageWithRelations extends Damage {
  vehicle: Pick<Vehicle, 'id' | 'license_plate' | 'brand' | 'model'>;
  damage_type: { id: string; name: string };
  damage_images?: { id: string; file_path: string; uploaded_at: string }[];
}

export interface AppointmentWithRelations extends Appointment {
  vehicle: Pick<Vehicle, 'id' | 'license_plate' | 'brand' | 'model'>;
  appointment_type: { id: string; name: string; color: string };
}

// UI-spezifische Typen
export type FuelType = 'diesel' | 'benzin' | 'elektro' | 'hybrid_benzin' | 'hybrid_diesel' | 'gas';
export type VehicleStatus = 'active' | 'archived';
export type DamageStatus = 'reported' | 'approved' | 'in_repair' | 'completed';
export type AppointmentStatus = 'pending' | 'completed' | 'overdue';
```

---

## 12. Utility Funktionen

### 12.1 Utils

```typescript
// /lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Kombiniert Tailwind-Klassen und löst Konflikte auf
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formatiert ein Datum auf Deutsch
 */
export function formatDate(date: string | Date, formatString: string = 'dd.MM.yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatString, { locale: de });
}

/**
 * Formatiert ein Datum relativ (z.B. "vor 2 Tagen")
 */
export function formatRelativeDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: de });
}

/**
 * Formatiert einen Geldbetrag
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Formatiert einen Kilometerstand
 */
export function formatMileage(km: number): string {
  return new Intl.NumberFormat('de-DE').format(km) + ' km';
}

/**
 * Berechnet Tage bis zu einem Datum
 */
export function daysUntil(date: string | Date): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);
  const diffTime = dateObj.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Generiert initiale für einen Namen
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Kürzt einen Text auf eine maximale Länge
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
```

---

## 13. API Routes

### 13.1 Webhook für n8n

```typescript
// /app/api/webhooks/n8n/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Secret prüfen
  const authHeader = request.headers.get('authorization');
  const expectedSecret = `Bearer ${process.env.N8N_WEBHOOK_SECRET}`;
  
  if (authHeader !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    
    // Event-Typ auswerten
    const { event, data } = body;
    
    console.log(`Webhook empfangen: ${event}`, data);
    
    // Hier können zusätzliche Aktionen ausgeführt werden
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook-Fehler:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

### 13.2 Cron: Termin-Prüfung

```typescript
// /app/api/cron/check-appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Cron-Secret prüfen
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    
    const today = new Date();
    const in14Days = new Date(today);
    in14Days.setDate(today.getDate() + 14);
    const in30Days = new Date(today);
    in30Days.setDate(today.getDate() + 30);

    // Anstehende Termine laden
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        vehicle:vehicles(id, license_plate, brand, model),
        appointment_type:appointment_types(name)
      `)
      .neq('status', 'completed')
      .lte('due_date', in30Days.toISOString().split('T')[0])
      .order('due_date');

    if (error) {
      throw error;
    }

    // Kategorisieren
    const overdue: any[] = [];
    const urgent: any[] = [];
    const upcoming: any[] = [];

    for (const apt of appointments || []) {
      const dueDate = new Date(apt.due_date);
      const daysUntil = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const event = {
        appointment_id: apt.id,
        vehicle: apt.vehicle,
        appointment_type: apt.appointment_type?.name,
        due_date: apt.due_date,
        days_until_due: daysUntil,
      };

      if (daysUntil < 0) {
        overdue.push(event);
        // Status auf "overdue" setzen
        await supabase
          .from('appointments')
          .update({ status: 'overdue' })
          .eq('id', apt.id);
      } else if (daysUntil <= 14) {
        urgent.push(event);
      } else {
        upcoming.push(event);
      }
    }

    // Webhook an n8n senden (falls konfiguriert)
    if (process.env.N8N_WEBHOOK_URL && (overdue.length > 0 || urgent.length > 0)) {
      await fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.N8N_WEBHOOK_SECRET}`,
        },
        body: JSON.stringify({
          event: 'appointments.daily_check',
          timestamp: new Date().toISOString(),
          data: { overdue, urgent, upcoming },
        }),
      });
    }

    return NextResponse.json({
      success: true,
      checked: appointments?.length || 0,
      overdue: overdue.length,
      urgent: urgent.length,
      upcoming: upcoming.length,
    });
  } catch (error) {
    console.error('Cron-Job Fehler:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

---

## 14. Webhooks & Events

### 14.1 Event-Typen

```typescript
// /lib/events/types.ts
export type AppEvent =
  // Schäden
  | 'damage.created'
  | 'damage.updated'
  | 'damage.status_changed'
  
  // Termine
  | 'appointment.created'
  | 'appointment.due_soon'
  | 'appointment.due_urgent'
  | 'appointment.overdue'
  | 'appointment.completed'
  
  // Fahrzeuge
  | 'vehicle.created'
  | 'vehicle.updated'
  | 'vehicle.archived'
  
  // Reports
  | 'report.daily'
  | 'report.weekly'
  | 'report.monthly';

export interface EventPayload {
  event: AppEvent;
  timestamp: string;
  data: Record<string, unknown>;
}
```

### 14.2 Webhook-Sender

```typescript
// /lib/webhooks/sender.ts
import type { AppEvent, EventPayload } from '@/lib/events/types';
import { webhookConfig } from './config';

/**
 * Sendet ein Event an den konfigurierten Webhook
 */
export async function sendWebhookEvent(
  event: AppEvent,
  data: Record<string, unknown>
): Promise<void> {
  // Prüfen ob Event aktiviert ist
  if (!webhookConfig.enabled[event]) {
    return;
  }

  // Webhook-URL ermitteln
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn(`Kein Webhook konfiguriert für Event: ${event}`);
    return;
  }

  const payload: EventPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_WEBHOOK_SECRET}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook fehlgeschlagen: ${response.status}`);
    }

    console.log(`Webhook gesendet: ${event}`);
  } catch (error) {
    console.error(`Webhook-Fehler für ${event}:`, error);
    // Fehler nicht weiterwerfen – Webhook-Fehler sollen App nicht blockieren
  }
}
```

### 14.3 Webhook-Konfiguration

```typescript
// /lib/webhooks/config.ts
import type { AppEvent } from '@/lib/events/types';

export const webhookConfig: {
  enabled: Record<AppEvent, boolean>;
} = {
  enabled: {
    // Schäden – alle aktiv
    'damage.created': true,
    'damage.updated': true,
    'damage.status_changed': true,
    
    // Termine – alle aktiv
    'appointment.created': true,
    'appointment.due_soon': true,
    'appointment.due_urgent': true,
    'appointment.overdue': true,
    'appointment.completed': true,
    
    // Fahrzeuge – nur wichtige
    'vehicle.created': true,
    'vehicle.updated': false,
    'vehicle.archived': true,
    
    // Reports – später aktivierbar
    'report.daily': false,
    'report.weekly': false,
    'report.monthly': false,
  },
};
```

---

## 15. Seiten-Templates

### 15.1 Listen-Seite

```typescript
// Beispiel: /app/vehicles/page.tsx
import Link from 'next/link';
import { Plus, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { VehicleTable } from '@/components/vehicles/vehicle-table';
import { VehicleFilters } from '@/components/vehicles/vehicle-filters';

export default function VehiclesPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Fahrzeuge"
        description="Verwalte alle Firmenfahrzeuge"
        actions={
          <>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              CSV Export
            </Button>
            <Button asChild>
              <Link href="/vehicles/new">
                <Plus className="mr-2 h-4 w-4" />
                Neues Fahrzeug
              </Link>
            </Button>
          </>
        }
      />
      
      <VehicleFilters />
      
      <VehicleTable />
    </div>
  );
}
```

### 15.2 Detail-Seite

```typescript
// Beispiel: /app/vehicles/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/page-header';
import { VehicleOverview } from '@/components/vehicles/vehicle-overview';
import { VehicleDocuments } from '@/components/vehicles/vehicle-documents';
import { VehicleAppointments } from '@/components/vehicles/vehicle-appointments';

interface VehiclePageProps {
  params: { id: string };
}

export default async function VehiclePage({ params }: VehiclePageProps): Promise<JSX.Element> {
  // Daten laden (Server Component)
  const vehicle = await fetchVehicle(params.id);
  
  if (!vehicle) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/vehicles">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Link>
        </Button>
      </div>

      <PageHeader
        title={vehicle.license_plate}
        description={`${vehicle.brand} ${vehicle.model}`}
        actions={
          <Button asChild>
            <Link href={`/vehicles/${vehicle.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Bearbeiten
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
          <TabsTrigger value="appointments">Termine</TabsTrigger>
          <TabsTrigger value="damages">Schäden</TabsTrigger>
          <TabsTrigger value="costs">Kosten</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <VehicleOverview vehicle={vehicle} />
        </TabsContent>
        
        <TabsContent value="documents">
          <VehicleDocuments vehicleId={vehicle.id} />
        </TabsContent>
        
        <TabsContent value="appointments">
          <VehicleAppointments vehicleId={vehicle.id} />
        </TabsContent>
        
        {/* Weitere Tabs... */}
      </Tabs>
    </div>
  );
}
```

### 15.3 Formular-Seite

```typescript
// Beispiel: /app/vehicles/new/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { VehicleForm } from '@/components/vehicles/vehicle-form';
import { useCreateVehicle } from '@/hooks/use-vehicles';
import type { VehicleFormData } from '@/lib/validations/vehicle';

export default function NewVehiclePage(): JSX.Element {
  const router = useRouter();
  const createVehicle = useCreateVehicle();

  const handleSubmit = async (data: VehicleFormData): Promise<void> => {
    const vehicle = await createVehicle.mutateAsync(data);
    router.push(`/vehicles/${vehicle.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Neues Fahrzeug"
        description="Lege ein neues Fahrzeug im System an"
      />
      
      <div className="max-w-2xl">
        <VehicleForm
          onSubmit={handleSubmit}
          isSubmitting={createVehicle.isPending}
        />
      </div>
    </div>
  );
}
```

---

## Anhang: Schnellreferenz

### Wichtige Befehle

```bash
# Entwicklungsserver starten
npm run dev

# Build erstellen
npm run build

# Produktionsserver starten
npm run start

# Linting
npm run lint

# Supabase Typen generieren
npx supabase gen types typescript --project-id XXX > lib/supabase/types.ts

# shadcn Komponente hinzufügen
npx shadcn@latest add [komponente]

# E2E-Tests ausführen
npx playwright test
```

### Wichtige Dateipfade

| Pfad | Zweck |
|------|-------|
| `/app` | Seiten und Layouts |
| `/components/ui` | shadcn Komponenten |
| `/components/[feature]` | Feature-Komponenten |
| `/lib/supabase` | Supabase Clients |
| `/lib/validations` | Zod Schemas |
| `/lib/database` | Datenbank-Funktionen |
| `/hooks` | Custom Hooks |
| `/types` | TypeScript Typen |

---

**Ende des Handbuchs**
