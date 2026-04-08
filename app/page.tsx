'use client';

import Link from 'next/link';
import { Wrench, ArrowRight, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { MODULES, MODULE_ICONS, type ModuleConfig } from '@/lib/modules';

interface ModuleCardProps {
  module: ModuleConfig;
}

/**
 * Modul-Karte auf dem Werkbank-Dashboard
 */
function ModuleCard({ module }: ModuleCardProps): React.JSX.Element {
  const Icon = MODULE_ICONS[module.icon] ?? Wrench;
  const isComingSoon = module.status === 'coming_soon';

  const cardContent = (
    <div
      className={`group relative flex flex-col gap-4 rounded-xl border bg-white p-6 transition-all
        ${isComingSoon
          ? 'cursor-not-allowed opacity-60'
          : 'hover:border-primary/40 hover:shadow-md cursor-pointer'
        }`}
    >
      {/* Icon + Firmen-Farbbalken */}
      <div className="flex items-start justify-between">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg"
          style={{
            backgroundColor: module.companyColor
              ? `${module.companyColor}15`
              : 'hsl(var(--primary) / 0.1)',
          }}
        >
          <Icon
            className="h-6 w-6"
            style={{ color: module.companyColor ?? 'hsl(var(--primary))' }}
          />
        </div>

        {isComingSoon ? (
          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
            <Clock className="h-3 w-3" />
            Bald verfügbar
          </span>
        ) : (
          <ArrowRight className="h-5 w-5 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        )}
      </div>

      {/* Titel + Beschreibung */}
      <div>
        <h3 className="font-semibold text-gray-900">{module.name}</h3>
        <p className="mt-1 text-sm text-gray-500 leading-relaxed">{module.description}</p>
      </div>

      {/* Firmen-Label (nur bei company-Modulen) */}
      {module.category === 'company' && module.companyName && (
        <div className="mt-auto">
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: module.companyColor ? `${module.companyColor}15` : '#e5e7eb',
              color: module.companyColor ?? '#6b7280',
            }}
          >
            {module.companyName}
          </span>
        </div>
      )}
    </div>
  );

  if (isComingSoon) {
    return cardContent;
  }

  return <Link href={module.route}>{cardContent}</Link>;
}

/**
 * Werkbank Haupt-Dashboard
 * Zeigt alle verfügbaren Module als klickbare Karten an.
 * Neue Module werden automatisch angezeigt, wenn sie in lib/modules.ts eingetragen werden.
 */
export default function WerkbankDashboard(): React.JSX.Element {
  // Module nach Kategorie gruppieren
  const toolModules = MODULES.filter((m) => m.category === 'tool');
  const companyGroups = MODULES.filter((m) => m.category === 'company').reduce<
    Record<string, ModuleConfig[]>
  >((acc, mod) => {
    const key = mod.company ?? 'sonstige';
    if (!acc[key]) acc[key] = [];
    acc[key].push(mod);
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="space-y-10">
        {/* Begrüßung */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Werkbank</h1>
          <p className="mt-1 text-gray-500">
            Wähle ein Modul, um zu starten.
          </p>
        </div>

        {/* Allgemeine Tools */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Tools
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {toolModules.map((mod) => (
              <ModuleCard key={mod.id} module={mod} />
            ))}
          </div>
        </section>

        {/* Firmen-Module */}
        {Object.entries(companyGroups).map(([company, modules]) => {
          const companyName = modules[0]?.companyName ?? company;
          return (
            <section key={company}>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                {companyName}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {modules.map((mod) => (
                  <ModuleCard key={mod.id} module={mod} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AppLayout>
  );
}
