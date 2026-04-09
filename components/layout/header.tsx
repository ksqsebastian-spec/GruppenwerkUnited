'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, Wrench, User } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';
import { MODULES, MODULE_ICONS } from '@/lib/modules';
import { MobileNav } from './mobile-nav';

export function Header(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const { company, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sichtbare Tools nach Firmen-Zugangsberechtigung filtern
  const allowedModules = company?.allowedModules;
  const visibleTools = MODULES.filter((m) => {
    if (m.category !== 'tool') return false;
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
    <>
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Menü öffnen</span>
        </Button>

        {/* Mobile Logo */}
        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold">Werkbank</span>
        </Link>

        {/* Spacer + Tool-Navigation + Benutzermenü */}
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex flex-1" />

          {/* Tool-Navigation – nur Desktop */}
          <nav className="hidden lg:flex items-center gap-x-1">
            {visibleTools.map((tool) => {
              const Icon = MODULE_ICONS[tool.icon] ?? Wrench;
              const isActive = pathname.startsWith(tool.route);
              return (
                <Link
                  key={tool.id}
                  href={tool.status === 'coming_soon' ? '#' : tool.route}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tool.name}
                  {tool.status === 'coming_soon' && (
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                      Bald
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Benutzermenü */}
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
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
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
    </>
  );
}
