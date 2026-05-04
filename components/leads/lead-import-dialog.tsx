'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImportLeads } from '@/hooks/use-leads';

interface LeadImportDialogProps {
  onClose: () => void;
}

interface ImportErgebnis {
  imported: number;
  total: number;
}

export function LeadImportDialog({ onClose }: LeadImportDialogProps): React.JSX.Element {
  const [datei, setDatei] = useState<File | null>(null);
  const [ergebnis, setErgebnis] = useState<ImportErgebnis | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importLeads = useImportLeads();

  const handleDateiAuswahl = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      setDatei(file);
      setErgebnis(null);
      setFehler(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.csv')) {
      setDatei(file);
      setErgebnis(null);
      setFehler(null);
    }
  };

  const handleImport = (): void => {
    if (!datei) return;
    setFehler(null);
    importLeads.mutate(datei, {
      onSuccess: (data) => {
        setErgebnis(data as unknown as ImportErgebnis);
      },
      onError: (err) => {
        setFehler(err instanceof Error ? err.message : 'Import fehlgeschlagen.');
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f0]">
          <h2 className="text-lg font-semibold text-[#000]">CSV importieren</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors">
            <X className="h-4 w-4 text-[#737373]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {!ergebnis ? (
            <>
              {/* Drop-Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#e5e5e5] rounded-xl p-8 text-center cursor-pointer hover:border-[#000] hover:bg-[#fafafa] transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleDateiAuswahl}
                />
                {datei ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-[#000]" />
                    <p className="text-sm font-medium text-[#000]">{datei.name}</p>
                    <p className="text-xs text-[#a3a3a3]">
                      {(datei.size / 1024).toFixed(0)} KB — Andere Datei wählen
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-[#a3a3a3]" />
                    <p className="text-sm font-medium text-[#262626]">CSV-Datei hierher ziehen</p>
                    <p className="text-xs text-[#a3a3a3]">oder klicken zum Auswählen</p>
                  </div>
                )}
              </div>

              <p className="text-xs text-[#a3a3a3]">
                Unterstützte Spalten: First Name, Last Name, Email, Phone, Company, Title, LinkedIn URL, City, Country, Industry, Notes
              </p>

              {fehler && (
                <div className="flex items-center gap-2 rounded-lg bg-[#fef2f2] px-3 py-2 text-sm text-[#dc2626]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {fehler}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle className="h-12 w-12 text-[#16a34a]" />
              <div className="text-center">
                <p className="text-lg font-semibold text-[#000]">Import abgeschlossen</p>
                <p className="text-sm text-[#737373] mt-1">
                  {ergebnis.imported} Lead{ergebnis.imported !== 1 ? 's' : ''} importiert
                  {ergebnis.total > ergebnis.imported && `, ${ergebnis.total - ergebnis.imported} übersprungen`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#f0f0f0] flex justify-end gap-2">
          {ergebnis ? (
            <Button onClick={onClose} className="rounded-lg bg-[#000] text-white hover:bg-[#262626]">
              Schließen
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} className="rounded-lg">Abbrechen</Button>
              <Button
                onClick={handleImport}
                disabled={!datei || importLeads.isPending}
                className="rounded-lg bg-[#000] text-white hover:bg-[#262626]"
              >
                {importLeads.isPending ? 'Wird importiert…' : 'Importieren'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
