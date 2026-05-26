'use client';

import { useState, useEffect } from 'react';
import { Plus, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { ConsultingCredentialRow } from './consulting-credential-row';
import {
  useConsultingCredentials,
  useCreateConsultingCredential,
  useUpdateConsultingCredential,
  useDeleteConsultingCredential,
} from '@/hooks/use-consulting-credentials';
import type { ConsultingCredential } from '@/types';

const MASTER_PASSWORD = 'admin';
const SESSION_KEY = 'consulting_credentials_unlocked';

interface Props {
  companyId: string | undefined;
}

type FormData = Omit<ConsultingCredential, 'id' | 'created_at' | 'updated_at' | 'company_id'>;

const emptyForm = (): FormData => ({
  title: '',
  url: null,
  logo_url: null,
  username: null,
  password: null,
  cost_monthly: null,
  notes: null,
  sort_order: 99,
});

export function ConsultingCredentialsTab({ companyId }: Props): React.JSX.Element {
  const { data: credentials, isLoading } = useConsultingCredentials(companyId);
  const createMutation = useCreateConsultingCredential(companyId);
  const updateMutation = useUpdateConsultingCredential(companyId);
  const deleteMutation = useDeleteConsultingCredential(companyId);

  const [unlocked, setUnlocked] = useState(false);
  const [unlockInput, setUnlockInput] = useState('');
  const [showUnlockInput, setShowUnlockInput] = useState(false);
  const [showPwField, setShowPwField] = useState(false);

  const [dialog, setDialog] = useState<{ open: boolean; editing: ConsultingCredential | null }>({
    open: false,
    editing: null,
  });
  const [form, setForm] = useState<FormData>(emptyForm());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUnlocked(sessionStorage.getItem(SESSION_KEY) === '1');
    }
  }, []);

  const handleUnlock = (): void => {
    if (unlockInput === MASTER_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setUnlocked(true);
      setShowUnlockInput(false);
      setUnlockInput('');
    } else {
      toast.error('Falsches Passwort');
    }
  };

  const handleLock = (): void => {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
  };

  const openAdd = (): void => {
    setForm(emptyForm());
    setShowPwField(false);
    setDialog({ open: true, editing: null });
  };

  const openEdit = (cred: ConsultingCredential): void => {
    setForm({
      title: cred.title,
      url: cred.url,
      logo_url: cred.logo_url,
      username: cred.username,
      password: cred.password,
      cost_monthly: cred.cost_monthly,
      notes: cred.notes,
      sort_order: cred.sort_order,
    });
    setShowPwField(false);
    setDialog({ open: true, editing: cred });
  };

  const handleSave = async (): Promise<void> => {
    if (!form.title.trim() || !companyId) return;
    try {
      if (dialog.editing) {
        await updateMutation.mutateAsync({ id: dialog.editing.id, data: form });
        toast.success('Gespeichert');
      } else {
        await createMutation.mutateAsync({ ...form, company_id: companyId });
        toast.success('Zugangsdaten angelegt');
      }
      setDialog({ open: false, editing: null });
    } catch {
      toast.error('Speichern fehlgeschlagen');
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Gelöscht');
    } catch {
      toast.error('Löschen fehlgeschlagen');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {unlocked ? (
          <button
            type="button"
            onClick={handleLock}
            className="flex items-center gap-1.5 text-[12px] text-[#22C55E] hover:text-[#16A34A] transition-colors"
          >
            <Unlock className="h-3.5 w-3.5" />
            Entsperrt
          </button>
        ) : showUnlockInput ? (
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              type="password"
              value={unlockInput}
              onChange={(e) => setUnlockInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUnlock();
                if (e.key === 'Escape') setShowUnlockInput(false);
              }}
              placeholder="Passwort…"
              className="h-7 text-xs w-32"
            />
            <Button size="sm" onClick={handleUnlock} className="h-7 text-xs px-3">
              Entsperren
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowUnlockInput(false)} className="h-7 text-xs px-2">
              Abbrechen
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowUnlockInput(true)}
            className="flex items-center gap-1.5 text-[12px] text-[#a3a3a3] hover:text-[#000000] transition-colors"
          >
            <Lock className="h-3.5 w-3.5" />
            Gesperrt
          </button>
        )}
        <div className="ml-auto">
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Zugangsdaten
          </Button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="h-24 rounded-xl border border-[#e5e5e5] bg-[#f5f5f5] animate-pulse" />
      ) : !credentials || credentials.length === 0 ? (
        <EmptyState
          title="Keine Zugangsdaten"
          description="Lege Zugangsdaten für Websites, E-Mail-Konten und weitere Dienste an."
          action={<Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Zugangsdaten anlegen</Button>}
        />
      ) : (
        <div className="rounded-xl border border-[#e5e5e5] overflow-hidden">
          {credentials.map((cred) => (
            <ConsultingCredentialRow
              key={cred.id}
              credential={cred}
              unlocked={unlocked}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialog.open} onOpenChange={(o) => !o && setDialog({ open: false, editing: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.editing ? 'Zugangsdaten bearbeiten' : 'Neue Zugangsdaten'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cred-title">Bezeichnung *</Label>
                <Input id="cred-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="z.B. Google Business" autoFocus />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cred-url">URL</Label>
                <Input id="cred-url" value={form.url ?? ''} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value || null }))} placeholder="https://..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cred-user">Benutzername / E-Mail</Label>
                <Input id="cred-user" value={form.username ?? ''} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value || null }))} placeholder="user@example.com" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cred-pw">Passwort</Label>
                <div className="flex gap-1.5">
                  <Input id="cred-pw" type={showPwField ? 'text' : 'password'} value={form.password ?? ''} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value || null }))} placeholder="••••••••" className="flex-1" />
                  <button type="button" onClick={() => setShowPwField((v) => !v)} className="p-2 rounded border border-[#e5e5e5] text-[#a3a3a3] hover:text-[#000000] transition-colors">
                    {showPwField ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cred-cost">Kosten/Monat (€)</Label>
                <Input id="cred-cost" type="number" value={form.cost_monthly ?? ''} onChange={(e) => setForm((f) => ({ ...f, cost_monthly: e.target.value ? Number(e.target.value) : null }))} placeholder="0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cred-notes">Notizen</Label>
                <Input id="cred-notes" value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))} placeholder="Optional…" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false, editing: null })}>Abbrechen</Button>
            <Button onClick={() => void handleSave()} disabled={isPending || !form.title.trim()}>
              {isPending ? 'Wird gespeichert…' : dialog.editing ? 'Speichern' : 'Anlegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
