'use client';

import { useState } from 'react';
import { Plus, BarChart3, Euro } from 'lucide-react';
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
import { ConsultingCostPanel } from '@/components/dashboard/consulting-cost-panel';
import { EmptyState } from '@/components/shared/empty-state';
import { useConsultingCompanies, useCreateConsultingCompany } from '@/hooks/use-consulting-companies';

export default function ConsultingDashboard(): React.JSX.Element {
  const { data: companies, isLoading, error } = useConsultingCompanies();
  const createMutation = useCreateConsultingCompany();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#6B7280');
  const [showCosts, setShowCosts] = useState(false);

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
    const slug = formName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    try {
      await createMutation.mutateAsync({
        name: formName.trim(),
        slug,
        color: formColor,
        sort_order: (companies?.length ?? 0) + 1,
      });
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
      <div className="w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-xl border border-[#e5e5e5] bg-[#f5f5f5] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <EmptyState
          title="Daten konnten nicht geladen werden"
          description="Bitte Seite neu laden."
        />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
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
          {totals.total > 0 && (
            <div className="flex items-center gap-4 mt-3">
              <ConsultingStatusBadge status="green" count={totals.green} />
              <ConsultingStatusBadge status="orange" count={totals.orange} />
              <ConsultingStatusBadge status="red" count={totals.red} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant={showCosts ? 'default' : 'outline'}
            onClick={() => setShowCosts((v) => !v)}
            className="flex items-center gap-1.5"
          >
            <Euro className="h-3.5 w-3.5" />
            Kosten
          </Button>
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Unternehmen
          </Button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex gap-5 items-start">
        <div className="flex-1 min-w-0">
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
        </div>

        {showCosts && companies && companies.length > 0 && (
          <div className="w-72 shrink-0">
            <ConsultingCostPanel
              mode="dashboard"
              companies={companies}
              onClose={() => setShowCosts(false)}
            />
          </div>
        )}
      </div>

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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleCreate();
                }}
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
