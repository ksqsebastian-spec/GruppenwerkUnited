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
  adresse: string;
  status: CustomerStatus;
  notizen: string;
}

const emptyForm: FormState = {
  firmenname: '',
  ansprechpartner: '',
  email: '',
  telefon: '',
  adresse: '',
  status: 'aktiv',
  notizen: '',
};

export function KundeFormDialog({ open, onOpenChange, kunde }: KundeFormDialogProps): React.JSX.Element {
  const isEdit = !!kunde;
  const create = useCreateKunde();
  const update = useUpdateKunde();
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(
        kunde
          ? {
              firmenname: kunde.firmenname,
              ansprechpartner: kunde.ansprechpartner ?? '',
              email: kunde.email ?? '',
              telefon: kunde.telefon ?? '',
              adresse: kunde.adresse ?? '',
              status: kunde.status,
              notizen: kunde.notizen ?? '',
            }
          : emptyForm,
      );
    }
  }, [open, kunde]);

  const onChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const payload = {
      firmenname: form.firmenname.trim(),
      ansprechpartner: form.ansprechpartner.trim() || null,
      email: form.email.trim() || null,
      telefon: form.telefon.trim() || null,
      adresse: form.adresse.trim() || null,
      status: form.status,
      notizen: form.notizen.trim() || null,
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
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Kunde bearbeiten' : 'Neuen Kunden anlegen'}</DialogTitle>
            <DialogDescription>Stammdaten des Kunden pflegen.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
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
              <Label htmlFor="adresse">Adresse</Label>
              <Textarea id="adresse" value={form.adresse} onChange={onChange('adresse')} rows={2} maxLength={500} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notizen">Notizen</Label>
              <Textarea id="notizen" value={form.notizen} onChange={onChange('notizen')} rows={3} maxLength={5000} />
            </div>
          </div>

          <DialogFooter>
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
