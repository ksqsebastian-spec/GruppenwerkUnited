'use client';

import { useRouter } from 'next/navigation';
import { Mail, Phone } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { KundeStatusBadge } from './kunde-status-badge';
import type { Customer } from '@/types';

interface KundenTabelleProps {
  kunden: Customer[];
}

export function KundenTabelle({ kunden }: KundenTabelleProps): React.JSX.Element {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Firma</TableHead>
            <TableHead>Ansprechpartner</TableHead>
            <TableHead>Kontakt</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Notizen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kunden.map((k) => (
            <TableRow
              key={k.id}
              className="cursor-pointer hover:bg-muted/40"
              onClick={() => router.push(`/kunden/${k.id}`)}
            >
              <TableCell className="font-medium">{k.firmenname}</TableCell>
              <TableCell>{k.ansprechpartner ?? '—'}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5 text-xs">
                  {k.email && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {k.email}
                    </span>
                  )}
                  {k.telefon && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {k.telefon}
                    </span>
                  )}
                  {!k.email && !k.telefon && <span className="text-muted-foreground">—</span>}
                </div>
              </TableCell>
              <TableCell>
                <KundeStatusBadge status={k.status} />
              </TableCell>
              <TableCell className="hidden max-w-md truncate text-xs text-muted-foreground md:table-cell">
                {k.notizen ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
