'use client';

import { Zap } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { AutomatisierungenCanvas } from '@/components/automationen/automationen-canvas';
import { useAutomatisierungsknoten } from '@/hooks/use-automationen';
import { useAuth } from '@/components/providers/auth-provider';

/**
 * Automatisierungen-Seite: Interaktiver Prompt-Canvas für KI-Workflows.
 * Mitarbeiter können Nodes verschieben, bearbeiten und Prompts für Claude kopieren.
 */
export default function AutomatisierungenPage(): React.JSX.Element {
  const { company } = useAuth();
  const { data: knoten, isLoading, error, refetch } = useAutomatisierungsknoten();

  if (isLoading) {
    return <LoadingSpinner text="Automatisierungen werden geladen..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : 'Automatisierungen konnten nicht geladen werden'
        }
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-0">
      {/* Kompakter Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border">
        <PageHeader
          title="Automatisierungen"
          description={`KI-Workflow-Canvas für ${company?.companyName ?? 'deine Firma'} – Nodes verschieben, bearbeiten und Prompts kopieren`}
        />
      </div>

      {/* Canvas oder Empty State */}
      {!knoten || knoten.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<Zap className="h-12 w-12 text-muted-foreground" />}
            title="Keine Automatisierungen eingerichtet"
            description={'Klicke auf "Hauptbereich" oben links im Canvas um den ersten Workflow-Knoten anzulegen.'}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden rounded-none border-0">
          <AutomatisierungenCanvas knoten={knoten} />
        </div>
      )}
    </div>
  );
}
