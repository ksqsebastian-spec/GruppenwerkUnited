'use client';

import Link from 'next/link';
import { Wrench, ArrowRight, Clock, LogOut } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { MODULES, MODULE_ICONS, type ModuleConfig } from '@/lib/modules';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

function ModuleRow({ module }: { module: ModuleConfig }): React.JSX.Element {
  const Icon = MODULE_ICONS[module.icon] ?? Wrench;
  const isComingSoon = module.status === 'coming_soon';

  const inner = (
    <div
      className={`group flex items-center gap-4 px-5 py-3.5 transition-colors
        ${isComingSoon
          ? 'cursor-not-allowed opacity-40'
          : 'hover:bg-[#f5f5f5] cursor-pointer'
        }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5] group-hover:bg-white transition-colors">
        <Icon className="h-4 w-4 text-[#000000]" />
      </div>
      <div className="flex-1 flex items-baseline gap-6 min-w-0">
        <span className="shrink-0 text-[14px] font-medium text-[#000000] w-44">
          {module.name}
        </span>
        <span className="text-[13px] text-[#737373] truncate">
          {module.description}
        </span>
      </div>
      {isComingSoon ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#f0f0f0] px-2.5 py-0.5 text-[11px] font-medium text-[#a3a3a3]">
          <Clock className="h-3 w-3" />
          Bald
        </span>
      ) : (
        <ArrowRight className="h-4 w-4 shrink-0 text-[#d4d4d4] transition-all group-hover:text-[#000000] group-hover:translate-x-0.5" />
      )}
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
      <div className="max-w-2xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#a3a3a3] mb-1">
              Eingeloggt als
            </p>
            <h1 className="text-2xl font-medium text-[#000000] tracking-tight">
              {company?.companyName ?? '…'}
            </h1>
            <p className="text-sm text-[#a3a3a3] mt-1">
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

        {/* Modul-Liste */}
        {visibleModules.length === 0 ? (
          <div className="text-center py-16 text-sm text-[#737373]">
            Keine Module verfügbar.
          </div>
        ) : (
          <div className="rounded-xl border border-[#e5e5e5] bg-white overflow-hidden divide-y divide-[#f0f0f0]">
            {visibleModules.map((mod) => (
              <ModuleRow key={mod.id} module={mod} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
