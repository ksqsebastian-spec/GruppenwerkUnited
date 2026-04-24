'use client';

import { Zap } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { AutomatisierungenBrowser } from '@/components/automationen/automationen-browser';
import { useAutomatisierungsknoten } from '@/hooks/use-automationen';
import { useAuth } from '@/components/providers/auth-provider';

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
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="shrink-0 px-6 py-4 border-b border-border">
        <PageHeader
          title="Automatisierungen"
          description={`Navigiere durch die Ordnerstruktur und sammle Kontext-Bausteine für deinen KI-Prompt – ${company?.companyName ?? ''}`}
        />
      </div>

      {!knoten || knoten.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<Zap className="h-12 w-12 text-muted-foreground" />}
            title="Keine Automatisierungen eingerichtet"
            description="Es wurden noch keine Workflow-Knoten angelegt."
          />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <AutomatisierungenBrowser knoten={knoten} />
        </div>
      )}
    </div>
  );
}
