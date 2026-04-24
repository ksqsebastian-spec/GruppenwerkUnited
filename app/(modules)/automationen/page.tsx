'use client';

import { DateiBrowser } from '@/components/automationen/datei-browser';
import { PageHeader } from '@/components/shared/page-header';

export default function AutomatisierungenPage(): React.JSX.Element {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="shrink-0 px-6 py-4 border-b border-[#e5e5e5]">
        <PageHeader
          title="Automatisierungen"
          description="Navigiere durch die Ordnerstruktur und sammle Kontext-Bausteine für deinen KI-Prompt."
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <DateiBrowser />
      </div>
    </div>
  );
}
