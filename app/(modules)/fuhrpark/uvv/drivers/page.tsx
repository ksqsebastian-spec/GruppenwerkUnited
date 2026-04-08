'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { DriverUvvTable, BatchCheckDialog } from '@/components/uvv-control';

/**
 * UVV-Fahrerliste Seite
 */
export default function UvvDriversPage(): React.JSX.Element {
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="UVV-Fahrerliste"
          description="Alle Fahrer mit UVV-Status"
          backHref="/fuhrpark/uvv"
          actions={
            <Button variant="outline" onClick={() => setBatchDialogOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Sammel-Unterweisung
            </Button>
          }
        />

        <DriverUvvTable />
      </div>

      {/* Sammel-Unterweisung Dialog */}
      <BatchCheckDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
      />
    </>
  );
}
