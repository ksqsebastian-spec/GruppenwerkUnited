'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { loginSchema, type LoginFormData } from '@/lib/validations/auth';

/**
 * Login-Seite der Werkbank-Plattform
 * Passwort-Schutz via SITE_PASSWORD Umgebungsvariable
 */
export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: data.password }),
      });

      if (!response.ok) {
        toast.error('Falsches Passwort');
        return;
      }

      toast.success('Erfolgreich angemeldet');
      // Hard-Redirect damit der Auth-Provider neu initialisiert wird
      window.location.href = '/';
    } catch {
      toast.error('Anmeldung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        {/* Logo + Titel */}
        <div className="flex flex-col items-center mb-8 gap-4">
          <Image
            src="/logos/ollama-icon.webp"
            width={48}
            height={48}
            alt="Gruppenwerk"
            className="rounded-xl"
          />
          <div className="text-center">
            <h1 className="text-2xl font-medium text-[#000000] tracking-tight">Werkbank</h1>
            <p className="text-sm text-[#737373] mt-1">Gruppenwerk Intranet-Plattform</p>
          </div>
        </div>

        {/* Formular – Logik und Validierung unverändert */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-[#262626]">Passwort</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Passwort eingeben"
                      className="rounded-full border-[#e5e5e5] bg-white h-10 px-4"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full rounded-full bg-[#000000] text-white hover:bg-[#262626] h-10"
              disabled={isLoading}
            >
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
        </Form>
      </div>
    </div>
  );
}
