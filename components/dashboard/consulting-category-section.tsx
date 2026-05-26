'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConsultingStatusBadge } from './consulting-status-badge';
import { ConsultingCheckpointRow } from './consulting-checkpoint-row';
import { useDeleteConsultingCheckpoint, useCreateConsultingCheckpoint } from '@/hooks/use-consulting-company';
import { getCategoryColor } from '@/lib/consulting-colors';
import type { ConsultingCategoryWithCheckpoints } from '@/types';

interface ConsultingCategorySectionProps {
  category: ConsultingCategoryWithCheckpoints;
  companySlug: string;
  colorIndex: number;
  defaultOpen?: boolean;
}

export function ConsultingCategorySection({
  category,
  companySlug,
  colorIndex,
  defaultOpen = false,
}: ConsultingCategorySectionProps): React.JSX.Element {
  const [open, setOpen] = useState(defaultOpen);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{ id: string; label: string } | null>(null);

  const createMutation = useCreateConsultingCheckpoint(companySlug);
  const deleteMutation = useDeleteConsultingCheckpoint(companySlug);

  const handleAddCheckpoint = async (): Promise<void> => {
    if (!newLabel.trim()) return;
    try {
      await createMutation.mutateAsync({
        category_id: category.id,
        label: newLabel.trim(),
        apply_to_all: true,
      });
      setNewLabel('');
      setAdding(false);
      toast.success('Checkpoint hinzugefügt');
    } catch {
      toast.error('Checkpoint konnte nicht hinzugefügt werden');
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      setPendingDelete(null);
      toast.success('Checkpoint gelöscht');
    } catch {
      toast.error('Löschen fehlgeschlagen');
    }
  };

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
      {/* Kategorie-Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#fafafa] transition-colors"
      >
        <span
          className="h-3.5 w-3.5 rounded-sm shrink-0"
          style={{ backgroundColor: getCategoryColor(colorIndex) }}
        />
        <span className="flex-1 text-[13px] font-semibold text-[#000000]">{category.name}</span>
        <div className="flex items-center gap-2 shrink-0">
          <ConsultingStatusBadge status="green" count={category.green_count} />
          <ConsultingStatusBadge status="orange" count={category.orange_count} />
          <ConsultingStatusBadge status="red" count={category.red_count} />
          {open ? (
            <ChevronDown className="h-4 w-4 text-[#a3a3a3]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[#a3a3a3]" />
          )}
        </div>
      </button>

      {/* Checkpoints */}
      {open && (
        <div className="border-t border-[#f0f0f0]">
          {category.checkpoints.length === 0 ? (
            <p className="px-4 py-3 text-[12px] text-[#a3a3a3] italic">
              Keine Checkpoints in dieser Kategorie.
            </p>
          ) : (
            category.checkpoints.map((cp) => (
              <ConsultingCheckpointRow
                key={cp.id}
                checkpoint={cp}
                companySlug={companySlug}
                onDeleteConfirm={(id, label) => setPendingDelete({ id, label })}
              />
            ))
          )}

          {/* Neuen Checkpoint hinzufügen */}
          <div className="px-4 py-2.5 border-t border-[#f0f0f0]">
            {adding ? (
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleAddCheckpoint();
                    if (e.key === 'Escape') { setAdding(false); setNewLabel(''); }
                  }}
                  placeholder="Checkpoint-Bezeichnung…"
                  className="h-7 text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => void handleAddCheckpoint()}
                  disabled={createMutation.isPending || !newLabel.trim()}
                  className="h-7 text-xs px-3"
                >
                  Hinzufügen
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setAdding(false); setNewLabel(''); }}
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
                Checkpoint hinzufügen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lösch-Bestätigung */}
      {pendingDelete && (
        <div className="border-t border-[#f0f0f0] bg-red-50 px-4 py-3 flex items-center gap-3">
          <p className="flex-1 text-[12px] text-[#EF4444]">
            „{pendingDelete.label}" für alle Unternehmen löschen?
          </p>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => void handleConfirmDelete()}
            disabled={deleteMutation.isPending}
            className="h-7 text-xs"
          >
            Löschen
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPendingDelete(null)}
            className="h-7 text-xs"
          >
            Abbrechen
          </Button>
        </div>
      )}
    </div>
  );
}
