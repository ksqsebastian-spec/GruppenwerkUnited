'use client';

import { useState } from 'react';
import { X, Plus, Pencil, Trash2, Check, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useConsultingContacts,
  useCreateConsultingContact,
  useUpdateConsultingContact,
  useDeleteConsultingContact,
} from '@/hooks/use-consulting-contacts';
import type { ConsultingContact } from '@/types';

interface Props {
  companyId: string | undefined;
  companyName: string;
  onClose: () => void;
}

type ContactForm = { name: string; role: string; email: string; phone: string };
const emptyForm = (): ContactForm => ({ name: '', role: '', email: '', phone: '' });

function toForm(c: ConsultingContact): ContactForm {
  return { name: c.name, role: c.role ?? '', email: c.email ?? '', phone: c.phone ?? '' };
}

export function ConsultingContactsPanel({ companyId, companyName, onClose }: Props): React.JSX.Element {
  const { data: contacts, isLoading } = useConsultingContacts(companyId);
  const createMutation = useCreateConsultingContact(companyId);
  const updateMutation = useUpdateConsultingContact(companyId);
  const deleteMutation = useDeleteConsultingContact(companyId);

  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState<ContactForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ContactForm>(emptyForm());
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const handleAdd = async (): Promise<void> => {
    if (!addForm.name.trim() || !companyId) return;
    try {
      await createMutation.mutateAsync({
        company_id: companyId,
        name: addForm.name.trim(),
        role: addForm.role.trim() || null,
        email: addForm.email.trim() || null,
        phone: addForm.phone.trim() || null,
        sort_order: (contacts?.length ?? 0) + 1,
      });
      setAddForm(emptyForm());
      setAdding(false);
      toast.success('Ansprechpartner hinzugefügt');
    } catch {
      toast.error('Anlegen fehlgeschlagen');
    }
  };

  const handleUpdate = async (): Promise<void> => {
    if (!editingId || !editForm.name.trim()) return;
    try {
      await updateMutation.mutateAsync({
        id: editingId,
        data: {
          name: editForm.name.trim(),
          role: editForm.role.trim() || null,
          email: editForm.email.trim() || null,
          phone: editForm.phone.trim() || null,
        },
      });
      setEditingId(null);
    } catch {
      toast.error('Aktualisierung fehlgeschlagen');
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await deleteMutation.mutateAsync(id);
      setPendingDelete(null);
    } catch {
      toast.error('Löschen fehlgeschlagen');
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
        <div>
          <h3 className="text-[13px] font-semibold text-[#000000]">Ansprechpartner</h3>
          <p className="text-[11px] text-[#a3a3a3]">{companyName}</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setAdding(true)} className="p-1.5 rounded text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f5f5f5] transition-colors" title="Hinzufügen">
            <Plus className="h-4 w-4" />
          </button>
          <button type="button" onClick={onClose} className="p-1.5 rounded text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f5f5f5] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-[#f0f0f0]">
        {isLoading && (
          <div className="px-4 py-3 text-[12px] text-[#a3a3a3]">Wird geladen…</div>
        )}

        {!isLoading && (!contacts || contacts.length === 0) && !adding && (
          <div className="px-4 py-4 text-[12px] text-[#a3a3a3] text-center">
            Noch keine Ansprechpartner.
          </div>
        )}

        {(contacts ?? []).map((ct) => (
          <div key={ct.id} className="px-4 py-3 group">
            {editingId === ct.id ? (
              <div className="flex flex-col gap-1.5">
                <Input autoFocus value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name *" className="h-7 text-xs" />
                <Input value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))} placeholder="Rolle / Position" className="h-7 text-xs" />
                <Input value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} placeholder="E-Mail" className="h-7 text-xs" />
                <Input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Telefon" className="h-7 text-xs" />
                <div className="flex gap-2 mt-1">
                  <button type="button" onClick={() => void handleUpdate()} className="p-1 rounded text-[#22C55E] hover:bg-green-50 transition-colors">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="p-1 rounded text-[#a3a3a3] hover:bg-[#f5f5f5] transition-colors">
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#000000] leading-tight">{ct.name}</p>
                  {ct.role && <p className="text-[11px] text-[#737373] mt-0.5">{ct.role}</p>}
                  {ct.email && (
                    <a href={`mailto:${ct.email}`} className="text-[11px] text-[#3B82F6] hover:underline mt-0.5 block truncate">
                      {ct.email}
                    </a>
                  )}
                  {ct.phone && (
                    <a href={`tel:${ct.phone}`} className="text-[11px] text-[#737373] hover:text-[#000000] mt-0.5 block transition-colors">
                      {ct.phone}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {pendingDelete === ct.id ? (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => void handleDelete(ct.id)} disabled={deleteMutation.isPending} className="text-[10px] text-[#EF4444] font-medium hover:underline">
                        Löschen
                      </button>
                      <span className="text-[#c0c0c0] text-[10px]">·</span>
                      <button type="button" onClick={() => setPendingDelete(null)} className="text-[10px] text-[#a3a3a3] hover:underline">Abbrechen</button>
                    </div>
                  ) : (
                    <>
                      <button type="button" onClick={() => { setEditForm(toForm(ct)); setEditingId(ct.id); }} className="p-1 rounded text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f5f5f5] transition-colors">
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button type="button" onClick={() => setPendingDelete(ct.id)} className="p-1 rounded text-[#c0c0c0] hover:text-[#EF4444] hover:bg-red-50 transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {adding && (
          <div className="px-4 py-3 bg-[#fafafa] flex flex-col gap-1.5">
            <Input autoFocus value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd(); if (e.key === 'Escape') { setAdding(false); setAddForm(emptyForm()); } }} placeholder="Name *" className="h-7 text-xs" />
            <Input value={addForm.role} onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))} placeholder="Rolle / Position" className="h-7 text-xs" />
            <Input value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} placeholder="E-Mail" className="h-7 text-xs" />
            <Input value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Telefon" className="h-7 text-xs" />
            <div className="flex gap-2 mt-1">
              <Button size="sm" onClick={() => void handleAdd()} disabled={createMutation.isPending || !addForm.name.trim()} className="h-7 text-xs px-3">Hinzufügen</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setAddForm(emptyForm()); }} className="h-7 text-xs px-2">Abbrechen</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
