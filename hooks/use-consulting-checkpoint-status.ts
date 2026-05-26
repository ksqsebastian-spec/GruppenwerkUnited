'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConsultingCheckpointStatus, ConsultingCheckpointStatusUpdate } from '@/types';

interface UpdateParams {
  id: string;
  data: ConsultingCheckpointStatusUpdate;
  companySlug: string;
}

export function useUpdateConsultingCheckpointStatus(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: UpdateParams): Promise<ConsultingCheckpointStatus> => {
      const res = await fetch(`/api/consulting/checkpoint-status/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Aktualisierung fehlgeschlagen');
      }
      return res.json();
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['consulting-company', variables.companySlug] });
      queryClient.invalidateQueries({ queryKey: ['consulting-companies'] });
    },
  });
}
