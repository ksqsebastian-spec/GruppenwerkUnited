'use client';

import { Car, Users, AlertTriangle, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard, WarningCard, QuickActions, RecentActivity } from '@/components/dashboard';
import {
  useDashboardStats,
  useWarningAppointments,
  useRecentActivities,
} from '@/hooks/use-dashboard';

/**
 * Formattiert einen Euro-Betrag
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Dashboard-Seite - Übersicht über den gesamten Fuhrpark
 */
export default function DashboardPage(): React.JSX.Element {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: warnings, isLoading: warningsLoading } = useWarningAppointments();
  const { data: activities, isLoading: activitiesLoading } = useRecentActivities();

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Übersicht über deinen Fuhrpark"
        />

        {/* Statistik-Karten */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Fahrzeuge"
            value={stats?.vehicleCount ?? 0}
            description="Aktive Fahrzeuge in der Flotte"
            icon={Car}
            isLoading={statsLoading}
          />
          <StatCard
            title="Fahrer"
            value={stats?.driverCount ?? 0}
            description="Registrierte Fahrer"
            icon={Users}
            isLoading={statsLoading}
          />
          <StatCard
            title="Offene Schäden"
            value={stats?.openDamages ?? 0}
            description="Schäden in Bearbeitung"
            icon={AlertTriangle}
            isLoading={statsLoading}
            variant={stats?.openDamages && stats.openDamages > 0 ? 'warning' : 'default'}
          />
          <StatCard
            title="Kosten (Monat)"
            value={formatCurrency(stats?.costsThisMonth ?? 0)}
            description="Ausgaben im aktuellen Monat"
            icon={Receipt}
            isLoading={statsLoading}
          />
        </div>

        {/* Schnellaktionen */}
        <QuickActions />

        {/* Warnungen und Aktivitäten */}
        <div className="grid gap-6 lg:grid-cols-2">
          <WarningCard
            appointments={warnings ?? []}
            isLoading={warningsLoading}
          />
          <RecentActivity
            activities={activities ?? []}
            isLoading={activitiesLoading}
          />
        </div>
      </div>
    </>
  );
}
