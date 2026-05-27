'use client';

import { useState } from 'react';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import {
  useConsultingFieldTypes,
  useUpdateConsultingFieldType,
  useCreateConsultingFieldType,
  useDeleteConsultingFieldType,
} from '@/hooks/use-consulting-field-types';
import type { ConsultingFieldType } from '@/types';

const BUILTIN_KEYS = new Set(['responsible', 'email', 'cost_monthly', 'notes']);

export function ConsultingFieldTypesSection(): React.JSX.Element {
  const { data: fieldTypes, isLoading } = useConsultingFieldTypes();
  const updateMutation = useUpdateConsultingFieldType();
  const createMutation = useCreateConsultingFieldType();
  const deleteMutation = useDeleteConsultingFieldType();

  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const handleToggleEnabled = async (ft: ConsultingFieldType): Promise<void> => {
    try {
      await updateMutation.mutateAsync({ id: ft.id, data: { is_enabled: !ft.is_enabled } });
    } catch {
      toast.error('Aktualisierung fehlgeschlagen');
    }
  };

  const handleSaveLabel = async (id: string): Promise<void> => {
    const trimmed = editDraft.trim();
    setEditingId(null);
    if (!trimmed) return;
    try {
      await updateMutation.mutateAsync({ id, data: { label: trimmed } });
    } catch {
      toast.error('Fehler beim Speichern');
    }
  };

  const handleCreate = async (): Promise<void> => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    const key = `custom_${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    try {
      await createMutation.mutateAsync({ key, label: trimmed });
      setNewLabel('');
      setAdding(false);
      toast.success('Feld hinzugefügt');
    } catch {
      toast.error('Anlegen fehlgeschlagen');
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await deleteMutation.mutateAsync(id);
      setPendingDelete(null);
      toast.success('Feld gelöscht');
    } catch {
      toast.error('Löschen fehlgeschlagen');
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#000000]">Checkpoint-Felder</h2>
          <p className="text-[11px] text-[#a3a3a3] mt-0.5">
            Welche Zusatzinfos pro Checkpoint erfasst werden können
          </p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Feld
        </Button>
      </div>

      {isLoading ? (
        <div className="h-24 rounded-xl border border-[#e5e5e5] bg-[#f5f5f5] animate-pulse" />
      ) : !fieldTypes || fieldTypes.length === 0 ? (
        <EmptyState title="Keine Felder" />
      ) : (
        <div className="rounded-xl border border-[#e5e5e5] divide-y divide-[#f0f0f0] overflow-hidden">
          {fieldTypes.map((ft) => (
            <div key={ft.id} className="flex items-center gap-3 px-4 py-2.5 bg-white">
              <GripVertical className="h-4 w-4 text-[#d4d4d4] shrink-0" />

              <input
                type="checkbox"
                checked={ft.is_enabled}
                onChange={() => void handleToggleEnabled(ft)}
                className="h-3.5 w-3.5 rounded border-[#d4d4d4] accent-black cursor-pointer shrink-0"
                title={ft.is_enabled ? 'Deaktivieren' : 'Aktivieren'}
              />

              {editingId === ft.id ? (
                <Input
                  autoFocus
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  onBlur={() => void handleSaveLabel(ft.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleSaveLabel(ft.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="h-7 text-xs flex-1"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditDraft(ft.label);
                    setEditingId(ft.id);
                  }}
                  className={`flex-1 text-left text-sm transition-colors cursor-text ${
                    ft.is_enabled ? 'text-[#000000]' : 'text-[#a3a3a3] line-through'
                  } hover:text-[#404040]`}
                >
                  {ft.label}
                </button>
              )}

              <span className="text-[10px] text-[#c0c0c0] font-mono shrink-0">{ft.key}</span>

              {!BUILTIN_KEYS.has(ft.key) && (
                <>
                  {pendingDelete === ft.id ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleDelete(ft.id)}
                        disabled={deleteMutation.isPending}
                        className="text-[10px] text-[#EF4444] font-medium hover:underline"
                      >
                        Löschen
                      </button>
                      <span className="text-[#c0c0c0] text-[10px]">·</span>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(null)}
                        className="text-[10px] text-[#a3a3a3] hover:underline"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPendingDelete(ft.id)}
                      className="p-1 rounded text-[#c0c0c0] hover:text-[#EF4444] transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}

          {adding && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-[#fafafa]">
              <div className="w-4 shrink-0" />
              <div className="w-3.5 shrink-0" />
              <Input
                autoFocus
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleCreate();
                  if (e.key === 'Escape') {
                    setAdding(false);
                    setNewLabel('');
                  }
                }}
                placeholder="Feldbezeichnung…"
                className="h-7 text-xs flex-1"
              />
              <Button
                size="sm"
                onClick={() => void handleCreate()}
                disabled={createMutation.isPending || !newLabel.trim()}
                className="h-7 text-xs px-3 shrink-0"
              >
                Hinzufügen
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAdding(false);
                  setNewLabel('');
                }}
                className="h-7 text-xs px-2 shrink-0"
              >
                Abbrechen
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
