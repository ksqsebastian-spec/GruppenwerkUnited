'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, Plus, Check, X as XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCategoryColor } from '@/lib/consulting-colors';
import type { ConsultingCategoryWithCheckpointsList } from '@/types';

interface Props {
  category: ConsultingCategoryWithCheckpointsList;
  colorIndex: number;
}

export function ConsultingSettingsCategoryRow({
  category,
  colorIndex,
}: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(category.name);
  const [confirmDeleteSelf, setConfirmDeleteSelf] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [pendingDeleteCp, setPendingDeleteCp] = useState<string | null>(null);
  const [editingCp, setEditingCp] = useState<string | null>(null);
  const [cpDraft, setCpDraft] = useState('');

  const invalidate = (): Promise<void> =>
    queryClient.invalidateQueries({ queryKey: ['consulting-categories-settings'] });

  const updateName = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/consulting/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Fehler');
    },
    onSuccess: () => void invalidate(),
  });

  const deleteSelf = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/consulting/categories/${category.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler');
    },
    onSuccess: () => void invalidate(),
  });

  const addCheckpoint = useMutation({
    mutationFn: async (label: string) => {
      const res = await fetch('/api/consulting/checkpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: category.id, label, apply_to_all: true }),
      });
      if (!res.ok) throw new Error('Fehler');
    },
    onSuccess: () => void invalidate(),
  });

  const deleteCheckpoint = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/consulting/checkpoints/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler');
    },
    onSuccess: () => void invalidate(),
  });

  const updateCheckpoint = useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string }) => {
      const res = await fetch(`/api/consulting/checkpoints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) throw new Error('Fehler');
    },
    onSuccess: () => void invalidate(),
  });

  const handleSaveName = async (): Promise<void> => {
    const trimmed = nameDraft.trim();
    setEditingName(false);
    if (!trimmed || trimmed === category.name) return;
    try {
      await updateName.mutateAsync(trimmed);
      toast.success('Name gespeichert');
    } catch {
      toast.error('Fehler beim Speichern');
      setNameDraft(category.name);
    }
  };

  const handleAddCheckpoint = async (): Promise<void> => {
    if (!newLabel.trim()) return;
    try {
      await addCheckpoint.mutateAsync(newLabel.trim());
      setNewLabel('');
      setAdding(false);
      toast.success('Punkt hinzugefügt');
    } catch {
      toast.error('Fehler beim Hinzufügen');
    }
  };

  const handleDeleteCheckpoint = async (id: string): Promise<void> => {
    try {
      await deleteCheckpoint.mutateAsync(id);
      setPendingDeleteCp(null);
      toast.success('Punkt gelöscht');
    } catch {
      toast.error('Löschen fehlgeschlagen');
    }
  };

  const handleSaveCp = async (id: string): Promise<void> => {
    const trimmed = cpDraft.trim();
    setEditingCp(null);
    if (!trimmed) return;
    try {
      await updateCheckpoint.mutateAsync({ id, label: trimmed });
    } catch {
      toast.error('Fehler beim Speichern');
    }
  };

  const color = getCategoryColor(colorIndex);

  return (
    <div className="rounded-xl border border-[#e5e5e5] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-white">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="p-0.5 text-[#a3a3a3] hover:text-[#000000] transition-colors"
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <span className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />

        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveName();
                if (e.key === 'Escape') {
                  setNameDraft(category.name);
                  setEditingName(false);
                }
              }}
              className="h-7 text-xs flex-1"
            />
            <button
              type="button"
              onClick={() => void handleSaveName()}
              className="p-1 rounded text-[#22C55E] hover:bg-green-50 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setNameDraft(category.name);
                setEditingName(false);
              }}
              className="p-1 rounded text-[#a3a3a3] hover:bg-[#f5f5f5] transition-colors"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setNameDraft(category.name);
              setEditingName(true);
            }}
            className="flex-1 text-left text-sm font-medium text-[#000000] hover:text-[#404040] transition-colors"
          >
            {category.name}
          </button>
        )}

        <span className="text-xs text-[#a3a3a3] tabular-nums shrink-0">
          {category.consulting_checkpoints.length}
        </span>

        {confirmDeleteSelf ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => void deleteSelf.mutateAsync()}
              disabled={deleteSelf.isPending}
              className="h-7 text-xs"
            >
              Löschen
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDeleteSelf(false)}
              className="h-7 text-xs"
            >
              Abbrechen
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDeleteSelf(true)}
            className="text-[#c0c0c0] hover:text-[#EF4444] transition-colors p-1 rounded"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="border-t border-[#f0f0f0]">
          {category.consulting_checkpoints.length === 0 ? (
            <p className="px-8 py-2.5 text-[12px] text-[#a3a3a3] italic">Keine Punkte.</p>
          ) : (
            <div className="divide-y divide-[#f8f8f8]">
              {category.consulting_checkpoints.map((cp) => (
                <div key={cp.id} className="group flex items-center gap-3 px-8 py-2 hover:bg-[#fafafa]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d4d4d4] shrink-0" />

                  {editingCp === cp.id ? (
                    <Input
                      autoFocus
                      value={cpDraft}
                      onChange={(e) => setCpDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleSaveCp(cp.id);
                        if (e.key === 'Escape') setEditingCp(null);
                      }}
                      onBlur={() => void handleSaveCp(cp.id)}
                      className="h-6 text-xs flex-1"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setCpDraft(cp.label);
                        setEditingCp(cp.id);
                      }}
                      className="flex-1 text-left text-[12px] text-[#404040] hover:text-[#000000] transition-colors cursor-text"
                    >
                      {cp.label}
                    </button>
                  )}

                  {pendingDeleteCp === cp.id ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleDeleteCheckpoint(cp.id)}
                        disabled={deleteCheckpoint.isPending}
                        className="text-[10px] text-[#EF4444] font-medium hover:underline"
                      >
                        Löschen
                      </button>
                      <span className="text-[#c0c0c0] text-[10px]">·</span>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteCp(null)}
                        className="text-[10px] text-[#a3a3a3] hover:underline"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPendingDeleteCp(cp.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#c0c0c0] hover:text-[#EF4444] transition-all shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="px-8 py-2.5 border-t border-[#f8f8f8]">
            {adding ? (
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleAddCheckpoint();
                    if (e.key === 'Escape') {
                      setAdding(false);
                      setNewLabel('');
                    }
                  }}
                  placeholder="Bezeichnung…"
                  className="h-7 text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => void handleAddCheckpoint()}
                  disabled={addCheckpoint.isPending || !newLabel.trim()}
                  className="h-7 text-xs px-3"
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
                  className="h-7 text-xs px-2"
                >
                  Abbrechen
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex items-center gap-1 text-[11px] text-[#a3a3a3] hover:text-[#000000] transition-colors"
              >
                <Plus className="h-3 w-3" />
                Punkt hinzufügen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
