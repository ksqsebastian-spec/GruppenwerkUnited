'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

/**
 * Exportierbare Datentypen
 */
const exportOptions = [
  { id: 'vehicles', label: 'Fahrzeuge', description: 'Alle Fahrzeugdaten' },
  { id: 'drivers', label: 'Fahrer', description: 'Alle Fahrerdaten' },
  { id: 'appointments', label: 'Termine', description: 'Alle Wartungs- und Prüftermine' },
  { id: 'damages', label: 'Schäden', description: 'Alle Schadensmeldungen' },
  { id: 'costs', label: 'Kosten', description: 'Alle Kosteneinträge' },
];

/**
 * Konvertiert Daten zu CSV
 */
function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((header) => {
      const value = row[header];
      // Escape Anführungszeichen und umschließe mit Anführungszeichen wenn nötig
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Triggert Download einer Datei
 */
function downloadFile(content: string, filename: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Komponente für den Datenexport
 */
export function DataExport(): JSX.Element {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleToggle = (id: string): void => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (): void => {
    if (selectedTypes.length === exportOptions.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes(exportOptions.map((o) => o.id));
    }
  };

  const handleExport = async (): Promise<void> => {
    if (selectedTypes.length === 0) {
      toast.error('Bitte wähle mindestens einen Datentyp aus');
      return;
    }

    setIsExporting(true);
    const timestamp = new Date().toISOString().split('T')[0];

    try {
      for (const type of selectedTypes) {
        let query;

        switch (type) {
          case 'vehicles':
            query = supabase.from('vehicles').select('*');
            break;
          case 'drivers':
            query = supabase.from('drivers').select('*');
            break;
          case 'appointments':
            query = supabase.from('appointments').select('*');
            break;
          case 'damages':
            query = supabase.from('damages').select('*');
            break;
          case 'costs':
            query = supabase.from('costs').select('*');
            break;
          default:
            continue;
        }

        const { data, error } = await query;

        if (error) {
          console.error(`Fehler beim Export von ${type}:`, error);
          toast.error(`Fehler beim Export von ${type}`);
          continue;
        }

        if (data && data.length > 0) {
          const csv = convertToCSV(data);
          downloadFile(csv, `fuhrpark_${type}_${timestamp}.csv`);
        } else {
          toast.info(`Keine Daten für ${type} vorhanden`);
        }
      }

      toast.success('Export erfolgreich abgeschlossen');
    } catch (error) {
      console.error('Fehler beim Export:', error);
      toast.error('Export fehlgeschlagen');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Daten exportieren
        </CardTitle>
        <CardDescription>
          Exportiere Fuhrparkdaten als CSV-Datei für die weitere Verarbeitung in Excel oder anderen Programmen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alle auswählen */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={selectedTypes.length === exportOptions.length}
            onCheckedChange={handleSelectAll}
          />
          <Label htmlFor="select-all" className="font-medium">
            Alle auswählen
          </Label>
        </div>

        {/* Export-Optionen */}
        <div className="grid gap-3 md:grid-cols-2">
          {exportOptions.map((option) => (
            <div
              key={option.id}
              className="flex items-start space-x-3 rounded-lg border p-3"
            >
              <Checkbox
                id={option.id}
                checked={selectedTypes.includes(option.id)}
                onCheckedChange={() => handleToggle(option.id)}
              />
              <div className="space-y-1">
                <Label htmlFor={option.id} className="font-medium cursor-pointer">
                  {option.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={selectedTypes.length === 0 || isExporting}
          className="w-full md:w-auto"
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {selectedTypes.length > 0
            ? `${selectedTypes.length} Datei(en) exportieren`
            : 'Daten exportieren'}
        </Button>
      </CardContent>
    </Card>
  );
}
