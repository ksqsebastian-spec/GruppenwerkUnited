'use client';

import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/empty-state';
import {
  useConsultingCompanies,
  useDeleteConsultingCompany,
  useCreateConsultingCompany,
} from '@/hooks/use-consulting-companies';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConsultingCategory } from '@/types';

function useCategoriesSettings(): ReturnType<typeof useQuery<ConsultingCategory[]>> {
  return useQuery<ConsultingCategory[]>({
    queryKey: ['consulting-categories-settings'],
    queryFn: async () => {
      const res = await fetch('/api/consulting/categories');
      if (!res.ok) throw new Error('Fehler beim Laden');
      return res.json();
    },
  });
}

function useDeleteCategory(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/consulting/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting-categories-settings'] });
    },
  });
}

function useCreateCategory(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; icon: string | null }) => {
      const res = await fetch('/api/consulting/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Anlegen fehlgeschlagen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting-categories-settings'] });
    },
  });
}

export default function ConsultingEinstellungen(): React.JSX.Element {
  const { data: companies, isLoading: companiesLoading } = useConsultingCompanies();
  const { data: categories, isLoading: categoriesLoading } = useCategoriesSettings();
  const deleteCo = useDeleteConsultingCompany();
  const createCo = useCreateConsultingCompany();
  const deleteCat = useDeleteCategory();
  const createCat = useCreateCategory();

  const [coDialog, setCoDialog] = useState(false);
  const [coName, setCoName] = useState('');
  const [coColor, setCoColor] = useState('#6B7280');

  const [catDialog, setCatDialog] = useState(false);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('');

  const [pendingDeleteCo, setPendingDeleteCo] = useState<string | null>(null);
  const [pendingDeleteCat, setPendingDeleteCat] = useState<string | null>(null);

  const handleCreateCo = async (): Promise<void> => {
    if (!coName.trim()) return;
    const slug = coName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      await createCo.mutateAsync({ name: coName.trim(), slug, color: coColor, sort_order: (companies?.length ?? 0) + 1 });
      toast.success('Unternehmen angelegt');
      setCoDialog(false);
      setCoName('');
      setCoColor('#6B7280');
    } catch {
      toast.error('Anlegen fehlgeschlagen');
    }
  };

  const handleDeleteCo = async (id: string): Promise<void> => {
    try {
      await deleteCo.mutateAsync(id);
      setPendingDeleteCo(null);
      toast.success('Unternehmen gelöscht');
    } catch {
      toast.error('Löschen fehlgeschlagen');
    }
  };

  const handleCreateCat = async (): Promise<void> => {
    if (!catName.trim()) return;
    try {
      await createCat.mutateAsync({ name: catName.trim(), icon: catIcon.trim() || null });
      toast.success('Kategorie angelegt');
      setCatDialog(false);
      setCatName('');
      setCatIcon('');
    } catch {
      toast.error('Anlegen fehlgeschlagen');
    }
  };

  const handleDeleteCat = async (id: string): Promise<void> => {
    try {
      await deleteCat.mutateAsync(id);
      setPendingDeleteCat(null);
      toast.success('Kategorie gelöscht');
    } catch {
      toast.error('Löschen fehlgeschlagen');
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-[#000000] tracking-tight">
          Consulting Einstellungen
        </h1>
        <p className="text-xs text-[#a3a3a3] mt-1">
          Unternehmen und Kategorien verwalten
        </p>
      </div>

      {/* ── Unternehmen ── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#000000]">Unternehmen</h2>
          <Button size="sm" onClick={() => setCoDialog(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Anlegen
          </Button>
        </div>

        {companiesLoading ? (
          <div className="h-32 rounded-xl border border-[#e5e5e5] bg-[#f5f5f5] animate-pulse" />
        ) : !companies || companies.length === 0 ? (
          <EmptyState title="Keine Unternehmen" />
        ) : (
          <div className="rounded-xl border border-[#e5e5e5] divide-y divide-[#f0f0f0] overflow-hidden">
            {companies.map((co) => (
              <div key={co.id} className="flex items-center gap-3 px-4 py-3 bg-white">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: co.color ?? '#6B7280' }}
                />
                <span className="flex-1 text-sm text-[#000000]">{co.name}</span>
                <span className="text-xs text-[#a3a3a3] font-mono">{co.slug}</span>
                {pendingDeleteCo === co.id ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => void handleDeleteCo(co.id)}
                      disabled={deleteCo.isPending}
                      className="h-7 text-xs"
                    >
                      Wirklich löschen
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingDeleteCo(null)}
                      className="h-7 text-xs"
                    >
                      Abbrechen
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPendingDeleteCo(co.id)}
                    className="text-[#c0c0c0] hover:text-[#EF4444] transition-colors p-1 rounded"
                    title="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Kategorien ── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#000000]">Kategorien</h2>
          <Button size="sm" onClick={() => setCatDialog(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Anlegen
          </Button>
        </div>

        {categoriesLoading ? (
          <div className="h-32 rounded-xl border border-[#e5e5e5] bg-[#f5f5f5] animate-pulse" />
        ) : !categories || categories.length === 0 ? (
          <EmptyState title="Keine Kategorien" />
        ) : (
          <div className="rounded-xl border border-[#e5e5e5] divide-y divide-[#f0f0f0] overflow-hidden">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 px-4 py-3 bg-white">
                <span className="text-base shrink-0">{cat.icon ?? '📋'}</span>
                <span className="flex-1 text-sm text-[#000000]">{cat.name}</span>
                <span className="text-xs text-[#a3a3a3] tabular-nums">#{cat.sort_order}</span>
                {pendingDeleteCat === cat.id ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => void handleDeleteCat(cat.id)}
                      disabled={deleteCat.isPending}
                      className="h-7 text-xs"
                    >
                      Wirklich löschen
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingDeleteCat(null)}
                      className="h-7 text-xs"
                    >
                      Abbrechen
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPendingDeleteCat(cat.id)}
                    className="text-[#c0c0c0] hover:text-[#EF4444] transition-colors p-1 rounded"
                    title="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Dialog: Unternehmen */}
      <Dialog open={coDialog} onOpenChange={setCoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Unternehmen anlegen</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="set-co-name">Name</Label>
              <Input
                id="set-co-name"
                value={coName}
                onChange={(e) => setCoName(e.target.value)}
                placeholder="z.B. Neue GmbH"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="set-co-color">Akzentfarbe</Label>
              <div className="flex items-center gap-2">
                <input
                  id="set-co-color"
                  type="color"
                  value={coColor}
                  onChange={(e) => setCoColor(e.target.value)}
                  className="h-8 w-12 rounded border border-[#e5e5e5] cursor-pointer"
                />
                <span className="text-xs text-[#737373] font-mono">{coColor}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCoDialog(false)}>Abbrechen</Button>
            <Button onClick={() => void handleCreateCo()} disabled={createCo.isPending || !coName.trim()}>
              {createCo.isPending ? 'Wird angelegt…' : 'Anlegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Kategorie */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Kategorie anlegen</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="set-cat-name">Name</Label>
              <Input
                id="set-cat-name"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="z.B. IT-Infrastruktur"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="set-cat-icon">Icon (Emoji)</Label>
              <Input
                id="set-cat-icon"
                value={catIcon}
                onChange={(e) => setCatIcon(e.target.value)}
                placeholder="z.B. 🖥️"
                className="text-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(false)}>Abbrechen</Button>
            <Button onClick={() => void handleCreateCat()} disabled={createCat.isPending || !catName.trim()}>
              {createCat.isPending ? 'Wird angelegt…' : 'Anlegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
