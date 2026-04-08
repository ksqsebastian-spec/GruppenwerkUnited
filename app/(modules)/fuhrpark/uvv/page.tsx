'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Settings, Users, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UvvStats,
  DriverUvvTable,
  BatchCheckDialog,
} from '@/components/uvv-control';

/**
 * UVV-Kontrolle Übersichtsseite
 */
export default function UvvControlPage(): React.JSX.Element {
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="UVV-Kontrolle"
          description="Jährliche Fahrerunterweisung verwalten"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setBatchDialogOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                Sammel-Unterweisung
              </Button>
              <Button variant="outline" asChild>
                <Link href="/fuhrpark/uvv/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Einstellungen
                </Link>
              </Button>
            </div>
          }
        />

        {/* Statistiken */}
        <UvvStats />

        {/* Tabs für unterschiedliche Ansichten */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Alle Fahrer</TabsTrigger>
            <TabsTrigger value="overdue">Überfällig</TabsTrigger>
            <TabsTrigger value="due_soon">Bald fällig</TabsTrigger>
            <TabsTrigger value="ok">In Ordnung</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <DriverUvvTable />
          </TabsContent>

          <TabsContent value="overdue">
            <DriverUvvTable filterStatus={['overdue']} hideFilters />
          </TabsContent>

          <TabsContent value="due_soon">
            <DriverUvvTable filterStatus={['due_soon']} hideFilters />
          </TabsContent>

          <TabsContent value="ok">
            <DriverUvvTable filterStatus={['ok']} hideFilters />
          </TabsContent>
        </Tabs>
      </div>

      {/* Sammel-Unterweisung Dialog */}
      <BatchCheckDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
      />
    </AppLayout>
  );
}
