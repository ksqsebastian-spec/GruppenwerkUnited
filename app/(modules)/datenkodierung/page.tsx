'use client';

import { useState, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { KodierungTable } from '@/components/datenkodierung/kodierung-table';
import { KodierungErstellenDialog } from '@/components/datenkodierung/kodierung-erstellen-dialog';

import { useDatenkodierungen } from '@/hooks/use-datenkodierung';
import { useDebounce } from '@/hooks/use-debounce';

export default function DatenkodierungPage(): React.JSX.Element {
  const [dialogOffen, setDialogOffen] = useState(false);
  const [suchbegriff, setSuchbegriff] = useState('');
  const debouncedSuche = useDebounce(suchbegriff, 300);

  const { data, isLoading, error, refetch } = useDatenkodierungen(
    debouncedSuche || undefined
  );

  const handleNeuErstellen = useCallback((): void => {
    setDialogOffen(true);
  }, []);

  if (isLoading) {
    return <LoadingSpinner text="Datensätze werden geladen..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="Datensätze konnten nicht geladen werden"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Datenkodierung"
        description="Kundendaten pseudonymisieren – nur den Code mit KI-Systemen teilen"
        actions={
          <Button onClick={handleNeuErstellen}>
            <Plus className="mr-2 h-4 w-4" />
            Neuen Datensatz kodieren
          </Button>
        }
      />

      {/* Suchfeld */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Code, Name oder Adresse suchen..."
          value={suchbegriff}
          onChange={(e) => setSuchbegriff(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Ergebnisanzahl */}
      {data && data.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {data.length} {data.length === 1 ? 'Datensatz' : 'Datensätze'} gefunden
        </p>
      )}

      <KodierungTable daten={data ?? []} onNeuErstellen={handleNeuErstellen} />

      <KodierungErstellenDialog open={dialogOffen} onOpenChange={setDialogOffen} />
    </div>
  );
}
