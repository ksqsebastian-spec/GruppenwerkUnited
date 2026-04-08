'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsForm, InstructorManagement } from '@/components/uvv-control';

/**
 * UVV-Einstellungen Seite
 */
export default function UvvSettingsPage(): JSX.Element {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="UVV-Einstellungen"
          description="Konfiguration für die jährliche Fahrerunterweisung"
          backHref="/uvv"
        />

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">Allgemein</TabsTrigger>
            <TabsTrigger value="instructors">Unterweisende</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Allgemeine Einstellungen</CardTitle>
                <CardDescription>
                  Intervall und Standard-Themen für UVV-Unterweisungen festlegen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SettingsForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instructors">
            <Card>
              <CardHeader>
                <CardTitle>Unterweisende verwalten</CardTitle>
                <CardDescription>
                  Personen, die UVV-Unterweisungen durchführen dürfen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InstructorManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
