'use client';

import { useEffect, useRef, useState } from 'react';
import { File as FileIcon, Loader2, Trash2, Upload } from 'lucide-react';

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
import {
  useCreateKundenPrompt,
  useUpdateKundenPrompt,
  useUploadKundenPromptVorlage,
  useRemoveKundenPromptVorlage,
} from '@/hooks/use-kunden';
import { useDatenkodierungen } from '@/hooks/use-datenkodierung';
import { PromptTokenEditor, type TokenDef } from './prompt-token-editor';
import type { CustomerPrompt } from '@/types';
import type { StarterPrompt } from '@/lib/kunden/starter-prompts';

const CUSTOMER_FIELDS: TokenDef[] = [
  { key: 'customer.firmenname', label: 'Firmenname' },
  { key: 'customer.ansprechpartner', label: 'Ansprechpartner' },
  { key: 'customer.email', label: 'E-Mail' },
  { key: 'customer.telefon', label: 'Telefon' },
  { key: 'customer.adresse', label: 'Adresse' },
  { key: 'customer.notizen', label: 'Notizen' },
];

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
}

const empty: FormState = { name: '', beschreibung: '', kategorie: '', template: '' };

function formStateAus(quelle: CustomerPrompt | StarterPrompt): FormState {
  return {
    name: quelle.name,
    beschreibung: quelle.beschreibung ?? '',
    kategorie: quelle.kategorie ?? '',
    template: quelle.template,
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
  const uploadVorlage = useUploadKundenPromptVorlage();
  const removeVorlage = useRemoveKundenPromptVorlage();
  const { data: datenkodierungen = [] } = useDatenkodierungen();
  const datenkodierungTokens: TokenDef[] = datenkodierungen.map((d) => ({
    key: d.code,
    label: d.code,
    hint: d.name,
  }));

  const [form, setForm] = useState<FormState>(empty);
  const [datei, setDatei] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (vorlage) {
        setForm(formStateAus(vorlage));
      } else if (starter) {
        setForm(formStateAus(starter));
      } else {
        setForm(empty);
      }
      setDatei(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open, vorlage, starter]);

  const onChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const onTemplateChange = (next: string): void => {
    setForm((prev) => ({ ...prev, template: next }));
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
      const gespeichert = isEdit && vorlage
        ? await update.mutateAsync({ id: vorlage.id, updates: payload })
        : await create.mutateAsync(payload);
      // Optional anschließend die Vorlage-Datei hochladen
      if (datei) {
        await uploadVorlage.mutateAsync({ id: gespeichert.id, file: datei });
      }
      onOpenChange(false);
    } catch {
      // Toasts vom Hook
    }
  };

  const handleEntferneVorhandeneVorlage = async (): Promise<void> => {
    if (!vorlage) return;
    try {
      await removeVorlage.mutateAsync(vorlage.id);
    } catch {
      // Toast vom Hook
    }
  };

  const isPending = create.isPending || update.isPending || uploadVorlage.isPending || removeVorlage.isPending;
  const valid = form.name.trim().length > 0 && form.template.trim().length > 0;
  const aktuelleVorlageName = vorlage?.vorlage_dateiname;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Vorlage bearbeiten' : 'Neue Prompt-Vorlage'}</DialogTitle>
            <DialogDescription>
              Schreibe den Anweisungs-Text und füge Felder per Klick als Chips ein —
              z.B. „Firmenname" für die jeweilige Kunden-Firma.
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
              <Label>Vorlage-Datei (optional)</Label>
              <p className="text-xs text-muted-foreground">
                Z.B. eine Word- oder PDF-Datei mit dem Briefkopf, die im KI-Chat per Drag&amp;Drop
                hinzugefügt wird. Max. 10 MB. Erlaubt: PDF, DOC(X), XLS(X), Bilder, TXT, MD, CSV.
              </p>
              {aktuelleVorlageName && !datei && (
                <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 p-2">
                  <span className="flex items-center gap-2 text-sm">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    {aktuelleVorlageName}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleEntferneVorhandeneVorlage}
                    disabled={isPending}
                    aria-label="Vorlage entfernen"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {datei ? 'Andere Datei wählen' : aktuelleVorlageName ? 'Datei ersetzen' : 'Datei wählen'}
                </Button>
                {datei && (
                  <span className="truncate text-xs text-muted-foreground">
                    Auswahl: {datei.name}
                  </span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setDatei(e.target.files?.[0] ?? null)}
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv,.md"
                />
              </div>
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
