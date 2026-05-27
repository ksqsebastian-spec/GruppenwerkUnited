'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2, Check, XIcon, Lock, Unlock, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SESSION_KEY = 'consulting_credentials_unlocked';
const MASTER_PASSWORD = 'admin';

const PLATFORMS: { value: string; label: string; domain: string }[] = [
  { value: 'website',   label: 'Website',              domain: '' },
  { value: 'instagram', label: 'Instagram',            domain: 'instagram.com' },
  { value: 'twitter',   label: 'Twitter / X',          domain: 'x.com' },
  { value: 'facebook',  label: 'Facebook',             domain: 'facebook.com' },
  { value: 'linkedin',  label: 'LinkedIn',             domain: 'linkedin.com' },
  { value: 'youtube',   label: 'YouTube',              domain: 'youtube.com' },
  { value: 'tiktok',    label: 'TikTok',               domain: 'tiktok.com' },
  { value: 'pinterest', label: 'Pinterest',            domain: 'pinterest.com' },
  { value: 'xing',      label: 'Xing',                 domain: 'xing.com' },
  { value: 'kununu',    label: 'kununu',               domain: 'kununu.com' },
  { value: 'google',    label: 'Google',               domain: 'google.com' },
  { value: 'gtm',       label: 'Google Tag Manager',   domain: 'tagmanager.google.com' },
  { value: 'ga',        label: 'Google Analytics',     domain: 'analytics.google.com' },
  { value: 'gsc',       label: 'Google Search Console',domain: 'search.google.com' },
  { value: 'other',     label: 'Sonstiges',            domain: '' },
];

function getPlatformDomain(platform: string, url: string | null): string {
  const p = PLATFORMS.find((p) => p.value === platform);
  if (p?.domain) return p.domain;
  if (url) {
    try { return new URL(url.startsWith('http') ? url : `https://${url}`).hostname; } catch { return ''; }
  }
  return '';
}

function PlatformIcon({ platform, url }: { platform: string; url: string | null }): React.JSX.Element {
  const [err, setErr] = useState(false);
  const domain = getPlatformDomain(platform, url);
  const src = domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32` : null;
  if (!src || err) {
    return <span className="h-5 w-5 rounded-sm bg-[#e5e5e5] text-[9px] font-bold text-[#737373] flex items-center justify-center shrink-0">{(PLATFORMS.find(p => p.value === platform)?.label ?? platform).slice(0, 2).toUpperCase()}</span>;
  }
  return <img src={src} alt={platform} className="h-5 w-5 rounded-sm shrink-0 object-contain" onError={() => setErr(true)} />;
}

interface Social { id: string; platform: string; url: string | null; email: string | null; password: string | null; sort_order: number }
interface Props { companyId: string | undefined; companyName: string; onClose: () => void }
type FormData = { platform: string; url: string; email: string; password: string };
const emptyForm = (): FormData => ({ platform: 'website', url: '', email: '', password: '' });

export function ConsultingSocialsPanel({ companyId, companyName, onClose }: Props): React.JSX.Element {
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

  const invalidate = (): void => { queryClient.invalidateQueries({ queryKey: ['consulting-socials', companyId] }); };

  const { data: socials = [], isLoading } = useQuery<Social[]>({
    queryKey: ['consulting-socials', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/consulting/companies/${companyId}/socials`);
      if (!res.ok) throw new Error('Fehler');
      return res.json();
    },
    enabled: Boolean(companyId),
    staleTime: 2 * 60_000,
  });

  const createM = useMutation({ mutationFn: async (d: Omit<Social, 'id' | 'sort_order'>) => { const res = await fetch(`/api/consulting/companies/${companyId}/socials`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }); if (!res.ok) throw new Error(); }, onSuccess: invalidate });
  const updateM = useMutation({ mutationFn: async ({ id, data }: { id: string; data: Partial<Social> }) => { const res = await fetch(`/api/consulting/companies/${companyId}/socials/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!res.ok) throw new Error(); }, onSuccess: invalidate });
  const deleteM = useMutation({ mutationFn: async (id: string) => { const res = await fetch(`/api/consulting/companies/${companyId}/socials/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error(); }, onSuccess: invalidate });

  const handleUnlock = (): void => {
    if (unlockInput === MASTER_PASSWORD) { sessionStorage.setItem(SESSION_KEY, '1'); setUnlocked(true); setShowUnlockInput(false); setUnlockInput(''); }
    else toast.error('Falsches Passwort');
  };

  const handleAdd = async (): Promise<void> => {
    if (!addForm.platform) return;
    try {
      await createM.mutateAsync({ platform: addForm.platform, url: addForm.url.trim() || null, email: addForm.email.trim() || null, password: addForm.password.trim() || null });
      setAdding(false); setAddForm(emptyForm()); toast.success('Hinzugefügt');
    } catch { toast.error('Anlegen fehlgeschlagen'); }
  };

  const handleUpdate = async (): Promise<void> => {
    if (!editingId) return;
    try {
      await updateM.mutateAsync({ id: editingId, data: { platform: editForm.platform, url: editForm.url.trim() || null, email: editForm.email.trim() || null, password: editForm.password.trim() || null } });
      setEditingId(null); toast.success('Gespeichert');
    } catch { toast.error('Speichern fehlgeschlagen'); }
  };

  const toggleShowPw = (id: string): void => setShowPasswords((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="flex flex-col rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
        <div>
          <h3 className="text-[13px] font-semibold text-[#000000]">Web</h3>
          <p className="text-[11px] text-[#a3a3a3]">{companyName}</p>
        </div>
        <div className="flex items-center gap-1">
          {unlocked
            ? <button type="button" onClick={() => { sessionStorage.removeItem(SESSION_KEY); setUnlocked(false); }} className="p-1.5 rounded text-[#22C55E] hover:bg-[#f5f5f5] transition-colors" title="Sperren"><Unlock className="h-3.5 w-3.5" /></button>
            : <button type="button" onClick={() => setShowUnlockInput((v) => !v)} className="p-1.5 rounded text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f5f5f5] transition-colors" title="Passwörter entsperren"><Lock className="h-3.5 w-3.5" /></button>
          }
          <button type="button" onClick={() => setAdding(true)} className="p-1.5 rounded text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f5f5f5] transition-colors" title="Hinzufügen"><Plus className="h-4 w-4" /></button>
          <button type="button" onClick={onClose} className="p-1.5 rounded text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f5f5f5] transition-colors"><X className="h-4 w-4" /></button>
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
        {!isLoading && socials.length === 0 && !adding && (
          <div className="px-4 py-4 text-[12px] text-[#a3a3a3] text-center">Noch keine Web-Einträge.</div>
        )}

        {socials.map((s) => (
          <div key={s.id} className="px-4 py-2.5 group">
            {editingId === s.id ? (
              <div className="flex flex-col gap-1.5">
                <select value={editForm.platform} onChange={(e) => setEditForm((f) => ({ ...f, platform: e.target.value }))} className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 bg-white">
                  {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <input value={editForm.url} onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))} placeholder="URL" className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
                <input value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} placeholder="E-Mail" className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
                <input value={editForm.password} onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))} placeholder="Passwort" type="text" className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => void handleUpdate()} className="p-1 rounded text-[#22C55E] hover:bg-green-50"><Check className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => setEditingId(null)} className="p-1 rounded text-[#a3a3a3] hover:bg-[#f5f5f5]"><XIcon className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5">
                <PlatformIcon platform={s.platform} url={s.url} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-medium text-[#000]">{PLATFORMS.find(p => p.value === s.platform)?.label ?? s.platform}</span>
                    {s.url && <a href={s.url.startsWith('http') ? s.url : `https://${s.url}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#a3a3a3] hover:text-[#3B82F6] transition-colors"><ExternalLink className="h-3 w-3" /></a>}
                  </div>
                  {s.url && <p className="text-[11px] text-[#3B82F6] truncate">{s.url.replace(/^https?:\/\//, '')}</p>}
                  {s.email && <p className="text-[11px] text-[#737373] mt-0.5">{s.email}</p>}
                  {s.password && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[11px] font-mono text-[#404040]">{unlocked && showPasswords[s.id] ? s.password : '••••••••'}</span>
                      {unlocked && <button type="button" onClick={() => toggleShowPw(s.id)} className="text-[#a3a3a3] hover:text-[#000]">{showPasswords[s.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}</button>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {confirmDelete === s.id ? (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => void deleteM.mutateAsync(s.id)} className="text-[10px] text-[#EF4444] font-medium hover:underline">Löschen</button>
                      <span className="text-[#c0c0c0] text-[10px]">·</span>
                      <button type="button" onClick={() => setConfirmDelete(null)} className="text-[10px] text-[#a3a3a3] hover:underline">Abbrechen</button>
                    </div>
                  ) : (
                    <>
                      <button type="button" onClick={() => { setEditForm({ platform: s.platform, url: s.url ?? '', email: s.email ?? '', password: s.password ?? '' }); setEditingId(s.id); }} className="p-1 rounded text-[#a3a3a3] hover:text-[#000] hover:bg-[#f5f5f5]"><Pencil className="h-3 w-3" /></button>
                      <button type="button" onClick={() => setConfirmDelete(s.id)} className="p-1 rounded text-[#c0c0c0] hover:text-[#EF4444] hover:bg-red-50"><Trash2 className="h-3 w-3" /></button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {adding && (
          <div className="px-4 py-3 bg-[#fafafa] flex flex-col gap-1.5">
            <select autoFocus value={addForm.platform} onChange={(e) => setAddForm((f) => ({ ...f, platform: e.target.value }))} className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 bg-white">
              {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <input value={addForm.url} onChange={(e) => setAddForm((f) => ({ ...f, url: e.target.value }))} placeholder="URL" className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
            <input value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} placeholder="E-Mail (optional)" className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
            <input value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} placeholder="Passwort (optional)" type="text" onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd(); if (e.key === 'Escape') { setAdding(false); setAddForm(emptyForm()); } }} className="text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000]" />
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => void handleAdd()} disabled={createM.isPending} className="text-[12px] font-medium text-white bg-[#000] hover:bg-[#333] rounded px-3 py-1 disabled:opacity-50">Hinzufügen</button>
              <button type="button" onClick={() => { setAdding(false); setAddForm(emptyForm()); }} className="text-[12px] text-[#a3a3a3] hover:text-[#000] px-2 py-1">Abbrechen</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
