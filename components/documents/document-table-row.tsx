'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Download, ExternalLink, MoreHorizontal, Trash2 } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Document } from '@/types';
import {
  formatFileSize,
  getEntityDescription,
  getEntityIcon,
  getEntityLabel,
  getEntityUrl,
  getFileIcon,
} from './document-table-helpers';

interface DocumentTableRowProps {
  doc: Document;
  onOpen: (doc: Document) => void | Promise<void>;
  onDownload: (doc: Document) => void | Promise<void>;
  onDelete: (doc: Document) => void;
}

export function DocumentTableRow({ doc, onOpen, onDownload, onDelete }: DocumentTableRowProps): React.JSX.Element {
  const entityUrl = getEntityUrl(doc);

  return (
    <TableRow>
      <TableCell>{getFileIcon(doc.mime_type)}</TableCell>
      <TableCell>
        <button onClick={() => onOpen(doc)} className="font-medium hover:underline text-left">
          {doc.name}
        </button>
        {doc.notes && (
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{doc.notes}</p>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline">{doc.document_type?.name ?? '-'}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {getEntityIcon(doc.entity_type)}
          <div>
            <span className="text-xs text-muted-foreground">{getEntityLabel(doc.entity_type)}</span>
            {entityUrl ? (
              <Link href={entityUrl} className="block text-sm hover:underline">
                {getEntityDescription(doc)}
              </Link>
            ) : (
              <span className="block text-sm">{getEntityDescription(doc)}</span>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>{format(new Date(doc.uploaded_at), 'dd.MM.yyyy HH:mm', { locale: de })}</TableCell>
      <TableCell>{formatFileSize(doc.file_size)}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Aktionen öffnen</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onOpen(doc)}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Öffnen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(doc)}>
              <Download className="mr-2 h-4 w-4" />
              Herunterladen
            </DropdownMenuItem>
            {entityUrl && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={entityUrl}>
                    {getEntityIcon(doc.entity_type)}
                    <span className="ml-2">Zur {getEntityLabel(doc.entity_type)}</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(doc)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
