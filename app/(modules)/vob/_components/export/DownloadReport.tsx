'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface DownloadReportProps {
  url: string | null
  label?: string
}

export function DownloadReport({ url, label = 'Bericht' }: DownloadReportProps) {
  if (!url) return null

  return (
    <a href={url} download target="_blank" rel="noopener noreferrer">
      <Button variant="outline" size="sm" className="text-[11px] text-neutral-500 border-neutral-200 hover:bg-neutral-50">
        <Download size={12} className="mr-1" />
        {label}
      </Button>
    </a>
  )
}
