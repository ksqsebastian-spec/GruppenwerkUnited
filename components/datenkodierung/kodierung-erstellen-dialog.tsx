'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Check, Loader2, ShieldCheck, X, Tag } from 'lucide-react';

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

function tagColor(tag: string): string {
  const colors = ['#c96442', '#2563eb', '#16a34a', '#7C3AED', '#d97706', '#0891b2'];
  let hash = 0;
  for (const c of tag) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[hash % colors.length];
}

export function KodierungErstellenDialog({
  open,
  onOpenChange,
}: KodierungErstellenDialogProps): React.JSX.Element {
  const [erstellterDatensatz, setErstellterDatensatz] = useState<Datenkodierung | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync, isPending } = useCreateDatenkodierung();

  const form = useForm<DatenkodierungFormData>({
    resolver: zodResolver(datenkodierungSchema),
    defaultValues: {
      name: '',
      adresse: '',
      notizen: '',
      tags: [],
    },
  });

  const currentTags = form.watch('tags') ?? [];

  function addTag(): void {
    const trimmed = tagInput.trim();
    if (!trimmed || currentTags.includes(trimmed) || currentTags.length >= 10) return;
    form.setValue('tags', [...currentTags, trimmed]);
    setTagInput('');
    tagInputRef.current?.focus();
  }

  function removeTag(tag: string): void {
    form.setValue('tags', currentTags.filter((t) => t !== tag));
  }

  const handleSubmit = async (data: DatenkodierungFormData): Promise<void> => {
    const result = await mutateAsync({
      name: data.name,
      adresse: data.adresse || null,
      notizen: data.notizen || null,
      tags: data.tags ?? [],
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
      setTagInput('');
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

              {erstellterDatensatz.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {erstellterDatensatz.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: tagColor(tag) }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

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

                {/* Tag-Eingabe */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        ref={tagInputRef}
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); addTag(); }
                        }}
                        placeholder="Tag eingeben + Enter"
                        maxLength={30}
                        className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm outline-none focus:border-foreground/30 focus:ring-1 focus:ring-foreground/20"
                      />
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addTag}>
                      Hinzufügen
                    </Button>
                  </div>
                  {currentTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {currentTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: tagColor(tag) }}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-0.5 rounded-full hover:opacity-70"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

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
