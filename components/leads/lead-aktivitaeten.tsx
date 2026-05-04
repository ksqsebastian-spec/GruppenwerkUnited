'use client';

import { useState, useRef } from 'react';
import { Send, Trash2, Paperclip, Download, FileText, Image, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDatum } from '@/lib/leads/farben';
import {
  useKommentare, useAddKommentar, useDeleteKommentar,
  useDateien, useUploadDatei, useDeleteDatei,
} from '@/hooks/use-leads';
import type { LeadDatei } from '@/types';

interface LeadAktivitaetenProps {
  leadId: string;
}

function DateiIcon({ typ }: { typ: string | null }): React.JSX.Element {
  if (typ?.includes('pdf')) return <FileText className="h-4 w-4 text-[#dc2626]" />;
  if (typ?.includes('image')) return <Image className="h-4 w-4 text-[#2563eb]" />;
  return <File className="h-4 w-4 text-[#737373]" />;
}

function DateiGroesse(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function dateiDownload(datei: LeadDatei): Promise<void> {
  const res = await fetch(`/api/leads/${datei.lead_id}/dateien/${datei.id}`);
  if (!res.ok) return;
  const { url, dateiname } = await res.json() as { url: string; dateiname: string };
  const a = document.createElement('a');
  a.href = url;
  a.download = dateiname;
  a.target = '_blank';
  a.click();
}

export function LeadAktivitaeten({ leadId }: LeadAktivitaetenProps): React.JSX.Element {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: kommentare = [], isLoading: kLoading } = useKommentare(leadId);
  const { data: dateien = [], isLoading: dLoading } = useDateien(leadId);
  const addKommentar = useAddKommentar();
  const deleteKommentar = useDeleteKommentar();
  const uploadDatei = useUploadDatei();
  const deleteDatei = useDeleteDatei();

  const handleKommentar = (): void => {
    if (!text.trim()) return;
    addKommentar.mutate({ leadId, text: text.trim() }, {
      onSuccess: () => setText(''),
    });
  };

  const handleDateiUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) uploadDatei.mutate({ leadId, file });
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Datei-Anhänge */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
            Anhänge {dateien.length > 0 && `(${dateien.length})`}
          </h4>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleDateiUpload}
            accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadDatei.isPending}
            className="h-7 text-xs rounded-lg"
          >
            <Paperclip className="h-3 w-3 mr-1" />
            Datei anhängen
          </Button>
        </div>

        {dLoading ? (
          <p className="text-xs text-[#a3a3a3]">Wird geladen…</p>
        ) : dateien.length === 0 ? (
          <p className="text-xs text-[#a3a3a3]">Noch keine Anhänge.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {dateien.map((d) => (
              <div key={d.id} className="flex items-center gap-2 rounded-lg border border-[#e5e5e5] px-3 py-2 bg-[#fafafa]">
                <DateiIcon typ={d.dateityp} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#262626] truncate">{d.dateiname}</p>
                  <p className="text-[11px] text-[#a3a3a3]">{DateiGroesse(d.dateigroesse)}</p>
                </div>
                <button
                  onClick={() => dateiDownload(d)}
                  className="p-1 rounded text-[#a3a3a3] hover:text-[#2563eb] transition-colors"
                  title="Herunterladen"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { if (confirm('Datei löschen?')) deleteDatei.mutate({ leadId, dateiId: d.id }); }}
                  className="p-1 rounded text-[#a3a3a3] hover:text-[#dc2626] transition-colors"
                  title="Löschen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kommentare */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#737373] mb-3">
          Kommentare {kommentare.length > 0 && `(${kommentare.length})`}
        </h4>

        {kLoading ? (
          <p className="text-xs text-[#a3a3a3]">Wird geladen…</p>
        ) : kommentare.length === 0 ? (
          <p className="text-xs text-[#a3a3a3] mb-3">Noch keine Kommentare.</p>
        ) : (
          <div className="flex flex-col gap-2 mb-3">
            {kommentare.map((k) => (
              <div key={k.id} className="group flex gap-2">
                <div className="flex-1 rounded-lg border border-[#e5e5e5] px-3 py-2 bg-white">
                  <p className="text-[13px] text-[#262626] whitespace-pre-wrap">{k.text}</p>
                  <p className="text-[11px] text-[#a3a3a3] mt-1">{formatDatum(k.created_at)}</p>
                </div>
                <button
                  onClick={() => deleteKommentar.mutate({ leadId, kommentarId: k.id })}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#a3a3a3] hover:text-[#dc2626] transition-all self-start mt-1"
                  title="Löschen"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Eingabe */}
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleKommentar(); }}
            placeholder="Kommentar hinzufügen… (Strg+Enter)"
            rows={2}
            className="flex-1 text-sm rounded-lg border border-[#e5e5e5] px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#000] focus:ring-offset-0"
          />
          <Button
            onClick={handleKommentar}
            disabled={!text.trim() || addKommentar.isPending}
            size="sm"
            className="self-end rounded-lg bg-[#000] text-white hover:bg-[#262626] h-9"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
