'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingsForm, InspectorManagement } from '@/components/license-control';

/**
 * Führerscheinkontrolle - Einstellungsseite
 * SettingsForm und InspectorManagement laden ihre Daten selbst
 */
export default function LicenseControlSettingsPage(): JSX.Element {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Einstellungen"
          description="Konfiguriere die Führerscheinkontrolle"
          backHref="/license-control"
        />

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">Allgemein</TabsTrigger>
            <TabsTrigger value="inspectors">Prüfer</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kontrollintervall</CardTitle>
                <CardDescription>
                  Lege fest, in welchem Abstand Führerscheinkontrollen durchgeführt werden sollen.
                  Gemäß § 21 StVG müssen Führerscheine mindestens 2x jährlich geprüft werden.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SettingsForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inspectors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prüfer verwalten</CardTitle>
                <CardDescription>
                  Lege fest, wer Führerscheinkontrollen durchführen darf.
                  Bei jeder Kontrolle muss ein Prüfer ausgewählt werden.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InspectorManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
