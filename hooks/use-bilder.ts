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
import type { Bild } from '@/types';

export interface BildMitUrl extends Bild {
  public_url: string;
}

export interface BildFilter {
  firmenTags?: string[];
  search?: string;
}

const QK = 'bilder';
const UPLOADER_NAME_KEY = 'werkbank_uploader_name';

async function jsonOrError(res: Response, fallback: string): Promise<never> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  throw new Error(body.error ?? fallback);
}

function buildQuery(filter: BildFilter): string {
  const params = new URLSearchParams();
  if (filter.firmenTags && filter.firmenTags.length > 0) {
    params.set('firmen_tags', filter.firmenTags.join(','));
  }
  if (filter.search && filter.search.trim().length > 0) {
    params.set('search', filter.search.trim());
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useBilder(filter: BildFilter = {}): UseQueryResult<BildMitUrl[], Error> {
  return useQuery<BildMitUrl[]>({
    queryKey: [QK, filter.firmenTags ?? [], filter.search ?? ''],
    queryFn: async () => {
      const res = await fetch(`/api/bilder${buildQuery(filter)}`);
      if (!res.ok) return jsonOrError(res, 'Bilder konnten nicht geladen werden');
      return res.json() as Promise<BildMitUrl[]>;
    },
    staleTime: 30 * 1000,
  });
}

export interface BildUploadInput {
  file: File;
  titel: string;
  beschreibung: string;
  firmen_tags: string[];
  uploaded_by: string;
}

export function useUploadBild(): UseMutationResult<BildMitUrl, Error, BildUploadInput> {
  const qc = useQueryClient();
  return useMutation<BildMitUrl, Error, BildUploadInput>({
    mutationFn: async (input) => {
      const form = new FormData();
      form.append('file', input.file);
      form.append('titel', input.titel);
      form.append('beschreibung', input.beschreibung);
      form.append('firmen_tags', input.firmen_tags.join(','));
      form.append('uploaded_by', input.uploaded_by);
      const res = await fetch('/api/bilder', { method: 'POST', body: form });
      if (!res.ok) return jsonOrError(res, 'Bild konnte nicht hochgeladen werden');
      return res.json() as Promise<BildMitUrl>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast.success('Bild hochgeladen');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteBild(): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/bilder/${id}`, { method: 'DELETE' });
      if (!res.ok) return jsonOrError(res, 'Bild konnte nicht gelöscht werden');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast.success('Bild gelöscht');
    },
    onError: (e) => toast.error(e.message),
  });
}

/**
 * Persistiert den eingegebenen Uploader-Namen in localStorage, damit er beim
 * nächsten Upload schon im Feld steht. Kein Auth-Mechanismus — reiner Komfort.
 */
export function useUploaderName(): [string, (name: string) => void] {
  const [name, setName] = useState<string>('');
  useEffect(() => {
    try {
      setName(localStorage.getItem(UPLOADER_NAME_KEY) ?? '');
    } catch {
      // ignore
    }
  }, []);
  const update = (next: string): void => {
    setName(next);
    try {
      if (next.trim().length > 0) localStorage.setItem(UPLOADER_NAME_KEY, next);
      else localStorage.removeItem(UPLOADER_NAME_KEY);
    } catch {
      // ignore
    }
  };
  return [name, update];
}
