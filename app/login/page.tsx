'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-sm border-border">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center">
              <Wrench className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Werkbank</CardTitle>
            <CardDescription className="mt-1">
              Gruppenwerk Intranet-Plattform
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passwort</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Passwort eingeben"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
