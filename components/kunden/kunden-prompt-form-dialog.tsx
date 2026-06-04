'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateKundenPrompt, useUpdateKundenPrompt } from '@/hooks/use-kunden';
import type { CustomerPrompt } from '@/types';

interface KundenPromptFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vorlage?: CustomerPrompt | null;
}

interface FormState {
  name: string;
  beschreibung: string;
  kategorie: string;
  template: string;
}

const empty: FormState = { name: '', beschreibung: '', kategorie: '', template: '' };

export function KundenPromptFormDialog({
  open,
  onOpenChange,
  vorlage,
}: KundenPromptFormDialogProps): React.JSX.Element {
  const isEdit = !!vorlage;
  const create = useCreateKundenPrompt();
  const update = useUpdateKundenPrompt();
  const [form, setForm] = useState<FormState>(empty);

  useEffect(() => {
    if (open) {
      setForm(
        vorlage
          ? {
              name: vorlage.name,
              beschreibung: vorlage.beschreibung ?? '',
              kategorie: vorlage.kategorie ?? '',
              template: vorlage.template,
            }
          : empty,
      );
    }
  }, [open, vorlage]);

  const onChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      beschreibung: form.beschreibung.trim() || null,
      kategorie: form.kategorie.trim() || null,
      template: form.template.trim(),
    };
    try {
      if (isEdit && vorlage) {
        await update.mutateAsync({ id: vorlage.id, updates: payload });
      } else {
        await create.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch {
      // Toast vom Hook
    }
  };

  const isPending = create.isPending || update.isPending;
  const valid = form.name.trim().length > 0 && form.template.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Vorlage bearbeiten' : 'Neue Prompt-Vorlage'}</DialogTitle>
            <DialogDescription>
              Platzhalter: <code className="rounded bg-muted px-1">{'{{customer.firmenname}}'}</code>,{' '}
              <code className="rounded bg-muted px-1">{'{{customer.adresse}}'}</code> u.a. für Kundendaten;{' '}
              <code className="rounded bg-muted px-1">{'{{MWST}}'}</code>,{' '}
              <code className="rounded bg-muted px-1">{'{{RNR_PRAEFIX}}'}</code> u.a. für Datenkodierungen.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input id="name" value={form.name} onChange={onChange('name')} required maxLength={120} placeholder="z.B. Rechnung Standard" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kategorie">Kategorie</Label>
                <Input id="kategorie" value={form.kategorie} onChange={onChange('kategorie')} maxLength={80} placeholder="z.B. Rechnung, Mahnung, Angebot" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="beschreibung">Beschreibung</Label>
              <Input id="beschreibung" value={form.beschreibung} onChange={onChange('beschreibung')} maxLength={500} placeholder="Wofür ist diese Vorlage gedacht?" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="template">
                Vorlage <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="template"
                value={form.template}
                onChange={onChange('template')}
                rows={12}
                maxLength={20000}
                className="font-mono text-sm"
                required
                placeholder={`Erstelle eine Rechnung für {{customer.firmenname}}.\nAdresse: {{customer.adresse}}\nRechnungsnummer-Präfix: {{RNR_PRAEFIX}}\nMwSt: {{MWST}}\n…`}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isPending || !valid}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Speichern' : 'Anlegen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
