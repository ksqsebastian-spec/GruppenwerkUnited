'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface ExportButtonProps {
  slug: string
  label?: string
}

export function ExportButton({ slug, label = 'PDF' }: ExportButtonProps): React.JSX.Element {
  const [loading, setLoading] = useState(false)

  async function handleExport(): Promise<void> {
    setLoading(true)
    try {
      const res = await fetch(`/api/export/${slug}`)
      const { company, tenders } = await res.json() as { company: { name: string }; tenders: unknown[] }
      const { generateCompanyPdf } = await import('@/lib/modules/vob/pdf-generator')
      const doc = await generateCompanyPdf(company.name, tenders as Parameters<typeof generateCompanyPdf>[1])
      const today = new Date().toISOString().slice(0, 10)
      doc.save(`VOB_${slug}_${today}.pdf`)
    } catch (e) {
      console.error('PDF-Export fehlgeschlagen:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-[11px] text-neutral-500 border-neutral-200 hover:bg-neutral-50"
      onClick={handleExport}
      disabled={loading}
    >
      <Download size={12} className="mr-1" />
      {loading ? '...' : label}
    </Button>
  )
}
