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
import { useCreateKundenPrompt, useUpdateKundenPrompt } from '@/hooks/use-kunden';
import { useDatenkodierungen } from '@/hooks/use-datenkodierung';
import { PromptTokenEditor, type TokenDef } from './prompt-token-editor';
import { DateiVorlageSelect } from './datei-vorlage-select';
import { CUSTOMER_TOKEN_FIELDS } from '@/lib/kunden/customer-fields';
import type { CustomerPrompt } from '@/types';
import type { StarterPrompt } from '@/lib/kunden/starter-prompts';

const CUSTOMER_FIELDS: TokenDef[] = CUSTOMER_TOKEN_FIELDS;

interface KundenPromptFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vorlage?: CustomerPrompt | null;
  /** Wenn gesetzt, wird das Formular mit dem Starter-Inhalt vorbefüllt (nur beim Anlegen). */
  starter?: StarterPrompt | null;
}

interface FormState {
  name: string;
  beschreibung: string;
  kategorie: string;
  template: string;
  /** UUID einer Datei-Vorlage oder null. */
  datei_vorlage_id: string | null;
}

const empty: FormState = {
  name: '',
  beschreibung: '',
  kategorie: '',
  template: '',
  datei_vorlage_id: null,
};

function formStateAus(quelle: CustomerPrompt | StarterPrompt): FormState {
  return {
    name: quelle.name,
    beschreibung: quelle.beschreibung ?? '',
    kategorie: quelle.kategorie ?? '',
    template: quelle.template,
    datei_vorlage_id: 'datei_vorlage_id' in quelle ? quelle.datei_vorlage_id ?? null : null,
  };
}

export function KundenPromptFormDialog({
  open,
  onOpenChange,
  vorlage,
  starter,
}: KundenPromptFormDialogProps): React.JSX.Element {
  const isEdit = !!vorlage;
  const create = useCreateKundenPrompt();
  const update = useUpdateKundenPrompt();
  const { data: datenkodierungen = [] } = useDatenkodierungen();
  const datenkodierungTokens: TokenDef[] = datenkodierungen.map((d) => ({
    key: d.code,
    label: d.code,
    hint: d.name,
  }));

  const [form, setForm] = useState<FormState>(empty);

  useEffect(() => {
    if (open) {
      if (vorlage) {
        setForm(formStateAus(vorlage));
      } else if (starter) {
        setForm(formStateAus(starter));
      } else {
        setForm(empty);
      }
    }
  }, [open, vorlage, starter]);

  const onChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const onTemplateChange = (next: string): void => {
    setForm((prev) => ({ ...prev, template: next }));
  };

  const onDateiChange = (id: string | null): void => {
    setForm((prev) => ({ ...prev, datei_vorlage_id: id }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      beschreibung: form.beschreibung.trim() || null,
      kategorie: form.kategorie.trim() || null,
      template: form.template.trim(),
      datei_vorlage_id: form.datei_vorlage_id,
    };
    try {
      if (isEdit && vorlage) {
        await update.mutateAsync({ id: vorlage.id, updates: payload });
      } else {
        await create.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch {
      // Toasts vom Hook
    }
  };

  const isPending = create.isPending || update.isPending;
  const valid = form.name.trim().length > 0 && form.template.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Prompt-Vorlage bearbeiten' : 'Neue Prompt-Vorlage'}</DialogTitle>
            <DialogDescription>
              Schreibe den Anweisungs-Text und füge Felder per Klick als Chips ein. Die zugehörige
              Datei (Briefpapier o.ä.) wählst du unten aus deiner Bibliothek.
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
                Prompt-Text <span className="text-red-500">*</span>
              </Label>
              <PromptTokenEditor
                id="template"
                value={form.template}
                onChange={onTemplateChange}
                customerFields={CUSTOMER_FIELDS}
                datenkodierungen={datenkodierungTokens}
                placeholder="Schreibe hier den Anweisungs-Text…"
                rows={14}
              />
            </div>

            <div className="grid gap-2">
              <DateiVorlageSelect
                value={form.datei_vorlage_id}
                onChange={onDateiChange}
                label="Zugehörige Datei-Vorlage (optional)"
              />
              <p className="text-xs text-muted-foreground">
                Wird beim Erzeugen des Dokuments automatisch vorgeschlagen — der Nutzer kann
                vor Ort eine andere Datei aus der Bibliothek wählen.
              </p>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 border-t bg-background pt-3">
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
