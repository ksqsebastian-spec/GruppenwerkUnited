'use client';

import { useState, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConsultingStatusDot } from './consulting-status-badge';
import { ConsultingInlineEdit } from './consulting-inline-edit';
import { useUpdateConsultingCheckpointStatus } from '@/hooks/use-consulting-checkpoint-status';
import { useDeleteConsultingCheckpoint } from '@/hooks/use-consulting-company';
import type {
  ConsultingCheckpoint,
  ConsultingCheckpointStatus,
  ConsultingStatus,
} from '@/types';

const STATUS_CYCLE: Record<ConsultingStatus, ConsultingStatus> = {
  green: 'orange',
  orange: 'red',
  red: 'green',
};

interface ConsultingCheckpointRowProps {
  checkpoint: ConsultingCheckpoint & { status_row: ConsultingCheckpointStatus | null };
  companySlug: string;
  onDeleteConfirm?: (id: string, label: string) => void;
}

export function ConsultingCheckpointRow({
  checkpoint,
  companySlug,
  onDeleteConfirm,
}: ConsultingCheckpointRowProps): React.JSX.Element {
  const statusRow = checkpoint.status_row;
  const currentStatus: ConsultingStatus = statusRow?.status ?? 'red';

  const updateMutation = useUpdateConsultingCheckpointStatus();

  const handleStatusToggle = useCallback(async (): Promise<void> => {
    if (!statusRow) return;
    const nextStatus = STATUS_CYCLE[currentStatus];
    try {
      await updateMutation.mutateAsync({
        id: statusRow.id,
        data: { status: nextStatus },
        companySlug,
      });
    } catch {
      toast.error('Status konnte nicht aktualisiert werden');
    }
  }, [statusRow, currentStatus, updateMutation, companySlug]);

  const handleFieldSave = useCallback(
    async (field: 'notes' | 'responsible' | 'cost_monthly', value: string | null): Promise<void> => {
      if (!statusRow) return;
      try {
        await updateMutation.mutateAsync({
          id: statusRow.id,
          data: { [field]: field === 'cost_monthly' ? (value ? Number(value) : null) : value },
          companySlug,
        });
      } catch {
        toast.error('Änderung konnte nicht gespeichert werden');
      }
    },
    [statusRow, updateMutation, companySlug]
  );

  return (
    <div className="group flex items-start gap-3 px-4 py-2.5 hover:bg-[#fafafa] border-b border-[#f0f0f0] last:border-b-0">
      {/* Status-Dot */}
      <div className="pt-0.5 shrink-0">
        <ConsultingStatusDot
          status={currentStatus}
          onClick={statusRow ? handleStatusToggle : undefined}
          disabled={updateMutation.isPending}
        />
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-[#1a1a1a] leading-snug">{checkpoint.label}</p>

        {/* Inline-Felder */}
        <div className="mt-1.5 flex items-center gap-4 flex-wrap">
          <ConsultingInlineEdit
            value={statusRow?.notes ?? null}
            placeholder="Notiz hinzufügen…"
            onSave={(v) => handleFieldSave('notes', v)}
            className="max-w-[200px]"
          />
          <ConsultingInlineEdit
            value={statusRow?.responsible ?? null}
            placeholder="Verantwortlich…"
            onSave={(v) => handleFieldSave('responsible', v)}
            className="max-w-[140px]"
          />
          <ConsultingInlineEdit
            value={statusRow?.cost_monthly != null ? String(statusRow.cost_monthly) : null}
            placeholder="Kosten/Monat"
            type="number"
            onSave={(v) => handleFieldSave('cost_monthly', v)}
            className="max-w-[100px]"
          />
        </div>
      </div>

      {/* Löschen */}
      {onDeleteConfirm && (
        <button
          type="button"
          onClick={() => onDeleteConfirm(checkpoint.id, checkpoint.label)}
          className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded text-[#c0c0c0] hover:text-[#EF4444] hover:bg-red-50 transition-all"
          title="Checkpoint löschen"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
