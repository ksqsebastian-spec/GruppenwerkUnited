'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { getAppTypKonfiguration, APP_TYPEN } from '@/lib/automationen/app-typen';
import { useUpdateKnoten, useDeleteKnoten } from '@/hooks/use-automationen';
import type { AutomatisierungsKnoten, AutomatisierungAppTyp } from '@/types';

interface KnotenEditPanelProps {
  knoten: AutomatisierungsKnoten | null;
  offen: boolean;
  onSchliessen: () => void;
}

/**
 * Figma-style Properties-Panel für die Bearbeitung eines Automatisierungs-Knotens.
 * Öffnet als Sheet von rechts, speichert explizit per Button.
 */
export function KnotenEditPanel({
  knoten,
  offen,
  onSchliessen,
}: KnotenEditPanelProps): React.JSX.Element {
  const { mutate: updateKnoten, isPending: speichernLaeuft } = useUpdateKnoten();
  const { mutate: deleteKnoten, isPending: loeschenLaeuft } = useDeleteKnoten();
  const [loeschDialogOffen, setLoeschDialogOffen] = useState(false);

  const [titel, setTitel] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [appTyp, setAppTyp] = useState<AutomatisierungAppTyp>('generic');
  const [prompt, setPrompt] = useState('');
  const [gdrivePfad, setGdrivePfad] = useState('');
  const [useDatenkodierung, setUseDatenkodierung] = useState(false);

  // Formular mit Knoten-Daten befüllen wenn Panel öffnet
  useEffect(() => {
    if (knoten) {
      setTitel(knoten.title);
      setBeschreibung(knoten.description ?? '');
      setAppTyp(knoten.app_type);
      setPrompt(knoten.prompt_template ?? '');
      setGdrivePfad(knoten.gdrive_path ?? '');
      setUseDatenkodierung(knoten.use_datenkodierung);
    }
  }, [knoten]);

  const handleSpeichern = (): void => {
    if (!knoten) return;
    updateKnoten(
      {
        id: knoten.id,
        updates: {
          title: titel.trim(),
          description: beschreibung.trim() || null,
          app_type: appTyp,
          prompt_template: prompt.trim() || null,
          gdrive_path: gdrivePfad.trim() || null,
          use_datenkodierung: useDatenkodierung,
        },
      },
      { onSuccess: onSchliessen }
    );
  };

  const handleLoeschen = (): void => {
    if (!knoten) return;
    deleteKnoten(knoten.id, { onSuccess: onSchliessen });
  };

  if (!knoten) return <></>;

  return (
    <>
      <Sheet open={offen} onOpenChange={(v) => { if (!v) onSchliessen(); }}>
        <SheetContent className="w-[380px] sm:w-[420px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-base">Knoten bearbeiten</SheetTitle>
          </SheetHeader>

          <div className="space-y-5">
            {/* Titel */}
            <div className="space-y-1.5">
              <Label htmlFor="knoten-titel">Titel</Label>
              <Input
                id="knoten-titel"
                value={titel}
                onChange={(e) => setTitel(e.target.value)}
                placeholder="z.B. Angebot erstellen"
              />
            </div>

            {/* Beschreibung */}
            <div className="space-y-1.5">
              <Label htmlFor="knoten-beschreibung">Beschreibung</Label>
              <Textarea
                id="knoten-beschreibung"
                value={beschreibung}
                onChange={(e) => setBeschreibung(e.target.value)}
                placeholder="Kurze Erklärung was dieser Schritt tut..."
                className="resize-none"
                rows={2}
              />
            </div>

            <Separator />

            {/* App-Typ Auswahl */}
            <div className="space-y-2">
              <Label>App-Typ</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(APP_TYPEN) as [AutomatisierungAppTyp, typeof APP_TYPEN[AutomatisierungAppTyp]][])
                  .filter(([typ]) => typ !== 'ai') // 'ai' ist Alias für 'claude'
                  .map(([typ, cfg]) => {
                    const Logo = cfg.Logo;
                    const aktiv = appTyp === typ;
                    return (
                      <button
                        key={typ}
                        onClick={() => setAppTyp(typ)}
                        className="flex flex-col items-center gap-1.5 rounded-lg border-2 p-2.5 text-xs font-medium transition-all"
                        style={{
                          borderColor: aktiv ? cfg.farbe : 'hsl(var(--border))',
                          backgroundColor: aktiv ? cfg.helleFarbe : undefined,
                          color: aktiv ? cfg.farbe : undefined,
                        }}
                      >
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-md"
                          style={{ backgroundColor: aktiv ? 'white' : cfg.helleFarbe }}
                        >
                          <Logo className="h-5 w-5" />
                        </div>
                        {cfg.bezeichnung}
                      </button>
                    );
                  })}
              </div>
            </div>

            <Separator />

            {/* GDrive-Pfad */}
            <div className="space-y-1.5">
              <Label htmlFor="gdrive-pfad">GDrive-Pfad (optional)</Label>
              <Input
                id="gdrive-pfad"
                value={gdrivePfad}
                onChange={(e) => setGdrivePfad(e.target.value)}
                placeholder="/Firma/Ordner/Unterordner/"
                className="font-mono text-xs"
              />
            </div>

            {/* Prompt */}
            <div className="space-y-1.5">
              <Label htmlFor="knoten-prompt">
                Claude-Prompt{' '}
                <span className="text-muted-foreground font-normal">(leer = Kategorie-Knoten)</span>
              </Label>
              <Textarea
                id="knoten-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Öffne das Datenverzeichnis unter ... und erstelle daraus ein Angebot..."
                className="resize-none text-xs"
                rows={6}
              />
            </div>

            {/* Datenkodierung */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="datenkodierung"
                checked={useDatenkodierung}
                onCheckedChange={(v) => setUseDatenkodierung(v === true)}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="datenkodierung" className="cursor-pointer">
                  Datenkodierung-Prompt
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Zeigt Badge wenn der Prompt pseudonymisierte Daten referenziert
                </p>
              </div>
            </div>

            <Separator />

            {/* Aktions-Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleSpeichern}
                disabled={speichernLaeuft || !titel.trim()}
                className="flex-1"
              >
                {speichernLaeuft ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
              <Button
                variant="outline"
                onClick={onSchliessen}
                disabled={speichernLaeuft}
              >
                Abbrechen
              </Button>
            </div>

            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setLoeschDialogOffen(true)}
              disabled={loeschenLaeuft}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Knoten löschen
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={loeschDialogOffen}
        onOpenChange={setLoeschDialogOffen}
        title="Knoten löschen?"
        description="Dieser Knoten und alle seine Kind-Knoten werden unwiderruflich gelöscht."
        confirmText="Löschen"
        destructive
        onConfirm={handleLoeschen}
      />
    </>
  );
}
