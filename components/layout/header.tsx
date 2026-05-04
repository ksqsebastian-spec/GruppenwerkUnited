'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Menu, User, Wrench } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/providers/auth-provider';
import { MobileNav } from './mobile-nav';
import { MODULES, MODULE_ICONS } from '@/lib/modules';
import { cn } from '@/lib/utils';

export function Header(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const { company, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <>
      {/* Sticky Header – Ivory-Oberfläche mit Border Cream Trennlinie */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-x-3 border-b border-[#e5e5e5] bg-white px-4 sm:px-6 lg:px-8">

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menü öffnen</span>
        </Button>

        {/* Logo-Icon */}
        <Link href="/" className="flex items-center shrink-0">
          <Image src="/logos/ollama-icon.webp" width={26} height={26} alt="Gruppenwerk" className="rounded-md" />
        </Link>

        {/* Warme Trennlinie */}
        {visibleModules.length > 0 && (
          <div className="hidden lg:block h-5 w-px bg-[#e5e5e5] shrink-0" />
        )}

        {/* Horizontale Modul-Navigation */}
        <nav className="hidden lg:flex items-center gap-x-0.5 flex-1 overflow-x-auto">
          {visibleModules.map((mod) => {
            const Icon = MODULE_ICONS[mod.icon] ?? Wrench;
            const isActive = pathname === mod.route || pathname.startsWith(mod.route + '/');
            const isComingSoon = mod.status === 'coming_soon';
            return (
              <Link
                key={mod.id}
                href={isComingSoon ? '#' : mod.route}
                className={cn(
                  'flex items-center gap-1.5 transition-colors',
                  isActive
                    ? 'bg-[#e5e5e5] text-[#000000] font-medium rounded-full px-3 py-1.5 text-sm'
                    : isComingSoon
                      ? 'text-[#a3a3a3] cursor-not-allowed rounded-full px-3 py-1.5 text-sm'
                      : 'text-[#525252] hover:bg-[#f5f5f5] hover:text-[#000000] rounded-full px-3 py-1.5 text-sm'
                )}
                aria-disabled={isComingSoon}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {mod.name}
              </Link>
            );
          })}
        </nav>

        {/* Spacer für Mobile */}
        <div className="flex-1 lg:hidden" />

        {/* Benutzermenü */}
        <div className="flex items-center shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2 h-8 px-2">
                {/* Warm Sand Avatar – kein kühles Grau */}
                <div className="h-6 w-6 bg-[#f5f5f5] rounded-full flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-[#525252]" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-[#262626]">
                  {company?.companyName ?? 'Werkbank'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
    </>
  );
}
