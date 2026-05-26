'use client';

import { useRef, useState } from 'react';
import { X, Plus, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface BilderItem {
  name: string;
  url: string;
  created_at: string | null;
}

interface Props {
  companyId: string | undefined;
  companyName: string;
  onClose: () => void;
}

function CopyUrlButton({ url }: { url: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="p-1 rounded bg-black/40 text-white hover:bg-black/70 transition-colors"
      title="URL kopieren"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export function ConsultingBilderPanel({ companyId, companyName, onClose }: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: images, isLoading } = useQuery<BilderItem[]>({
    queryKey: ['consulting-bilder', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/consulting/companies/${companyId}/bilder`);
      if (!res.ok) throw new Error('Bilder konnten nicht geladen werden');
      return res.json();
    },
    enabled: Boolean(companyId),
    staleTime: 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/consulting/companies/${companyId}/bilder`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting-bilder', companyId] });
      setConfirmDelete(null);
    },
  });

  const handleUpload = async (file: File): Promise<void> => {
    if (!companyId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/consulting/companies/${companyId}/bilder`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? 'Upload fehlgeschlagen');
      }
      queryClient.invalidateQueries({ queryKey: ['consulting-bilder', companyId] });
      toast.success('Bild hochgeladen');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
        <div>
          <h3 className="text-[13px] font-semibold text-[#000000]">Bilder & Logos</h3>
          <p className="text-[11px] text-[#a3a3a3]">{companyName}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !companyId}
            className="p-1.5 rounded text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f5f5f5] transition-colors disabled:opacity-40"
            title="Bild hochladen"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f5f5f5] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUpload(file);
          e.target.value = '';
        }}
      />

      <div className="p-3">
        {isLoading || uploading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: uploading ? 1 : 3 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-[#f5f5f5] animate-pulse" />
            ))}
          </div>
        ) : !images || images.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-[12px] text-[#a3a3a3]">Noch keine Bilder hochgeladen.</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-[12px] text-[#000000] underline underline-offset-2"
            >
              Erstes Bild hochladen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <div key={img.name} className="group relative aspect-square rounded-lg overflow-hidden border border-[#e5e5e5] bg-[#f5f5f5]">
                <img
                  src={img.url}
                  alt={img.name}
                  className="h-full w-full object-contain p-1"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-start justify-end p-1 gap-1 opacity-0 group-hover:opacity-100">
                  <CopyUrlButton url={img.url} />
                  {confirmDelete === img.name ? (
                    <button
                      type="button"
                      onClick={() => void deleteMutation.mutateAsync(img.name)}
                      disabled={deleteMutation.isPending}
                      className="p-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                      title="Löschen bestätigen"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(img.name)}
                      className="p-1 rounded bg-black/40 text-white hover:bg-black/70 transition-colors"
                      title="Löschen"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
