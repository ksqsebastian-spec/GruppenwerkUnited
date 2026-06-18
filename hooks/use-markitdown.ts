'use client';

import { useEffect, useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  MarkitdownTemplate,
  MarkitdownTemplateInsert,
  MarkitdownConvertResult,
} from '@/types';

const QK = 'markitdown';
const QK_TAGS = 'markitdown-tags';
const NAME_KEY = 'werkbank_markitdown_saved_by';

export interface TemplateFilter {
  tags?: string[];
  search?: string;
}

async function jsonOrError(res: Response, fallback: string): Promise<never> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  throw new Error(body.error ?? fallback);
}

function buildQuery(filter: TemplateFilter): string {
  const params = new URLSearchParams();
  if (filter.tags && filter.tags.length > 0) params.set('tags', filter.tags.join(','));
  if (filter.search && filter.search.trim().length > 0) params.set('search', filter.search.trim());
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useTemplates(filter: TemplateFilter = {}): UseQueryResult<MarkitdownTemplate[], Error> {
  return useQuery<MarkitdownTemplate[]>({
    queryKey: [QK, filter.tags ?? [], filter.search ?? ''],
    queryFn: async () => {
      const res = await fetch(`/api/markitdown${buildQuery(filter)}`);
      if (!res.ok) return jsonOrError(res, 'Vorlagen konnten nicht geladen werden');
      return res.json() as Promise<MarkitdownTemplate[]>;
    },
    staleTime: 30 * 1000,
  });
}

export interface ConvertResponse extends MarkitdownConvertResult {
  source_dateiname: string;
  source_dateityp: string | null;
}

export function useConvertFile(): UseMutationResult<ConvertResponse, Error, File> {
  return useMutation<ConvertResponse, Error, File>({
    mutationFn: async (file) => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/markitdown/convert', { method: 'POST', body: form });
      if (!res.ok) return jsonOrError(res, 'Konvertierung fehlgeschlagen');
      return res.json() as Promise<ConvertResponse>;
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useSaveTemplate(): UseMutationResult<MarkitdownTemplate, Error, MarkitdownTemplateInsert> {
  const qc = useQueryClient();
  return useMutation<MarkitdownTemplate, Error, MarkitdownTemplateInsert>({
    mutationFn: async (input) => {
      const res = await fetch('/api/markitdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) return jsonOrError(res, 'Vorlage konnte nicht gespeichert werden');
      return res.json() as Promise<MarkitdownTemplate>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      qc.invalidateQueries({ queryKey: [QK_TAGS] });
      toast.success('Vorlage gespeichert');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteTemplate(): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/markitdown/${id}`, { method: 'DELETE' });
      if (!res.ok) return jsonOrError(res, 'Vorlage konnte nicht gelöscht werden');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      qc.invalidateQueries({ queryKey: [QK_TAGS] });
      toast.success('Vorlage gelöscht');
    },
    onError: (e) => toast.error(e.message),
  });
}

export interface TagInfo {
  tag: string;
  count: number;
}

export function useAllTags(): UseQueryResult<TagInfo[], Error> {
  return useQuery<TagInfo[]>({
    queryKey: [QK_TAGS],
    queryFn: async () => {
      const res = await fetch('/api/markitdown/tags');
      if (!res.ok) return jsonOrError(res, 'Tags konnten nicht geladen werden');
      return res.json() as Promise<TagInfo[]>;
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Komfort: merkt sich den letzten „Gespeichert von"-Namen in localStorage.
 * Pattern aus hooks/use-bilder.ts.
 */
export function useSavedByName(): [string, (name: string) => void] {
  const [name, setName] = useState<string>('');
  useEffect(() => {
    try {
      setName(localStorage.getItem(NAME_KEY) ?? '');
    } catch {
      // ignore
    }
  }, []);
  const update = (next: string): void => {
    setName(next);
    try {
      if (next.trim().length > 0) localStorage.setItem(NAME_KEY, next);
      else localStorage.removeItem(NAME_KEY);
    } catch {
      // ignore
    }
  };
  return [name, update];
}
