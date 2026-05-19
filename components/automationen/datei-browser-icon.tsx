'use client';

import Image from 'next/image';
import { Folder, FileText, Table2, File, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DateiTyp } from '@/lib/automationen/ordner-struktur';

export function DateiIcon({
  type,
  logo,
  className,
}: {
  type: DateiTyp;
  logo?: string;
  className?: string;
}): React.JSX.Element {
  const base = cn('shrink-0', className);
  if (logo)
    return (
      <Image
        src={`/logos/${logo}`}
        width={16}
        height={16}
        alt=""
        className={cn('shrink-0 object-contain', className?.replace(/text-\S+/g, ''))}
      />
    );
  if (type === 'folder') return <Folder className={cn(base, 'text-[#3b82f6]')} />;
  if (type === 'docx') return <FileText className={cn(base, 'text-[#2563eb]')} />;
  if (type === 'sheet') return <Table2 className={cn(base, 'text-[#16a34a]')} />;
  if (type === 'pdf') return <File className={cn(base, 'text-[#dc2626]')} />;
  return <FileCode className={cn(base, 'text-[#d97706]')} />;
}
