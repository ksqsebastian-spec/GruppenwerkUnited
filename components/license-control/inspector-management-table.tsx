'use client';

import { Archive, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LicenseCheckInspector } from '@/types';

interface InspectorManagementTableProps {
  activeInspectors: LicenseCheckInspector[];
  archivedInspectors: LicenseCheckInspector[];
  onEdit: (inspector: LicenseCheckInspector) => void;
  onArchive: (inspector: LicenseCheckInspector) => void;
}

/**
 * Tabellen-Darstellung aktiver und archivierter Prüfer.
 */
export function InspectorManagementTable({
  activeInspectors,
  archivedInspectors,
  onEdit,
  onArchive,
}: InspectorManagementTableProps): React.JSX.Element {
  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeInspectors.map((inspector) => (
              <TableRow key={inspector.id}>
                <TableCell className="font-medium">{inspector.name}</TableCell>
                <TableCell className="text-muted-foreground">{inspector.email || '-'}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Aktiv
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(inspector)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onArchive(inspector)}>
                      <Archive className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {archivedInspectors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Archivierte Prüfer ({archivedInspectors.length})
          </h4>
          <div className="border rounded-lg opacity-60">
            <Table>
              <TableBody>
                {archivedInspectors.map((inspector) => (
                  <TableRow key={inspector.id}>
                    <TableCell>{inspector.name}</TableCell>
                    <TableCell className="text-muted-foreground">{inspector.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Archiviert</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </>
  );
}
