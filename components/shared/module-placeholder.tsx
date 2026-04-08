'use client';

import Link from 'next/link';
import { Construction, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModulePlaceholderProps {
  /** Modulname für den Anzeigetext */
  moduleName: string;
}

/**
 * Platzhalterseite für Module, die noch migriert werden.
 * Wird durch das echte Modul ersetzt, sobald es migriert wurde.
 */
export function ModulePlaceholder({ moduleName }: ModulePlaceholderProps): React.JSX.Element {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
        <Construction className="h-10 w-10 text-gray-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">{moduleName} wird migriert</h2>
        <p className="max-w-sm text-sm text-gray-500 leading-relaxed">
          Dieses Modul wird gerade in die Werkbank-Plattform integriert und ist in
          Kürze verfügbar.
        </p>
      </div>
      <Button variant="outline" asChild>
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Übersicht
        </Link>
      </Button>
    </div>
  );
}
