'use client';

import Link from 'next/link';
import { Settings, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LicenseControlStats, EmployeeTable, BatchCheckDialog } from '@/components/license-control';
import { useDriversWithLicenseStatus } from '@/hooks/use-license-control';

/**
 * Führerscheinkontrolle - Übersichtsseite
 */
export default function LicenseControlPage(): React.JSX.Element {
  const { data: employees } = useDriversWithLicenseStatus({ status: 'active' });

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Führerscheinkontrolle"
          description="Rechtskonforme Kontrolle der Führerscheine deiner Mitarbeiter (§ 21 StVG)"
        >
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/fuhrpark/license-control/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/fuhrpark/license-control/employees">
                <Users className="mr-2 h-4 w-4" />
                Mitarbeiter
              </Link>
            </Button>
            <BatchCheckDialog />
          </div>
        </PageHeader>

        {/* Statistik-Karten */}
        <LicenseControlStats />

        {/* Fällige Kontrollen */}
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
    </>
  );
}
