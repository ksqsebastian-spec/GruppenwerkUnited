'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { File as FileIcon, Loader2, Upload, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateKundenPrompt, useUploadKundenPromptVorlage } from '@/hooks/use-kunden';
import { useDatenkodierungen } from '@/hooks/use-datenkodierung';
import {
  DOKUMENTTYPEN,
  KUNDEN_FELDER,
  baueVorlagenText,
  type Dokumenttyp,
  type Tonalitaet,
  type WizardInput,
} from '@/lib/kunden/prompt-builder';

interface KundenPromptWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LEER: WizardInput = {
  typ: 'rechnung',
  name: '',
  kategorie: '',
  beschreibung: '',
  kundenfelder: [],
  eigeneDaten: [],
  zusatz: '',
  tonalitaet: 'sachlich',
};

export function KundenPromptWizardDialog({
  open,
  onOpenChange,
}: KundenPromptWizardDialogProps): React.JSX.Element {
  const create = useCreateKundenPrompt();
  const upload = useUploadKundenPromptVorlage();
  const { data: datenkodierungen = [] } = useDatenkodierungen();

  const [state, setState] = useState<WizardInput>(LEER);
  const [datei, setDatei] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Beim ersten Öffnen Standard-Werte des gewählten Typs übernehmen
  useEffect(() => {
    if (open) {
      const typMeta = DOKUMENTTYPEN[0];
      setState({
        ...LEER,
        typ: typMeta.id,
        name: typMeta.defaultName,
        kategorie: typMeta.kategorie,
        kundenfelder: typMeta.defaultKundenfelder,
      });
      setDatei(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open]);

  const handleTypWechsel = (typ: Dokumenttyp): void => {
    const meta = DOKUMENTTYPEN.find((d) => d.id === typ);
    if (!meta) return;
    setState((prev) => ({
      ...prev,
      typ,
      // Name und Kategorie nur ersetzen, wenn der Nutzer noch nichts Eigenes getippt hat
      name: prev.name === '' || isStandardName(prev.name) ? meta.defaultName : prev.name,
      kategorie: prev.kategorie === '' || isStandardKategorie(prev.kategorie) ? meta.kategorie : prev.kategorie,
      kundenfelder: meta.defaultKundenfelder,
    }));
  };

  const toggleKundenfeld = (key: string): void => {
    setState((prev) => {
      const set = new Set(prev.kundenfelder);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      return { ...prev, kundenfelder: [...set] };
    });
  };

  const toggleEigeneDaten = (code: string): void => {
    setState((prev) => {
      const set = new Set(prev.eigeneDaten);
      if (set.has(code)) set.delete(code);
      else set.add(code);
      return { ...prev, eigeneDaten: [...set] };
    });
  };

  const datenkodierungLabels = useMemo<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const d of datenkodierungen) m[d.code] = d.name;
    return m;
  }, [datenkodierungen]);

  const vorschau = useMemo(() => baueVorlagenText(state, datenkodierungLabels), [state, datenkodierungLabels]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const payload = {
      name: state.name.trim(),
      beschreibung: state.beschreibung.trim() || null,
      kategorie: state.kategorie.trim() || null,
      template: vorschau,
    };
    try {
      const gespeichert = await create.mutateAsync(payload);
      if (datei) {
        await upload.mutateAsync({ id: gespeichert.id, file: datei });
      }
      onOpenChange(false);
    } catch {
      // Toast vom Hook
    }
  };

  const isPending = create.isPending || upload.isPending;
  const valid = state.name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-hidden">
        <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" /> Vorlage anlegen — geführt
            </DialogTitle>
            <DialogDescription>
              Beantworte ein paar Fragen — der Prompt wird automatisch gebaut.
            </DialogDescription>
          </DialogHeader>

          <div className="grid flex-1 gap-6 overflow-y-auto pb-2 pr-1 md:grid-cols-[1fr_280px]">
            {/* ── Eingaben ─────────────────────────────────────────────────────── */}
            <div className="space-y-5">
              {/* 1. Was möchtest du erstellen? */}
              <div>
                <Label className="text-sm font-medium">1. Was möchtest du erstellen?</Label>
                <Select value={state.typ} onValueChange={(v: Dokumenttyp) => handleTypWechsel(v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOKUMENTTYPEN.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="wizard-name" className="text-xs text-muted-foreground">Name der Vorlage</Label>
                    <Input
                      id="wizard-name"
                      value={state.name}
                      onChange={(e) => setState((p) => ({ ...p, name: e.target.value }))}
                      maxLength={120}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="wizard-kategorie" className="text-xs text-muted-foreground">Kategorie</Label>
                    <Input
                      id="wizard-kategorie"
                      value={state.kategorie}
                      onChange={(e) => setState((p) => ({ ...p, kategorie: e.target.value }))}
                      maxLength={80}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Welche Kundendaten einfügen? */}
              <div>
                <Label className="text-sm font-medium">2. Welche Kundendaten sollen vorkommen?</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {KUNDEN_FELDER.map((f) => (
                    <label key={f.key} className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card p-2 text-sm">
                      <Checkbox
                        checked={state.kundenfelder.includes(f.key)}
                        onCheckedChange={() => toggleKundenfeld(f.key)}
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Welche eigenen Daten einfügen? */}
              <div>
                <Label className="text-sm font-medium">3. Welche eigenen Daten sollen vorkommen?</Label>
                <p className="text-xs text-muted-foreground">
                  Aus deiner Datenkodierung (z.B. MwSt-Satz, Rechnungsnummer-Präfix).
                </p>
                {datenkodierungen.length === 0 ? (
                  <p className="mt-2 rounded-md border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                    Du hast noch keine Einträge im Modul „Datenkodierung". Du kannst die Vorlage
                    trotzdem ohne diese Daten anlegen.
                  </p>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {datenkodierungen.map((d) => (
                      <label key={d.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card p-2 text-sm">
                        <Checkbox
                          checked={state.eigeneDaten.includes(d.code)}
                          onCheckedChange={() => toggleEigeneDaten(d.code)}
                        />
                        <span className="flex-1 truncate">
                          <span className="font-medium">{d.code}</span>
                          <span className="text-muted-foreground"> · {d.name}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Tonalität */}
              <div>
                <Label className="text-sm font-medium">4. Tonalität</Label>
                <Select
                  value={state.tonalitaet}
                  onValueChange={(v: Tonalitaet) => setState((p) => ({ ...p, tonalitaet: v }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foermlich">Förmlich — klassischer Geschäftsbrief</SelectItem>
                    <SelectItem value="sachlich">Sachlich — neutral und kurz</SelectItem>
                    <SelectItem value="freundlich">Freundlich — persönlich, aber professionell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 5. Anlass / Zusätzliche Anweisungen */}
              <div>
                <Label htmlFor="wizard-zusatz" className="text-sm font-medium">
                  5. Anlass &amp; zusätzliche Anweisungen
                </Label>
                <p className="text-xs text-muted-foreground">
                  Was ist der konkrete Anlass? Welche Positionen oder Inhalte sollen vorkommen?
                </p>
                <Textarea
                  id="wizard-zusatz"
                  value={state.zusatz}
                  onChange={(e) => setState((p) => ({ ...p, zusatz: e.target.value }))}
                  rows={4}
                  maxLength={5000}
                  className="mt-1"
                  placeholder="z.B. Rechnung für Sanierungsarbeiten Bad &amp; Küche, drei Positionen, MwSt ausweisen, Zahlung 14 Tage netto."
                />
              </div>

              {/* 6. Beschreibung (kurz) */}
              <div>
                <Label htmlFor="wizard-beschreibung" className="text-sm font-medium">
                  6. Kurze Beschreibung der Vorlage (für deine eigene Übersicht)
                </Label>
                <Input
                  id="wizard-beschreibung"
                  value={state.beschreibung}
                  onChange={(e) => setState((p) => ({ ...p, beschreibung: e.target.value }))}
                  maxLength={500}
                  className="mt-1"
                  placeholder="z.B. Standard-Rechnung für Bestandskunden"
                />
              </div>

              {/* 7. Datei */}
              <div>
                <Label className="text-sm font-medium">
                  7. Vorlage-Datei (optional)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Eine Word- oder PDF-Datei (z.B. dein Briefkopf), die im KI-Chat per Drag&amp;Drop
                  hinzugefügt wird.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPending}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {datei ? 'Andere wählen' : 'Datei wählen'}
                  </Button>
                  {datei && (
                    <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <FileIcon className="h-3 w-3" /> {datei.name}
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

            {/* ── Vorschau ─────────────────────────────────────────────────────── */}
            <aside className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Vorschau</Label>
              <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-xs">
                {vorschau}
              </pre>
              <p className="text-xs text-muted-foreground">
                So sieht der Prompt-Text aus. Beim Klick auf einen Kunden werden die
                {' '}<code className="rounded bg-muted px-1">{'{{…}}'}</code>{' '}
                automatisch durch echte Werte ersetzt.
              </p>
            </aside>
          </div>

          <DialogFooter className="border-t pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isPending || !valid}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Vorlage anlegen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Helfer ────────────────────────────────────────────────────────────────────

function isStandardName(name: string): boolean {
  return DOKUMENTTYPEN.some((d) => d.defaultName === name);
}

function isStandardKategorie(kat: string): boolean {
  return DOKUMENTTYPEN.some((d) => d.kategorie === kat);
}
