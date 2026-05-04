'use client';

import Link from 'next/link';
import { Wrench, Clock, LogOut, Download } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { MODULES, MODULE_ICONS, type ModuleConfig } from '@/lib/modules';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DataExportButton } from '@/components/shared/data-export-button';

function ModuleCard({ module }: { module: ModuleConfig }): React.JSX.Element {
  const Icon = MODULE_ICONS[module.icon] ?? Wrench;
  const isComingSoon = module.status === 'coming_soon';

  const inner = (
    <div
      className={`group relative flex flex-col items-center gap-3 rounded-2xl border border-[#e5e5e5] bg-white p-5 text-center transition-all
        ${isComingSoon
          ? 'cursor-not-allowed opacity-40'
          : 'hover:border-[#000] hover:shadow-sm cursor-pointer'
        }`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5f5f5] group-hover:bg-[#f0f0f0] transition-colors">
        <Icon className="h-5 w-5 text-[#000000]" />
      </div>
      <div>
        <p className="text-[13px] font-semibold text-[#000000] leading-tight">{module.name}</p>
        <p className="text-[11px] text-[#a3a3a3] mt-0.5 leading-snug line-clamp-2">{module.description}</p>
      </div>
      {isComingSoon && (
        <span className="absolute top-2.5 right-2.5 flex items-center gap-0.5 rounded-full bg-[#f0f0f0] px-2 py-0.5 text-[10px] font-medium text-[#a3a3a3]">
          <Clock className="h-2.5 w-2.5" />
          Bald
        </span>
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
      <div className="max-w-3xl mx-auto flex flex-col gap-8 px-4 py-6 md:px-0">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#a3a3a3] mb-0.5">
              Eingeloggt als
            </p>
            <h1 className="text-xl font-semibold text-[#000000] tracking-tight">
              {company?.companyName ?? '…'}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <DataExportButton companyName={company?.companyName ?? ''} />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#e5e5e5] text-sm font-medium text-[#737373] hover:bg-[#f5f5f5] hover:text-[#000000] transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Abmelden
            </button>
          </div>
        </div>

        {/* Modul-Grid */}
        {visibleModules.length === 0 ? (
          <div className="text-center py-16 text-sm text-[#737373]">
            Keine Module verfügbar.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {visibleModules.map((mod) => (
              <ModuleCard key={mod.id} module={mod} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
