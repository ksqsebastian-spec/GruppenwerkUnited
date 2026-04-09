'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface DownloadReportProps {
  url: string | null
  label?: string
}

export function DownloadReport({ url, label = 'Bericht' }: DownloadReportProps): React.JSX.Element | null {
  if (!url) return null

  return (
    <a href={url} download target="_blank" rel="noopener noreferrer">
      <Button variant="outline" size="sm" className="text-xs text-muted-foreground border-border hover:bg-muted hover:text-foreground">
        <Download size={12} className="mr-1" />
        {label}
      </Button>
    </a>
  )
}
