'use client';

import { useState } from 'react';
import { Plus, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConsultingCompanyCard } from '@/components/dashboard/consulting-company-card';
import { ConsultingStatusBadge } from '@/components/dashboard/consulting-status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { useConsultingCompanies, useCreateConsultingCompany } from '@/hooks/use-consulting-companies';

export default function ConsultingDashboard(): React.JSX.Element {
  const { data: companies, isLoading, error } = useConsultingCompanies();
  const createMutation = useCreateConsultingCompany();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#6B7280');

  const totals = (companies ?? []).reduce(
    (acc, c) => ({
      green: acc.green + c.green_count,
      orange: acc.orange + c.orange_count,
      red: acc.red + c.red_count,
      total: acc.total + c.total_count,
      cost: acc.cost + c.total_cost,
    }),
    { green: 0, orange: 0, red: 0, total: 0, cost: 0 }
  );

  const overallPct = totals.total > 0 ? Math.round((totals.green / totals.total) * 100) : 0;

  const handleCreate = async (): Promise<void> => {
    if (!formName.trim()) return;
    const slug = formName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      await createMutation.mutateAsync({ name: formName.trim(), slug, color: formColor, sort_order: (companies?.length ?? 0) + 1 });
      toast.success('Unternehmen angelegt');
      setDialogOpen(false);
      setFormName('');
      setFormColor('#6B7280');
    } catch {
      toast.error('Anlegen fehlgeschlagen');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl border border-[#e5e5e5] bg-[#f5f5f5] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <EmptyState
          title="Daten konnten nicht geladen werden"
          description="Bitte Seite neu laden."
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-[#000000]" />
            <h1 className="text-xl font-semibold text-[#000000] tracking-tight">
              Consulting Dashboard
            </h1>
          </div>
          <p className="text-xs text-[#a3a3a3]">
            {companies?.length ?? 0} Unternehmen · {overallPct}% abgeschlossen
          </p>

          {/* Gesamt-Zähler */}
          {totals.total > 0 && (
            <div className="flex items-center gap-4 mt-3">
              <ConsultingStatusBadge status="green" count={totals.green} />
              <ConsultingStatusBadge status="orange" count={totals.orange} />
              <ConsultingStatusBadge status="red" count={totals.red} />
              {totals.cost > 0 && (
                <span className="text-xs text-[#737373] tabular-nums">
                  {totals.cost.toLocaleString('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  })}
                  /Monat gesamt
                </span>
              )}
            </div>
          )}
        </div>

        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="shrink-0 flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Unternehmen
        </Button>
      </div>

      {/* Grid */}
      {!companies || companies.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="h-10 w-10" />}
          title="Noch keine Unternehmen"
          description="Lege das erste Unternehmen an, um zu beginnen."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Unternehmen anlegen
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {companies.map((company) => (
            <ConsultingCompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}

      {/* Dialog: Neues Unternehmen */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Unternehmen anlegen</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-name">Name</Label>
              <Input
                id="company-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate(); }}
                placeholder="z.B. Maler Hantke"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-color">Akzentfarbe</Label>
              <div className="flex items-center gap-2">
                <input
                  id="company-color"
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="h-8 w-12 rounded border border-[#e5e5e5] cursor-pointer"
                />
                <span className="text-xs text-[#737373] font-mono">{formColor}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => void handleCreate()}
              disabled={createMutation.isPending || !formName.trim()}
            >
              {createMutation.isPending ? 'Wird angelegt…' : 'Anlegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
