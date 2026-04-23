'use client';

import Link from 'next/link';
import { Wrench, ArrowRight, Clock, LogOut } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { MODULES, MODULE_ICONS, type ModuleConfig } from '@/lib/modules';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

function ModuleCard({
  module,
  wide = false,
}: {
  module: ModuleConfig;
  wide?: boolean;
}): React.JSX.Element {
  const Icon = MODULE_ICONS[module.icon] ?? Wrench;
  const isComingSoon = module.status === 'coming_soon';

  const inner = wide ? (
    /* Breite horizontale Variante für vereinzelte letzte Karte */
    <div
      className={`group flex items-center gap-5 rounded-xl border border-[#e5e5e5] bg-white px-6 py-5 transition-all
        ${isComingSoon
          ? 'cursor-not-allowed opacity-50'
          : 'hover:border-[#a3a3a3] cursor-pointer'
        }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f5]">
        <Icon className="h-5 w-5 text-[#000000]" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-[#000000]">{module.name}</h3>
        <p className="mt-0.5 text-sm text-[#737373]">{module.description}</p>
      </div>
      {isComingSoon ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#e5e5e5] px-2.5 py-0.5 text-xs font-medium text-[#737373]">
          <Clock className="h-3 w-3" />
          Bald
        </span>
      ) : (
        <ArrowRight className="h-5 w-5 shrink-0 text-[#a3a3a3] transition-transform group-hover:translate-x-0.5 group-hover:text-[#000000]" />
      )}
    </div>
  ) : (
    /* Standard vertikale Karte */
    <div
      className={`group relative flex flex-col gap-4 rounded-xl border border-[#e5e5e5] bg-white p-6 transition-all
        ${isComingSoon
          ? 'cursor-not-allowed opacity-50'
          : 'hover:border-[#a3a3a3] cursor-pointer'
        }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5f5f5]">
          <Icon className="h-5 w-5 text-[#000000]" />
        </div>
        {isComingSoon ? (
          <span className="flex items-center gap-1 rounded-full bg-[#e5e5e5] px-2.5 py-0.5 text-xs font-medium text-[#737373]">
            <Clock className="h-3 w-3" />
            Bald
          </span>
        ) : (
          <ArrowRight className="h-5 w-5 text-[#a3a3a3] transition-transform group-hover:translate-x-0.5 group-hover:text-[#000000]" />
        )}
      </div>
      <div>
        <h3 className="font-medium text-[#000000]">{module.name}</h3>
        <p className="mt-1 text-sm text-[#737373] leading-relaxed">{module.description}</p>
      </div>
    </div>
  );

  if (isComingSoon) return inner;
  return <Link href={module.route}>{inner}</Link>;
}

export default function WerkbankDashboard(): React.JSX.Element {
  const { company, signOut } = useAuth();
  const router = useRouter();

  const allowedModules = company?.allowedModules;
  const visibleModules = MODULES.filter((m) => {
    if (m.status === 'disabled') return false;
    if (allowedModules === '*') return true;
    if (Array.isArray(allowedModules)) return allowedModules.includes(m.id);
    return false;
  });

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
      toast.success('Erfolgreich abgemeldet');
      router.push('/login');
    } catch {
      toast.error('Abmelden fehlgeschlagen');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-8">

        {/* Willkommens-Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#737373] mb-1">
              Eingeloggt als
            </p>
            <h1 className="text-2xl font-medium text-[#000000] tracking-tight">
              {company?.companyName ?? '…'}
            </h1>
            <p className="text-sm text-[#737373] mt-1">
              {visibleModules.length === 1
                ? '1 Modul verfügbar'
                : `${visibleModules.length} Module verfügbar`}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#e5e5e5] text-sm font-medium text-[#737373] hover:bg-[#f5f5f5] hover:text-[#000000] transition-colors mt-1 shrink-0"
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </button>
        </div>

        {/* Trennlinie */}
        <div className="border-t border-[#e5e5e5]" />

        {/* Modul-Karten */}
        {visibleModules.length === 0 ? (
          <div className="text-center py-16 text-sm text-[#737373]">
            Keine Module verfügbar.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleModules.map((mod, i) => {
              const total = visibleModules.length;
              const isLast = i === total - 1;
              // Letzte Karte ist allein in einer Zeile → breite horizontale Variante
              const isOrphan = isLast && total % 3 === 1;
              return (
                <div key={mod.id} className={isOrphan ? 'sm:col-span-2 lg:col-span-3' : ''}>
                  <ModuleCard module={mod} wide={isOrphan} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
