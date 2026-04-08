'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { DamageForm } from '@/components/damages';
import { useDamage } from '@/hooks/use-damages';

/**
 * Seite zum Bearbeiten eines Schadens
 */
export default function EditDamagePage(): React.JSX.Element {
  const params = useParams();
  const damageId = params.id as string;

  const { data: damage, isLoading, error, refetch } = useDamage(damageId);

  if (isLoading) {
    return (
      <>
        <LoadingSpinner text="Schaden wird geladen..." />
      </>
    );
  }

  if (error || !damage) {
    return (
      <>
        <ErrorState
          message="Schaden konnte nicht geladen werden"
          onRetry={refetch}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Schaden bearbeiten"
          description={`Schaden vom ${new Date(damage.date).toLocaleDateString('de-DE')}`}
          backHref={`/fuhrpark/damages/${damage.id}`}
        />

        <Suspense fallback={<LoadingSpinner text="Formular wird geladen..." />}>
          <DamageForm damage={damage} />
        </Suspense>
      </div>
    </>
  );
}
