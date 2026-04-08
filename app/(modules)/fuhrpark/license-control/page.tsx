'use client';

import Link from 'next/link';
import { Plus, Settings, Users, Contact } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LicenseControlStats, EmployeeTable, BatchCheckDialog } from '@/components/license-control';
import { useLicenseEmployees } from '@/hooks/use-license-control';

/**
 * Führerscheinkontrolle - Übersichtsseite
 * Zeigt Statistiken und schnellen Zugriff auf alle Funktionen
 */
export default function LicenseControlPage(): JSX.Element {
  const { data: employees } = useLicenseEmployees({ status: 'active' });

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Führerscheinkontrolle"
          description="Rechtskonforme Kontrolle der Führerscheine deiner Mitarbeiter (§ 21 StVG)"
        >
          <div className="flex items-center gap-2">
            <BatchCheckDialog />
            <Button asChild>
              <Link href="/fuhrpark/license-control/employees/new">
                <Plus className="mr-2 h-4 w-4" />
                Neuer Mitarbeiter
              </Link>
            </Button>
          </div>
        </PageHeader>

        {/* Statistik-Karten */}
        <LicenseControlStats />

        {/* Schnellzugriff-Karten */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <Link href="/fuhrpark/license-control/employees">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Mitarbeiter</CardTitle>
                  <CardDescription>Alle Mitarbeiter verwalten</CardDescription>
                </div>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <Link href="/fuhrpark/license-control/settings">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Einstellungen</CardTitle>
                  <CardDescription>Intervall & Prüfer konfigurieren</CardDescription>
                </div>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Contact className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Rechtliches</CardTitle>
                <CardDescription>Mindestens 2x jährlich prüfen</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Nach § 21 StVG sind Arbeitgeber verpflichtet, die Führerscheine ihrer
                Mitarbeiter regelmäßig zu kontrollieren, wenn diese dienstlich Fahrzeuge nutzen.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mitarbeiter-Tabelle (nur fällige/überfällige) */}
        <Card>
          <CardHeader>
            <CardTitle>Fällige Kontrollen</CardTitle>
            <CardDescription>
              Mitarbeiter, deren Führerscheinkontrolle fällig oder überfällig ist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeTable
              employees={employees?.filter(e =>
                e.check_status === 'overdue' || e.check_status === 'due_soon'
              ) ?? []}
              showFilters={false}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
