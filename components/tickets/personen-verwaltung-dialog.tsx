'use client';

import { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/providers/auth-provider';
import { usePersonen, useCreatePerson, useDeletePerson } from '@/hooks/use-personen';
import { firmaName as loginFirmaName } from '@/lib/tickets/config';
import { FIRMEN_OPTIONS, firmaDot } from '@/lib/tickets/firmen';
import { FirmaBadge } from '@/components/tickets/firma-badge';

interface PersonenVerwaltungDialogProps {
  onClose: () => void;
}

export function PersonenVerwaltungDialog({ onClose }: PersonenVerwaltungDialogProps): React.JSX.Element {
  const { company } = useAuth();
  const { data: personen = [] } = usePersonen();
  const create = useCreatePerson();
  const del = useDeletePerson();

  const [name, setName] = useState('');
  const [rolle, setRolle] = useState('');
  const [firma, setFirma] = useState('');

  const meineFirma = company?.companyId ?? '';
  const meinePersonen = personen.filter((p) => p.company === meineFirma);

  const handleAdd = (): void => {
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), email: null, rolle: rolle.trim() || null, firma: firma || null },
      {
        onSuccess: () => {
          setName('');
          setRolle('');
          setFirma('');
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f0]">
          <div>
            <h2 className="text-lg font-semibold text-[#000]">Personen</h2>
            <p className="text-xs text-[#a3a3a3] mt-0.5">{loginFirmaName(meineFirma)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors">
            <X className="h-4 w-4 text-[#737373]" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder="Max Mustermann"
                  className="h-9 rounded-lg border-[#e5e5e5] text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Rolle</label>
                <Input
                  value={rolle}
                  onChange={(e) => setRolle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder="optional"
                  className="h-9 rounded-lg border-[#e5e5e5] text-sm"
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">Firma</label>
                <select
                  value={firma}
                  onChange={(e) => setFirma(e.target.value)}
                  className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-white px-2.5 text-sm text-[#000] focus:outline-none focus:ring-2 focus:ring-[#e5e5e5]"
                >
                  <option value="">— Keine —</option>
                  {FIRMEN_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handleAdd} disabled={create.isPending || !name.trim()} className="h-9 rounded-lg shrink-0">
                <Plus className="mr-1.5 h-4 w-4" /> Hinzufügen
              </Button>
            </div>
          </div>

          {meinePersonen.length === 0 ? (
            <p className="text-xs text-[#a3a3a3] py-4 text-center">Noch keine Personen angelegt.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {meinePersonen.map((p) => (
                <li key={p.id} className="flex items-center gap-2 rounded-lg border border-[#f0f0f0] px-3 py-2">
                  {p.firma && (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: firmaDot(p.firma) }}
                      aria-hidden
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#000] truncate">{p.name}</p>
                    {p.rolle && <p className="text-[11px] text-[#a3a3a3]">{p.rolle}</p>}
                  </div>
                  {p.firma && <FirmaBadge firma={p.firma} />}
                  <button
                    onClick={() => del.mutate(p.id)}
                    className="p-1 rounded hover:bg-[#fee2e2] text-[#737373] hover:text-[#c0392b]"
                    title="Löschen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#f0f0f0] flex justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-lg">
            Schließen
          </Button>
        </div>
      </div>
    </div>
  );
}
