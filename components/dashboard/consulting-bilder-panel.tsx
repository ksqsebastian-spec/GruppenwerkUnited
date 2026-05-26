'use client';

import { useRef, useState } from 'react';
import { X, Plus, Trash2, Copy, Check, Pencil, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface BilderItem {
  id: string;
  company_id: string;
  url: string;
  storage_path: string;
  name: string;
  category: string | null;
  sort_order: number;
  created_at: string;
}

interface Props {
  companyId: string | undefined;
  companyName: string;
  onClose: () => void;
}

const QUERY_KEY = (id: string | undefined) => ['consulting-bilder', id];

function CopyUrlButton({ url }: { url: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button type="button" onClick={() => void handleCopy()} className="p-1 rounded bg-black/50 text-white hover:bg-black/80 transition-colors" title="URL kopieren">
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export function ConsultingBilderPanel({ companyId, companyName, onClose }: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploading, setUploading] = useState(false);

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState('');
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null);
  const [confirmDeleteImage, setConfirmDeleteImage] = useState<string | null>(null);

  const { data: images = [], isLoading } = useQuery<BilderItem[]>({
    queryKey: QUERY_KEY(companyId),
    queryFn: async () => {
      const res = await fetch(`/api/consulting/companies/${companyId}/bilder`);
      if (!res.ok) throw new Error('Bilder konnten nicht geladen werden');
      return res.json();
    },
    enabled: Boolean(companyId),
    staleTime: 60_000,
  });

  const invalidate = (): void => { queryClient.invalidateQueries({ queryKey: QUERY_KEY(companyId) }); };

  const deleteMutation = useMutation({
    mutationFn: async (body: { image_id?: string; category?: string }) => {
      const res = await fetch(`/api/consulting/companies/${companyId}/bilder`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
    },
    onSuccess: invalidate,
  });

  const renameMutation = useMutation({
    mutationFn: async ({ old_category, new_category }: { old_category: string; new_category: string | null }) => {
      const res = await fetch(`/api/consulting/companies/${companyId}/bilder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_category, new_category }),
      });
      if (!res.ok) throw new Error('Umbenennen fehlgeschlagen');
    },
    onSuccess: invalidate,
  });

  const handleUploadConfirm = async (): Promise<void> => {
    if (!pendingFile || !companyId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', pendingFile);
      if (uploadCategory.trim()) fd.append('category', uploadCategory.trim());
      const res = await fetch(`/api/consulting/companies/${companyId}/bilder`, { method: 'POST', body: fd });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? 'Upload fehlgeschlagen');
      }
      invalidate();
      toast.success('Bild hochgeladen');
      setPendingFile(null);
      setUploadCategory('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  const handleRenameCategory = async (oldName: string): Promise<void> => {
    const newName = categoryDraft.trim() || null;
    setEditingCategory(null);
    if (newName === oldName) return;
    try {
      await renameMutation.mutateAsync({ old_category: oldName, new_category: newName });
    } catch {
      toast.error('Umbenennen fehlgeschlagen');
    }
  };

  // Group images by category
  const grouped = images.reduce<Record<string, BilderItem[]>>((acc, img) => {
    const key = img.category ?? '__none__';
    if (!acc[key]) acc[key] = [];
    acc[key].push(img);
    return acc;
  }, {});

  const categoryKeys = Object.keys(grouped)
    .filter((k) => k !== '__none__')
    .sort();
  if (grouped['__none__']) categoryKeys.push('__none__');

  const existingCategories = categoryKeys.filter((k) => k !== '__none__');

  return (
    <div className="flex flex-col rounded-xl border border-[#e5e5e5] bg-white overflow-hidden max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] shrink-0">
        <div>
          <h3 className="text-[13px] font-semibold text-[#000000]">Bilder & Logos</h3>
          <p className="text-[11px] text-[#a3a3a3]">{companyName}</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!companyId} className="p-1.5 rounded text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f5f5f5] transition-colors disabled:opacity-40" title="Bild hochladen">
            <Plus className="h-4 w-4" />
          </button>
          <button type="button" onClick={onClose} className="p-1.5 rounded text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f5f5f5] transition-colors">
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
          if (file) { setPendingFile(file); setUploadCategory(''); }
          e.target.value = '';
        }}
      />

      <div className="overflow-y-auto flex-1">
        {/* Upload form — shown when a file is selected */}
        {pendingFile && (
          <div className="px-4 py-3 border-b border-[#f0f0f0] bg-[#fafafa] flex flex-col gap-2">
            <p className="text-[12px] font-medium text-[#000000] truncate">{pendingFile.name}</p>
            <div className="flex items-center gap-2">
              <FolderPlus className="h-3.5 w-3.5 text-[#a3a3a3] shrink-0" />
              <input
                autoFocus
                list="bilder-categories"
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleUploadConfirm(); if (e.key === 'Escape') setPendingFile(null); }}
                placeholder="Kategorie (optional)"
                className="flex-1 text-[12px] border border-[#e5e5e5] rounded px-2 py-1 outline-none focus:border-[#000000] bg-white"
              />
              <datalist id="bilder-categories">
                {existingCategories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => void handleUploadConfirm()} disabled={uploading} className="text-[12px] font-medium text-white bg-[#000000] hover:bg-[#333] rounded px-3 py-1 transition-colors disabled:opacity-50">
                {uploading ? 'Wird hochgeladen…' : 'Hochladen'}
              </button>
              <button type="button" onClick={() => setPendingFile(null)} className="text-[12px] text-[#a3a3a3] hover:text-[#000000] px-2 py-1 transition-colors">
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Image grid grouped by category */}
        {isLoading ? (
          <div className="p-3 grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-[#f5f5f5] animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 && !pendingFile ? (
          <div className="py-8 text-center px-4">
            <p className="text-[12px] text-[#a3a3a3]">Noch keine Bilder.</p>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-1.5 text-[12px] text-[#000000] underline underline-offset-2">
              Erstes Bild hochladen
            </button>
          </div>
        ) : (
          <div className="pb-2">
            {categoryKeys.map((key) => {
              const isNone = key === '__none__';
              const label = isNone ? 'Ohne Kategorie' : key;
              const items = grouped[key];

              return (
                <div key={key} className="border-b border-[#f0f0f0] last:border-b-0">
                  {/* Category header */}
                  <div className="group flex items-center gap-1.5 px-4 py-2">
                    {!isNone && editingCategory === key ? (
                      <input
                        autoFocus
                        value={categoryDraft}
                        onChange={(e) => setCategoryDraft(e.target.value)}
                        onBlur={() => void handleRenameCategory(key)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void handleRenameCategory(key);
                          if (e.key === 'Escape') setEditingCategory(null);
                        }}
                        className="flex-1 text-[12px] font-medium border-b border-[#000000] bg-transparent outline-none"
                      />
                    ) : (
                      <span className="flex-1 text-[12px] font-medium text-[#404040]">{label}</span>
                    )}
                    <span className="text-[11px] text-[#c0c0c0]">{items.length}</span>
                    {!isNone && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => { setCategoryDraft(key); setEditingCategory(key); }} className="p-1 rounded text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f0f0f0] transition-colors">
                          <Pencil className="h-3 w-3" />
                        </button>
                        {confirmDeleteCategory === key ? (
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => void deleteMutation.mutateAsync({ category: key }).then(() => setConfirmDeleteCategory(null))} className="text-[10px] text-[#EF4444] font-medium hover:underline">Alle löschen</button>
                            <button type="button" onClick={() => setConfirmDeleteCategory(null)} className="text-[10px] text-[#a3a3a3] hover:underline">Abbrechen</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setConfirmDeleteCategory(key)} className="p-1 rounded text-[#c0c0c0] hover:text-[#EF4444] hover:bg-red-50 transition-colors">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Images grid */}
                  <div className="px-4 pb-3 grid grid-cols-3 gap-2">
                    {items.map((img) => (
                      <div key={img.id} className="group/img relative aspect-square rounded-lg overflow-hidden border border-[#e5e5e5] bg-[#f5f5f5]">
                        <img src={img.url} alt={img.name} className="h-full w-full object-contain p-1" title={img.name} />
                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/25 transition-colors flex items-start justify-end p-1 gap-1 opacity-0 group-hover/img:opacity-100">
                          <CopyUrlButton url={img.url} />
                          {confirmDeleteImage === img.id ? (
                            <button type="button" onClick={() => void deleteMutation.mutateAsync({ image_id: img.id }).then(() => setConfirmDeleteImage(null))} disabled={deleteMutation.isPending} className="p-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          ) : (
                            <button type="button" onClick={() => setConfirmDeleteImage(img.id)} className="p-1 rounded bg-black/50 text-white hover:bg-black/80 transition-colors">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
