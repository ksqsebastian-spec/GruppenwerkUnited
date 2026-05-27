'use client';

import { useState } from 'react';
import { DateiBrowser } from '@/components/automationen/datei-browser';
import { PageHeader } from '@/components/shared/page-header';

type Tab = 'automatisierungen' | 'handwerkshelfer';

export default function AutomatisierungenPage(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('automatisierungen');

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="shrink-0 px-6 py-4 border-b border-[#e5e5e5]">
        <PageHeader
          title="Automatisierungen"
          description="Navigiere durch die Ordnerstruktur und sammle Kontext-Bausteine für deinen KI-Prompt."
        />
        <div className="flex items-center gap-1 mt-4 border-b border-[#f0f0f0]">
          <button
            type="button"
            onClick={() => setTab('automatisierungen')}
            className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ${
              tab === 'automatisierungen'
                ? 'border-[#000000] text-[#000000]'
                : 'border-transparent text-[#a3a3a3] hover:text-[#000000]'
            }`}
          >
            Automatisierungen
          </button>
          <button
            type="button"
            onClick={() => setTab('handwerkshelfer')}
            className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ${
              tab === 'handwerkshelfer'
                ? 'border-[#000000] text-[#000000]'
                : 'border-transparent text-[#a3a3a3] hover:text-[#000000]'
            }`}
          >
            Handwerkshelfer
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === 'automatisierungen' ? (
          <DateiBrowser />
        ) : (
          <iframe
            src="/handwerkshelfer.html"
            className="w-full h-full border-0"
            title="Handwerkshelfer Cheat Sheet"
          />
        )}
      </div>
    </div>
  );
}
