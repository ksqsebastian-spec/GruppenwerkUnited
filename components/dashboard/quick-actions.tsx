'use client';

import Link from 'next/link';
import { Plus, Car, Users, Calendar, AlertTriangle, Receipt } from 'lucide-react';

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

const quickActions: QuickAction[] = [
  {
    label: 'Neues Fahrzeug',
    href: '/fuhrpark/vehicles/new',
    icon: Car,
    description: 'Fahrzeug zur Flotte hinzufügen',
  },
  {
    label: 'Neuer Fahrer',
    href: '/fuhrpark/drivers/new',
    icon: Users,
    description: 'Fahrer registrieren',
  },
  {
    label: 'Neuer Termin',
    href: '/fuhrpark/appointments/new',
    icon: Calendar,
    description: 'Wartung oder Prüfung planen',
  },
  {
    label: 'Schaden melden',
    href: '/fuhrpark/damages/new',
    icon: AlertTriangle,
    description: 'Schaden dokumentieren',
  },
  {
    label: 'Kosten erfassen',
    href: '/fuhrpark/costs/new',
    icon: Receipt,
    description: 'Ausgabe eintragen',
  },
];

/**
 * Schnellaktionen für häufig genutzte Funktionen
 */
export function QuickActions(): React.JSX.Element {
  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="p-4 border-b border-border">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground" />
          Schnellaktionen
        </p>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="bg-card border border-border rounded-xl p-4 hover:border-foreground/20 transition-colors flex flex-col items-center text-center"
              >
                <Icon className="h-5 w-5 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-foreground">{action.label}</span>
                <span className="text-xs text-muted-foreground mt-1 hidden md:block">
                  {action.description}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
