'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2, Check, XIcon, Lock, Unlock, Eye, EyeOff, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SESSION_KEY = 'consulting_credentials_unlocked';
const MASTER_PASSWORD = 'admin';

interface Software {
  id: string;
  name: string;
  url: string | null;
  logo_url: string | null;
  price_monthly: number | null;
  username: string | null;
  password: string | null;
  notes: string | null;
  sort_order: number;
}

interface Props { companyId: string | undefined; companyName: string; onClose: () => void }
type FormData = { name: string; url: string; price_monthly: string; username: string; password: string; notes: string };
const emptyForm = (): FormData => ({ name: '', url: '', price_monthly: '', username: '', password: '', notes: '' });

function SoftwareLogo({ sw }: { sw: Software }): React.JSX.Element {
  const [clearbitErr, setClearbitErr] = useState(false);
  const [faviconErr, setFaviconErr] = useState(false);

  if (sw.logo_url && !clearbitErr) {
    return <img src={sw.logo_url} alt={sw.name} className="h-6 w-6 rounded-sm shrink-0 object-contain" onError={() => setClearbitErr(true)} />;
  }

  const domain = sw.url ? (() => { try { return new URL(sw.url!.startsWith('http') ? sw.url! : `https://${sw.url}`).hostname; } catch { return null; } })() : null;

  if (domain && !faviconErr) {
    const clearbitSrc = `https://logo.clearbit.com/${domain}`;
    return <img src={clearbitSrc} alt={sw.name} className="h-6 w-6 rounded-sm shrink-0 object-contain" onError={() => { setClearbitErr(true); setFaviconErr(false); }} />;
  }

  if (domain && clearbitErr && !faviconErr) {
    const faviconSrc = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
    return <img src={faviconSrc} alt={sw.name} className="h-5 w-5 rounded-sm shrink-0 object-contain" onError={() => setFaviconErr(true)} />;
  }

  return (
    <div className="h-6 w-6 rounded-sm shrink-0 bg-[#f0f0f0] flex items-center justify-center">
      <Globe className="h-3.5 w-3.5 text-[#c0c0c0]" />
    </div>
  );
}

export function ConsultingSoftwarePanel({ companyId, companyName, onClose }: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const [unlocked, setUnlocked] = useState(false);
  const [unlockInput, setUnlockInput] = useState('');
  const [showUnlockInput, setShowUnlockInput] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState<FormData>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormData>(emptyForm());
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => { if (typeof window !== 'undefined') setUnlocked(sessionStorage.getItem(SESSION_KEY) === '1'); }, []);

  const invalidate = (): void => { queryClient.invalidateQueries({ queryKey: ['consulting-software', companyId] }); };

  const { data: software = [], isLoading } = useQuery<Software[]>({
    queryKey: ['consulting-software', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/consulting/companies/${companyId}/software`);
      if (!res.ok) throw new Error('Fehler');
      return res.json();
    },
    enabled: Boolean(companyId),
    staleTime: 2 * 60_000,
  });

  const createM = useMutation({
    mutationFn: async (d: Omit<Software, 'id' | 'sort_order' | 'logo_url'>) => {
      const res = await fetch(`/api/consulting/companies/${companyId}/software`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
      if (!res.ok) throw new Error();
    },
    onSuccess: invalidate,
  });

  const updateM = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Software> }) => {
      const res = await fetch(`/api/consulting/companies/${companyId}/software/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error();
    },
    onSuccess: invalidate,
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/consulting/companies/${companyId}/software/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    },
    onSuccess: invalidate,
  });

  const handleUnlock = (): void => {
    if (unlockInput === MASTER_PASSWORD) { sessionStorage.setItem(SESSION_KEY, '1'); setUnlocked(true); setShowUnlockInput(false); setUnlockInput(''); }
    else toast.error('Falsches Passwort');
  };

  const formToPayload = (f: FormData) => ({
    name: f.name.trim(),
    url: f.url.trim() || null,
    price_monthly: f.price_monthly ? Number(f.price_monthly) : null,
    username: f.username.trim() || null,
    password: f.password.trim() || null,
    notes: f.notes.trim() || null,
  });

  const handleAdd = async (): Promise<void> => {
    if (!addForm.name.trim()) return;
    try {
      await createM.mutateAsync(formToPayload(addForm) as Omit<Software, 'id' | 'sort_order' | 'logo_url'>);
      setAdding(false); setAddForm(emptyForm()); toast.success('Hinzugefügt');
    } catch { toast.error('Anlegen fehlgeschlagen'); }
  };

  const handleUpdate = async (): Promise<void> => {
    if (!editingId || !editForm.name.trim()) return;
    try {
      await updateM.mutateAsync({ id: editingId, data: formToPayload(editForm) });
      setEditingId(null); toast.success('Gespeichert');
    } catch { toast.error('Speichern fehlgeschlagen'); }
  };

  const toggleShowPw = (id: string): void => setShowPasswords((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="flex flex-col rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
        <div>
          <h3 className="text-[13px] font-semibold text-[#000000]">Software</h3>
          <p className="text-[11px] text-[#a3a3a3]">{companyName}</p>
        </div>
        <div className="flex items-center gap-1">
          {unlocked
            ? <button type="button" onClick={() => { sessionStorage.removeItem(SESSION_KEY); setUnlocked(false); }} className="p-1.5 rounded text-[#22C55E] hover:bg-[#f5f5f5]" title="Sperren"><Unlock className="h-3.5 w-3.5" /></button>
            : <button type="button" onClick={() => setShowUnlockInput((v) => !v)} className="p-1.5 rounded text-[#a3a3a3] hover:text-[#000] hover:bg-[#f5f5f5]" title="Passwörter entsperren"><Lock className="h-3.5 w-3.5" /></button>
          }
          <button type="button" onClick={() => setAdding(true)} className="p-1.5 rounded text-[#a3a3a3] hover:text-[#000] hover:bg-[#f5f5f5]" title="Hinzufügen"><Plus className="h-4 w-4" /></button>
          <button type="button" onClick={onClose} className="p-1.5 rounded text-[#a3a3a3] hover:text-[#000] hover:bg-[#f5f5f5]"><X className="h-4 w-4" /></button>
        </div>
      </div>

      {showUnlockInput && !unlocked && (
        <div className="px-4 py-2 border-b border-[#f0f0f0] flex items-center gap-2 bg-[#fafafa]">
          <input autoFocus type="password" value={unlockInput} onChange={(e) => setUnlockInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock(); if (e.key === 'Escape') setShowUnlockInput(false); }} placeholder="Passwort…" className="flex-1 text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
          <button type="button" onClick={handleUnlock} className="text-[11px] font-medium text-white bg-[#000] rounded px-3 py-1">OK</button>
        </div>
      )}

      <div className="divide-y divide-[#f0f0f0]">
        {isLoading && <div className="px-4 py-3 text-[12px] text-[#a3a3a3]">Wird geladen…</div>}
        {!isLoading && software.length === 0 && !adding && (
          <div className="px-4 py-4 text-[12px] text-[#a3a3a3] text-center">Noch keine Software.</div>
        )}

        {software.map((sw) => (
          <div key={sw.id} className="px-4 py-2.5 group">
            {editingId === sw.id ? (
              <div className="flex flex-col gap-1.5">
                <input autoFocus value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name *" className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
                <input value={editForm.url} onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))} placeholder="URL" className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
                <input value={editForm.price_monthly} onChange={(e) => setEditForm((f) => ({ ...f, price_monthly: e.target.value }))} placeholder="Preis/Monat (€)" type="number" className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
                <input value={editForm.username} onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))} placeholder="Benutzername" className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
                <input value={editForm.password} onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))} placeholder="Passwort" type="text" className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
                <input value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notizen" className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => void handleUpdate()} className="p-1 rounded text-[#22C55E] hover:bg-green-50"><Check className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => setEditingId(null)} className="p-1 rounded text-[#a3a3a3] hover:bg-[#f5f5f5]"><XIcon className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5">
                <SoftwareLogo sw={sw} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13px] font-medium text-[#000]">{sw.name}</span>
                    {sw.price_monthly != null && sw.price_monthly > 0 && (
                      <span className="text-[11px] text-[#737373]">
                        {Number(sw.price_monthly).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}/Mo.
                      </span>
                    )}
                    {sw.url && (
                      <a href={sw.url.startsWith('http') ? sw.url : `https://${sw.url}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#3B82F6] hover:underline truncate">{sw.url.replace(/^https?:\/\//, '')}</a>
                    )}
                  </div>
                  {sw.username && <p className="text-[11px] text-[#737373] mt-0.5">{sw.username}</p>}
                  {sw.password && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[11px] font-mono text-[#404040]">{unlocked && showPasswords[sw.id] ? sw.password : '••••••••'}</span>
                      {unlocked && <button type="button" onClick={() => toggleShowPw(sw.id)} className="text-[#a3a3a3] hover:text-[#000]">{showPasswords[sw.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}</button>}
                    </div>
                  )}
                  {sw.notes && <p className="text-[11px] text-[#a3a3a3] mt-0.5">{sw.notes}</p>}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {confirmDelete === sw.id ? (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => void deleteM.mutateAsync(sw.id)} className="text-[10px] text-[#EF4444] font-medium hover:underline">Löschen</button>
                      <span className="text-[#c0c0c0] text-[10px]">·</span>
                      <button type="button" onClick={() => setConfirmDelete(null)} className="text-[10px] text-[#a3a3a3] hover:underline">Abbrechen</button>
                    </div>
                  ) : (
                    <>
                      <button type="button" onClick={() => { setEditForm({ name: sw.name, url: sw.url ?? '', price_monthly: sw.price_monthly != null ? String(sw.price_monthly) : '', username: sw.username ?? '', password: sw.password ?? '', notes: sw.notes ?? '' }); setEditingId(sw.id); }} className="p-1 rounded text-[#a3a3a3] hover:text-[#000] hover:bg-[#f5f5f5]"><Pencil className="h-3 w-3" /></button>
                      <button type="button" onClick={() => setConfirmDelete(sw.id)} className="p-1 rounded text-[#c0c0c0] hover:text-[#EF4444] hover:bg-red-50"><Trash2 className="h-3 w-3" /></button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {adding && (
          <div className="px-4 py-3 bg-[#fafafa] flex flex-col gap-1.5">
            <input autoFocus value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name *" className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
            <input value={addForm.url} onChange={(e) => setAddForm((f) => ({ ...f, url: e.target.value }))} placeholder="URL" className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
            <input value={addForm.price_monthly} onChange={(e) => setAddForm((f) => ({ ...f, price_monthly: e.target.value }))} placeholder="Preis/Monat (€)" type="number" className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
            <input value={addForm.username} onChange={(e) => setAddForm((f) => ({ ...f, username: e.target.value }))} placeholder="Benutzername" className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
            <input value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} placeholder="Passwort" type="text" onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd(); if (e.key === 'Escape') { setAdding(false); setAddForm(emptyForm()); } }} className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
            <input value={addForm.notes} onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notizen" className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => void handleAdd()} disabled={createM.isPending || !addForm.name.trim()} className="text-[12px] font-medium text-white bg-[#000] hover:bg-[#333] rounded px-3 py-1 disabled:opacity-50">Hinzufügen</button>
              <button type="button" onClick={() => { setAdding(false); setAddForm(emptyForm()); }} className="text-[12px] text-[#a3a3a3] hover:text-[#000] px-2 py-1">Abbrechen</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
