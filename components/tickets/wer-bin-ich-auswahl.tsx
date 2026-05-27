'use client';

import { UserCircle } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { usePersonen } from '@/hooks/use-personen';
import { useAktuellePerson } from '@/hooks/use-aktuelle-person';

export function WerBinIchAuswahl(): React.JSX.Element {
  const { company } = useAuth();
  const { data: personen = [] } = usePersonen();
  const [aktuellePerson, setAktuellePerson] = useAktuellePerson();

  const meineFirma = company?.companyId ?? '';
  const meinePersonen = personen.filter((p) => p.company === meineFirma);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#e5e5e5] bg-white px-3 h-9">
      <UserCircle className="h-4 w-4 text-[#a3a3a3] shrink-0" />
      <span className="text-xs text-[#a3a3a3] shrink-0">Ich bin:</span>
      <select
        value={aktuellePerson ?? ''}
        onChange={(e) => setAktuellePerson(e.target.value || null)}
        className="text-sm bg-transparent focus:outline-none text-[#000] max-w-[160px]"
      >
        <option value="">— wählen —</option>
        {meinePersonen.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
