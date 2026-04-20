'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Check, Loader2, ShieldCheck } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

import { useCreateDatenkodierung } from '@/hooks/use-datenkodierung';
import { datenkodierungSchema, type DatenkodierungFormData } from '@/lib/validations/datenkodierung';
import type { Datenkodierung } from '@/types';

interface KodierungErstellenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KodierungErstellenDialog({
  open,
  onOpenChange,
}: KodierungErstellenDialogProps): React.JSX.Element {
  const [erstellterDatensatz, setErstellterDatensatz] = useState<Datenkodierung | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const { mutateAsync, isPending } = useCreateDatenkodierung();

  const form = useForm<DatenkodierungFormData>({
    resolver: zodResolver(datenkodierungSchema),
    defaultValues: {
      name: '',
      adresse: '',
      notizen: '',
    },
  });

  const handleSubmit = async (data: DatenkodierungFormData): Promise<void> => {
    const result = await mutateAsync({
      name: data.name,
      adresse: data.adresse || null,
      notizen: data.notizen || null,
    });
    setErstellterDatensatz(result);
  };

  const handleCopyCode = async (): Promise<void> => {
    if (!erstellterDatensatz) return;
    await navigator.clipboard.writeText(erstellterDatensatz.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleClose = (): void => {
    onOpenChange(false);
    setTimeout(() => {
      setErstellterDatensatz(null);
      setCodeCopied(false);
      form.reset();
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {erstellterDatensatz ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                Datensatz erfolgreich kodiert
              </DialogTitle>
              <DialogDescription>
                Verwende diesen Code in deinen Dokumenten und KI-Prompts.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 text-center">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Dein Kodierungs-Code
                </p>
                <p className="font-mono text-3xl font-bold tracking-widest text-primary">
                  {erstellterDatensatz.code}
                </p>
              </div>

              <Button
                onClick={handleCopyCode}
                className="w-full"
                variant={codeCopied ? 'outline' : 'default'}
              >
                {codeCopied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Code kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Code kopieren
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Dieser Code ist jederzeit über die Suche auffindbar.
              </p>

              <Button variant="ghost" className="w-full" onClick={handleClose}>
                Schließen
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Neuen Datensatz kodieren</DialogTitle>
              <DialogDescription>
                Die echten Daten werden sicher gespeichert. Du erhältst einen Code zur Verwendung
                in Dokumenten und KI-Prompts.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. Michael Müller" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adresse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. Hamburger Straße 12, 20099 Hamburg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notizen"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notizen</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Optionale interne Anmerkungen..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Kodieren
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
