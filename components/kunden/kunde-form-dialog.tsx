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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateKunde, useUpdateKunde } from '@/hooks/use-kunden';
import { STATUS_OPTIONS } from './kunde-status-badge';
import type { Customer, CustomerStatus } from '@/types';

interface KundeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Falls gesetzt: Bearbeitungsmodus für den gegebenen Kunden. */
  kunde?: Customer | null;
}

interface FormState {
  firmenname: string;
  ansprechpartner: string;
  email: string;
  telefon: string;
  webseite: string;
  adresse: string;
  strasse: string;
  plz: string;
  ort: string;
  land: string;
  kundennummer: string;
  ust_id: string;
  steuernummer: string;
  zahlungsziel: string;
  status: CustomerStatus;
  notizen: string;
}

const emptyForm: FormState = {
  firmenname: '',
  ansprechpartner: '',
  email: '',
  telefon: '',
  webseite: '',
  adresse: '',
  strasse: '',
  plz: '',
  ort: '',
  land: '',
  kundennummer: '',
  ust_id: '',
  steuernummer: '',
  zahlungsziel: '',
  status: 'aktiv',
  notizen: '',
};

function ausKunde(k: Customer): FormState {
  return {
    firmenname: k.firmenname,
    ansprechpartner: k.ansprechpartner ?? '',
    email: k.email ?? '',
    telefon: k.telefon ?? '',
    webseite: k.webseite ?? '',
    adresse: k.adresse ?? '',
    strasse: k.strasse ?? '',
    plz: k.plz ?? '',
    ort: k.ort ?? '',
    land: k.land ?? '',
    kundennummer: k.kundennummer ?? '',
    ust_id: k.ust_id ?? '',
    steuernummer: k.steuernummer ?? '',
    zahlungsziel: k.zahlungsziel ?? '',
    status: k.status,
    notizen: k.notizen ?? '',
  };
}

export function KundeFormDialog({ open, onOpenChange, kunde }: KundeFormDialogProps): React.JSX.Element {
  const isEdit = !!kunde;
  const create = useCreateKunde();
  const update = useUpdateKunde();
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(kunde ? ausKunde(kunde) : emptyForm);
    }
  }, [open, kunde]);

  const onChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const t = (v: string): string | null => v.trim() || null;
    const payload = {
      firmenname: form.firmenname.trim(),
      ansprechpartner: t(form.ansprechpartner),
      email: t(form.email),
      telefon: t(form.telefon),
      webseite: t(form.webseite),
      adresse: t(form.adresse),
      strasse: t(form.strasse),
      plz: t(form.plz),
      ort: t(form.ort),
      land: t(form.land),
      kundennummer: t(form.kundennummer),
      ust_id: t(form.ust_id),
      steuernummer: t(form.steuernummer),
      zahlungsziel: t(form.zahlungsziel),
      status: form.status,
      notizen: t(form.notizen),
    };
    try {
      if (isEdit && kunde) {
        await update.mutateAsync({ id: kunde.id, updates: payload });
      } else {
        await create.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch {
      // Toasts werden vom Hook übernommen
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Kunde bearbeiten' : 'Neuen Kunden anlegen'}</DialogTitle>
            <DialogDescription>
              Je vollständiger die Daten, desto besser werden die erzeugten Dokumente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Firma + Status */}
            <div className="grid gap-2">
              <Label htmlFor="firmenname">
                Firmenname <span className="text-red-500">*</span>
              </Label>
              <Input id="firmenname" value={form.firmenname} onChange={onChange('firmenname')} required maxLength={200} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="ansprechpartner">Ansprechpartner</Label>
                <Input id="ansprechpartner" value={form.ansprechpartner} onChange={onChange('ansprechpartner')} maxLength={200} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={form.status} onValueChange={(v: CustomerStatus) => setForm((prev) => ({ ...prev, status: v }))}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Kontakt */}
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Kontakt</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" type="email" value={form.email} onChange={onChange('email')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefon">Telefon</Label>
                <Input id="telefon" value={form.telefon} onChange={onChange('telefon')} maxLength={40} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="webseite">Webseite</Label>
              <Input id="webseite" value={form.webseite} onChange={onChange('webseite')} maxLength={200} placeholder="https://…" />
            </div>

            {/* Adresse */}
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Adresse</p>
            <div className="grid gap-2">
              <Label htmlFor="strasse">Straße &amp; Hausnummer</Label>
              <Input id="strasse" value={form.strasse} onChange={onChange('strasse')} maxLength={200} />
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <div className="grid gap-2">
                <Label htmlFor="plz">PLZ</Label>
                <Input id="plz" value={form.plz} onChange={onChange('plz')} maxLength={20} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ort">Ort</Label>
                <Input id="ort" value={form.ort} onChange={onChange('ort')} maxLength={120} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="land">Land</Label>
              <Input id="land" value={form.land} onChange={onChange('land')} maxLength={120} placeholder="Deutschland" />
            </div>

            {/* Geschäftsdaten */}
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Geschäftsdaten</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="kundennummer">Kundennummer</Label>
                <Input id="kundennummer" value={form.kundennummer} onChange={onChange('kundennummer')} maxLength={60} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zahlungsziel">Zahlungsziel</Label>
                <Input id="zahlungsziel" value={form.zahlungsziel} onChange={onChange('zahlungsziel')} maxLength={120} placeholder="z.B. 14 Tage netto" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="ust_id">USt-IdNr.</Label>
                <Input id="ust_id" value={form.ust_id} onChange={onChange('ust_id')} maxLength={40} placeholder="DE…" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="steuernummer">Steuernummer</Label>
                <Input id="steuernummer" value={form.steuernummer} onChange={onChange('steuernummer')} maxLength={40} />
              </div>
            </div>

            {/* Freitext */}
            <div className="grid gap-2">
              <Label htmlFor="adresse">Adresse (Freitext, optional)</Label>
              <Textarea id="adresse" value={form.adresse} onChange={onChange('adresse')} rows={2} maxLength={500} placeholder="Falls du die Adresse lieber als Block pflegst" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notizen">Notizen</Label>
              <Textarea id="notizen" value={form.notizen} onChange={onChange('notizen')} rows={3} maxLength={5000} />
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isPending || form.firmenname.trim().length === 0}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Speichern' : 'Anlegen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
