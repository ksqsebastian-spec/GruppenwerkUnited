'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, PanelLeftClose, PanelLeftOpen, Wrench } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/components/providers/auth-provider';
import { MODULES, MODULE_ICONS } from '@/lib/modules';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * Einklappbare Seitenleiste für die Hauptnavigation (Desktop).
 * Ersetzt den früheren horizontalen Header, um vertikalen Platz zu sparen.
 * Im eingeklappten Zustand werden nur Icons angezeigt.
 */
export function AppSidebar({ collapsed, onToggle }: AppSidebarProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const { company, signOut } = useAuth();

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
      toast.success('Erfolgreich abgemeldet');
      router.push('/login');
    } catch {
      toast.error('Abmelden fehlgeschlagen');
    }
  };

  const allowedModules = company?.allowedModules;
  const visibleModules = MODULES.filter((m) => {
    if (allowedModules === '*') return true;
    if (Array.isArray(allowedModules)) return allowedModules.includes(m.id);
    return false;
  });

  const itemBase =
    'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors';

  return (
    <aside
      className={cn(
        'hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex-col border-r border-border bg-card transition-[width] duration-200',
        collapsed ? 'lg:w-16' : 'lg:w-64',
      )}
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center border-b border-border px-3">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-primary flex items-center justify-center shadow-ring-dark">
            <span className="text-xs font-bold text-primary-foreground leading-none tracking-tight">GW</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-base text-foreground tracking-tight whitespace-nowrap">
              Werkbank
            </span>
          )}
        </Link>
      </div>

      {/* Modul-Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {visibleModules.map((mod) => {
            const Icon = MODULE_ICONS[mod.icon] ?? Wrench;
            const isActive = pathname === mod.route || pathname.startsWith(mod.route + '/');
            const isComingSoon = mod.status === 'coming_soon';
            return (
              <li key={mod.id}>
                <Link
                  href={isComingSoon ? '#' : mod.route}
                  title={collapsed ? mod.name : undefined}
                  aria-disabled={isComingSoon}
                  className={cn(
                    itemBase,
                    collapsed && 'justify-center',
                    isActive
                      ? 'bg-foreground/10 text-foreground font-semibold'
                      : isComingSoon
                        ? 'text-muted-foreground/40 cursor-not-allowed'
                        : 'text-foreground/70 hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="truncate">{mod.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Fußbereich: Einklappen + Firma + Abmelden */}
      <div className="shrink-0 border-t border-border p-2 flex flex-col gap-0.5">
        <button
          onClick={onToggle}
          title={collapsed ? 'Menü ausklappen' : 'Menü einklappen'}
          className={cn(
            itemBase,
            'w-full text-muted-foreground hover:bg-secondary hover:text-foreground',
            collapsed && 'justify-center',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5 shrink-0" />
              <span className="truncate">Einklappen</span>
            </>
          )}
        </button>

        <button
          onClick={handleSignOut}
          title={collapsed ? `Abmelden (${company?.companyName ?? 'Werkbank'})` : 'Abmelden'}
          className={cn(
            itemBase,
            'w-full text-muted-foreground hover:bg-secondary hover:text-foreground',
            collapsed && 'justify-center',
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="truncate">{company?.companyName ?? 'Abmelden'}</span>}
        </button>
      </div>
    </aside>
  );
}
