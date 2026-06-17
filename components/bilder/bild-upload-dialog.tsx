'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Upload, X } from 'lucide-react';

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
import { FIRMEN_CONFIG, firmaBadgeClass } from '@/lib/tickets/firmen';
import { cn } from '@/lib/utils';
import { useUploadBild, useUploaderName } from '@/hooks/use-bilder';

interface BildUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  titel: string;
  beschreibung: string;
  firmen: string[];
  uploadedBy: string;
}

const empty: FormState = { titel: '', beschreibung: '', firmen: [], uploadedBy: '' };

export function BildUploadDialog({ open, onOpenChange }: BildUploadDialogProps): React.JSX.Element {
  const upload = useUploadBild();
  const [merkeName, setzeMerkeName] = useUploaderName();

  const [form, setForm] = useState<FormState>(empty);
  const [datei, setDatei] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm({ ...empty, uploadedBy: merkeName });
      setDatei(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open, merkeName]);

  // Object-URL für die Vorschau erzeugen + bei Wechsel/Schluss wieder freigeben
  useEffect(() => {
    if (!datei) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(datei);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [datei]);

  const toggleFirma = (slug: string): void => {
    setForm((p) => ({
      ...p,
      firmen: p.firmen.includes(slug) ? p.firmen.filter((s) => s !== slug) : [...p.firmen, slug],
    }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!datei) return;
    try {
      await upload.mutateAsync({
        file: datei,
        titel: form.titel.trim(),
        beschreibung: form.beschreibung.trim(),
        firmen_tags: form.firmen,
        uploaded_by: form.uploadedBy.trim(),
      });
      setzeMerkeName(form.uploadedBy.trim());
      onOpenChange(false);
    } catch {
      // Toast vom Hook
    }
  };

  const isPending = upload.isPending;
  const valid =
    datei !== null &&
    form.uploadedBy.trim().length > 0 &&
    form.firmen.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5" /> Bild hochladen
            </DialogTitle>
            <DialogDescription>
              JPG, PNG, WebP, GIF oder SVG · max. 20 MB. Wähle mindestens eine Firma, damit andere
              dein Bild über den Filter wiederfinden.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Datei-Auswahl + Vorschau */}
            <div>
              <Label className="text-sm font-medium">Bild</Label>
              {preview ? (
                <div className="mt-2 flex flex-col gap-2">
                  <div className="relative overflow-hidden rounded-lg border border-border bg-muted/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Vorschau"
                      className="max-h-72 w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setDatei(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                      aria-label="Bild entfernen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {datei?.name} ({((datei?.size ?? 0) / 1024).toFixed(0)} KB)
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/20 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <Upload className="h-6 w-6" />
                  Datei auswählen
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={(e) => setDatei(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* Titel / Beschreibung */}
            <div className="grid gap-2">
              <Label htmlFor="bild-titel">Titel (optional)</Label>
              <Input
                id="bild-titel"
                value={form.titel}
                onChange={(e) => setForm((p) => ({ ...p, titel: e.target.value }))}
                maxLength={200}
                placeholder="z.B. Logo, Produktfoto, Team-Bild …"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bild-beschreibung">Beschreibung (optional)</Label>
              <Textarea
                id="bild-beschreibung"
                value={form.beschreibung}
                onChange={(e) => setForm((p) => ({ ...p, beschreibung: e.target.value }))}
                rows={2}
                maxLength={1000}
              />
            </div>

            {/* Firmen-Tags */}
            <div>
              <Label className="text-sm font-medium">
                Firmen-Tags <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Zu welcher Firma gehört das Bild? Mehrfachauswahl möglich.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {FIRMEN_CONFIG.map((f) => {
                  const aktiv = form.firmen.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFirma(f.id)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                        aktiv
                          ? firmaBadgeClass(f.id)
                          : 'border-[#e5e5e5] bg-white text-[#525252] hover:border-[#a3a3a3]',
                      )}
                    >
                      {f.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Uploader-Name */}
            <div className="grid gap-2">
              <Label htmlFor="bild-by">
                Hochgeladen von <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bild-by"
                value={form.uploadedBy}
                onChange={(e) => setForm((p) => ({ ...p, uploadedBy: e.target.value }))}
                maxLength={120}
                placeholder="Dein Name"
                required
              />
              <p className="text-xs text-muted-foreground">
                Wird einmalig gemerkt — beim nächsten Upload steht dein Name schon im Feld.
              </p>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 border-t bg-background pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isPending || !valid}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hochladen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
