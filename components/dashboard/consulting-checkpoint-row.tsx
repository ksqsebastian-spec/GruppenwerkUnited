'use client';

import { useState, useCallback } from 'react';
import { Trash2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConsultingStatusDot } from './consulting-status-badge';
import { ConsultingInlineEdit } from './consulting-inline-edit';
import { useUpdateConsultingCheckpointStatus } from '@/hooks/use-consulting-checkpoint-status';
import { useConsultingFieldTypes } from '@/hooks/use-consulting-field-types';
import type {
  ConsultingCheckpoint,
  ConsultingCheckpointStatus,
  ConsultingFieldType,
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

function getFieldValue(
  key: string,
  statusRow: ConsultingCheckpointStatus | null
): string | null {
  if (!statusRow) return null;
  const val = (statusRow as unknown as Record<string, unknown>)[key];
  if (val === null || val === undefined || val === '') return null;
  return String(val);
}

function formatFieldValue(key: string, raw: string | null): string {
  if (!raw) return '';
  if (key === 'cost_monthly') return `€ ${Number(raw).toLocaleString('de-DE')}`;
  return raw;
}

export function ConsultingCheckpointRow({
  checkpoint,
  companySlug,
  onDeleteConfirm,
}: ConsultingCheckpointRowProps): React.JSX.Element {
  const { data: fieldTypes = [] } = useConsultingFieldTypes();
  const queryClient = useQueryClient();

  const statusRow = checkpoint.status_row;
  const currentStatus: ConsultingStatus = statusRow?.status ?? 'red';
  const activeFields: string[] | null = checkpoint.active_fields ?? null;

  const [configOpen, setConfigOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(checkpoint.label);

  const updateStatus = useUpdateConsultingCheckpointStatus();

  const updateCheckpoint = useMutation({
    mutationFn: async (data: { label?: string; active_fields?: string[] }) => {
      const res = await fetch(`/api/consulting/checkpoints/${checkpoint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Fehler');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting-company', companySlug] });
    },
  });

  const handleStatusToggle = useCallback(async (): Promise<void> => {
    if (!statusRow) return;
    try {
      await updateStatus.mutateAsync({
        id: statusRow.id,
        data: { status: STATUS_CYCLE[currentStatus] },
        companySlug,
      });
    } catch {
      toast.error('Status konnte nicht aktualisiert werden');
    }
  }, [statusRow, currentStatus, updateStatus, companySlug]);

  const handleFieldSave = useCallback(
    async (fieldKey: string, value: string | null): Promise<void> => {
      if (!statusRow) return;
      const processed =
        fieldKey === 'cost_monthly' ? (value ? Number(value) : null) : value;
      try {
        await updateStatus.mutateAsync({
          id: statusRow.id,
          data: { [fieldKey]: processed },
          companySlug,
        });
      } catch {
        toast.error('Änderung konnte nicht gespeichert werden');
      }
    },
    [statusRow, updateStatus, companySlug]
  );

  const handleSaveLabel = async (): Promise<void> => {
    const trimmed = labelDraft.trim();
    setEditingLabel(false);
    if (!trimmed || trimmed === checkpoint.label) return;
    try {
      await updateCheckpoint.mutateAsync({ label: trimmed });
    } catch {
      toast.error('Label konnte nicht gespeichert werden');
      setLabelDraft(checkpoint.label);
    }
  };

  const handleToggleField = async (fieldKey: string): Promise<void> => {
    const allEnabledKeys = fieldTypes.filter((ft) => ft.is_enabled).map((ft) => ft.key);
    const current = activeFields ?? allEnabledKeys;
    const next = current.includes(fieldKey)
      ? current.filter((k) => k !== fieldKey)
      : [...current, fieldKey];
    try {
      await updateCheckpoint.mutateAsync({ active_fields: next });
    } catch {
      toast.error('Feld konnte nicht aktualisiert werden');
    }
  };

  const enabledFieldTypes = fieldTypes.filter((ft: ConsultingFieldType) => ft.is_enabled);
  const visibleFieldTypes = enabledFieldTypes.filter(
    (ft) => activeFields === null || activeFields.includes(ft.key)
  );

  const summary = visibleFieldTypes
    .map((ft) => formatFieldValue(ft.key, getFieldValue(ft.key, statusRow)))
    .filter(Boolean)
    .join('  ·  ');

  return (
    <div className="flex flex-col border-b border-[#f0f0f0] last:border-b-0">
      {/* Main row */}
      <div className="group flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafafa]">
        <div className="shrink-0">
          <ConsultingStatusDot
            status={currentStatus}
            onClick={statusRow ? handleStatusToggle : undefined}
            disabled={updateStatus.isPending}
          />
        </div>

        {editingLabel ? (
          <input
            autoFocus
            value={labelDraft}
            size={Math.max(labelDraft.length + 2, 12)}
            onChange={(e) => setLabelDraft(e.target.value)}
            onBlur={() => void handleSaveLabel()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSaveLabel();
              if (e.key === 'Escape') {
                setLabelDraft(checkpoint.label);
                setEditingLabel(false);
              }
            }}
            className="text-[13px] text-[#1a1a1a] bg-transparent border-b border-[#000000] outline-none leading-snug"
          />
        ) : (
          <p
            className="flex-1 text-[13px] text-[#1a1a1a] leading-snug cursor-text"
            onClick={() => {
              setLabelDraft(checkpoint.label);
              setEditingLabel(true);
            }}
          >
            {checkpoint.label}
          </p>
        )}

        {!configOpen && summary && (
          <p className="text-[11px] text-[#a3a3a3] truncate max-w-[220px] hidden md:block">
            {summary}
          </p>
        )}

        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setConfigOpen((v) => !v)}
            className={`p-1.5 rounded transition-colors ${
              configOpen
                ? 'text-[#000000] bg-[#f0f0f0]'
                : 'text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f0f0f0]'
            }`}
            title="Felder konfigurieren"
          >
            <Settings2 className="h-3.5 w-3.5" />
          </button>
          {onDeleteConfirm && (
            <button
              type="button"
              onClick={() => onDeleteConfirm(checkpoint.id, checkpoint.label)}
              className="p-1.5 rounded text-[#c0c0c0] hover:text-[#EF4444] hover:bg-red-50 transition-colors"
              title="Löschen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Field config panel */}
      {configOpen && (
        <div className="px-4 pb-3 ml-7 flex flex-col gap-2">
          {enabledFieldTypes.map((ft) => {
            const isActive = activeFields === null || activeFields.includes(ft.key);
            const rawValue = getFieldValue(ft.key, statusRow);
            return (
              <div key={ft.key} className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id={`f-${checkpoint.id}-${ft.key}`}
                  checked={isActive}
                  onChange={() => void handleToggleField(ft.key)}
                  className="h-3.5 w-3.5 rounded border-[#d4d4d4] accent-black cursor-pointer shrink-0"
                />
                <label
                  htmlFor={`f-${checkpoint.id}-${ft.key}`}
                  className="text-[11px] text-[#737373] w-28 shrink-0 cursor-pointer"
                >
                  {ft.label}
                </label>
                {isActive && (
                  <ConsultingInlineEdit
                    value={rawValue}
                    placeholder={`${ft.label}…`}
                    onSave={(v) => void handleFieldSave(ft.key, v)}
                    type={ft.key === 'cost_monthly' ? 'number' : 'text'}
                    className="flex-1 max-w-[280px]"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
