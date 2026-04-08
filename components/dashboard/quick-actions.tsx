'use client';

import Link from 'next/link';
import { Plus, Car, Users, Calendar, AlertTriangle, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

const quickActions: QuickAction[] = [
  {
    label: 'Neues Fahrzeug',
    href: '/vehicles/new',
    icon: Car,
    description: 'Fahrzeug zur Flotte hinzufügen',
  },
  {
    label: 'Neuer Fahrer',
    href: '/drivers/new',
    icon: Users,
    description: 'Fahrer registrieren',
  },
  {
    label: 'Neuer Termin',
    href: '/appointments/new',
    icon: Calendar,
    description: 'Wartung oder Prüfung planen',
  },
  {
    label: 'Schaden melden',
    href: '/damages/new',
    icon: AlertTriangle,
    description: 'Schaden dokumentieren',
  },
  {
    label: 'Kosten erfassen',
    href: '/costs/new',
    icon: Receipt,
    description: 'Ausgabe eintragen',
  },
];

/**
 * Schnellaktionen für häufig genutzte Funktionen
 */
export function QuickActions(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Schnellaktionen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.href}
                variant="outline"
                className="h-auto flex-col py-4 px-3"
                asChild
              >
                <Link href={action.href}>
                  <Icon className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">{action.label}</span>
                  <span className="text-xs text-muted-foreground mt-1 hidden md:block">
                    {action.description}
                  </span>
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
