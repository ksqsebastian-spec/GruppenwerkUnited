'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useLeads } from '@/hooks/use-leads';
import { useKunden, useImportLeadsAlsKunden } from '@/hooks/use-kunden';

interface LeadsImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadsImportDialog({ open, onOpenChange }: LeadsImportDialogProps): React.JSX.Element {
  const [suche, setSuche] = useState('');
  const [ausgewaehlt, setAusgewaehlt] = useState<Set<string>>(new Set());

  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: kunden = [] } = useKunden();
  const importer = useImportLeadsAlsKunden();

  // Schon vorhandene Kunden-Firmennamen — case-insensitiv
  const vorhandeneFirmen = useMemo(
    () => new Set(kunden.map((k) => k.firmenname.toLowerCase())),
    [kunden],
  );

  // Nur Leads mit Firma anzeigen; Duplikate als „bereits Kunde" markieren
  const angezeigt = useMemo(() => {
    const s = suche.trim().toLowerCase();
    return leads
      .filter((l) => l.firma && l.firma.trim() !== '')
      .filter((l) => {
        if (!s) return true;
        return (
          (l.firma ?? '').toLowerCase().includes(s) ||
          `${l.vorname} ${l.nachname}`.toLowerCase().includes(s) ||
          (l.email ?? '').toLowerCase().includes(s)
        );
      })
      .map((l) => ({ lead: l, schonKunde: vorhandeneFirmen.has((l.firma ?? '').toLowerCase()) }));
  }, [leads, suche, vorhandeneFirmen]);

  const auswaehlbar = angezeigt.filter((a) => !a.schonKunde);
  const alleAusgewaehlt = auswaehlbar.length > 0 && auswaehlbar.every((a) => ausgewaehlt.has(a.lead.id));

  useEffect(() => {
    if (!open) {
      setAusgewaehlt(new Set());
      setSuche('');
    }
  }, [open]);

  const toggle = (id: string): void => {
    setAusgewaehlt((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAlle = (): void => {
    setAusgewaehlt((prev) => {
      if (alleAusgewaehlt) {
        const next = new Set(prev);
        for (const a of auswaehlbar) next.delete(a.lead.id);
        return next;
      }
      const next = new Set(prev);
      for (const a of auswaehlbar) next.add(a.lead.id);
      return next;
    });
  };

  const handleImport = async (): Promise<void> => {
    if (ausgewaehlt.size === 0) return;
    try {
      await importer.mutateAsync([...ausgewaehlt]);
      onOpenChange(false);
    } catch {
      // Toast vom Hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aus Leads übernehmen</DialogTitle>
          <DialogDescription>
            Wähle Leads aus, die als Kunden angelegt werden sollen. Firmenname, Ansprechpartner,
            Kontakt und Adresse werden übernommen; Status wird auf „Prospect" gesetzt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Suchen nach Firma, Name, E-Mail…"
                value={suche}
                onChange={(e) => setSuche(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={toggleAlle} disabled={auswaehlbar.length === 0}>
              {alleAusgewaehlt ? 'Auswahl aufheben' : 'Alle auswählen'}
            </Button>
          </div>

          {leadsLoading ? (
            <LoadingSpinner size="sm" text="Leads werden geladen…" />
          ) : angezeigt.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              Keine Leads mit Firma gefunden.
            </div>
          ) : (
            <ul className="max-h-[50vh] divide-y divide-border overflow-y-auto rounded-md border border-border bg-card">
              {angezeigt.map(({ lead, schonKunde }) => {
                const checked = ausgewaehlt.has(lead.id);
                return (
                  <li
                    key={lead.id}
                    className="flex items-start gap-3 p-3"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => !schonKunde && toggle(lead.id)}
                      disabled={schonKunde}
                      aria-label={`${lead.firma} auswählen`}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{lead.firma}</p>
                      <p className="text-xs text-muted-foreground">
                        {[lead.vorname, lead.nachname].filter(Boolean).join(' ')}
                        {lead.email && ` · ${lead.email}`}
                        {lead.telefon && ` · ${lead.telefon}`}
                      </p>
                      {(lead.stadt || lead.land) && (
                        <p className="text-xs text-muted-foreground">
                          {[lead.stadt, lead.land].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                    {schonKunde && (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        bereits Kunde
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="sticky bottom-0 border-t bg-background pt-3">
          <span className="mr-auto text-xs text-muted-foreground">
            {ausgewaehlt.size} ausgewählt
          </span>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={importer.isPending}>
            Abbrechen
          </Button>
          <Button type="button" onClick={handleImport} disabled={ausgewaehlt.size === 0 || importer.isPending}>
            {importer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {ausgewaehlt.size > 0 ? `${ausgewaehlt.size} übernehmen` : 'Übernehmen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
