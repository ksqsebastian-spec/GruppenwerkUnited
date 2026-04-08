'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Download, Database } from 'lucide-react';
import { CompanyList, DataExport } from '@/components/settings';

/**
 * Einstellungen-Seite
 */
export default function SettingsPage(): JSX.Element {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Einstellungen"
          description="Verwalte Firmen, Datenexport und Systemeinstellungen"
        />

        <Tabs defaultValue="companies">
          <TabsList>
            <TabsTrigger value="companies">
              <Building className="mr-2 h-4 w-4" />
              Firmen
            </TabsTrigger>
            <TabsTrigger value="export">
              <Download className="mr-2 h-4 w-4" />
              Daten-Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="mt-6">
            <CompanyList />
          </TabsContent>

          <TabsContent value="export" className="mt-6">
            <DataExport />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
