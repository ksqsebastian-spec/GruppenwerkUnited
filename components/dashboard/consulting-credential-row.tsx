'use client';

import { useState } from 'react';
import { Eye, EyeOff, Globe, Trash2, Pencil, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import type { ConsultingCredential } from '@/types';

interface Props {
  credential: ConsultingCredential;
  unlocked: boolean;
  onEdit: (credential: ConsultingCredential) => void;
  onDelete: (id: string) => void;
}

function FaviconImage({ url, logoUrl, title }: { url: string | null; logoUrl: string | null; title: string }): React.JSX.Element {
  const [faviconError, setFaviconError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  if (logoUrl && !logoError) {
    return (
      <img
        src={logoUrl}
        alt={title}
        className="h-6 w-6 rounded-sm shrink-0 object-contain"
        onError={() => setLogoError(true)}
      />
    );
  }

  const domain = url
    ? (() => {
        try {
          return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
        } catch {
          return null;
        }
      })()
    : null;
  const src = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
    : null;

  if (!src || faviconError) {
    return <Globe className="h-5 w-5 text-[#c0c0c0] shrink-0" />;
  }
  return (
    <img
      src={src}
      alt={title}
      className="h-5 w-5 rounded-sm shrink-0 object-contain"
      onError={() => setFaviconError(true)}
    />
  );
}

function CopyButton({ value }: { value: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); void handleCopy(); }}
      className="p-1 rounded text-[#c0c0c0] hover:text-[#404040] hover:bg-[#f0f0f0] transition-colors"
      title="Kopieren"
    >
      {copied ? <Check className="h-3 w-3 text-[#22C55E]" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export function ConsultingCredentialRow({ credential, unlocked, onEdit, onDelete }: Props): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const domain = credential.url
    ? (() => {
        try {
          return new URL(credential.url.startsWith('http') ? credential.url : `https://${credential.url}`).hostname;
        } catch { return null; }
      })()
    : null;

  const displayPassword = !unlocked
    ? '••••••••'
    : showPassword
      ? (credential.password ?? '')
      : '••••••••';

  return (
    <div className="border-b border-[#f0f0f0] last:border-b-0">
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fafafa] transition-colors text-left"
      >
        <FaviconImage url={credential.url} logoUrl={credential.logo_url} title={credential.title} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[#000000] leading-tight truncate">{credential.title}</p>
          {domain && <p className="text-[11px] text-[#a3a3a3] mt-0.5">{domain}</p>}
        </div>
        {credential.username && (
          <p className="text-[11px] text-[#737373] truncate max-w-[160px] shrink-0 hidden sm:block">
            {credential.username}
          </p>
        )}
        {expanded
          ? <ChevronDown className="h-3.5 w-3.5 text-[#a3a3a3] shrink-0" />
          : <ChevronRight className="h-3.5 w-3.5 text-[#a3a3a3] shrink-0" />}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 bg-[#fafafa] flex flex-col gap-2.5 border-t border-[#f0f0f0]">
          {credential.url && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#a3a3a3] w-24 shrink-0">URL</span>
              <a
                href={credential.url.startsWith('http') ? credential.url : `https://${credential.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-[#3B82F6] hover:underline truncate flex-1"
                onClick={(e) => e.stopPropagation()}
              >
                {credential.url}
              </a>
              <CopyButton value={credential.url.startsWith('http') ? credential.url : `https://${credential.url}`} />
            </div>
          )}

          {credential.username && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#a3a3a3] w-24 shrink-0">Benutzername</span>
              <span className="text-[12px] text-[#404040] truncate flex-1">{credential.username}</span>
              <CopyButton value={credential.username} />
            </div>
          )}

          {credential.password && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#a3a3a3] w-24 shrink-0">Passwort</span>
              <span className="text-[12px] font-mono text-[#404040] flex-1">{displayPassword}</span>
              {unlocked && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowPassword((v) => !v); }}
                    className="p-1 rounded text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f0f0f0] transition-colors"
                    title={showPassword ? 'Verbergen' : 'Anzeigen'}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <CopyButton value={credential.password} />
                </>
              )}
            </div>
          )}

          {credential.cost_monthly != null && credential.cost_monthly > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#a3a3a3] w-24 shrink-0">Kosten/Monat</span>
              <span className="text-[12px] text-[#404040]">
                {Number(credential.cost_monthly).toLocaleString('de-DE', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}

          {credential.notes && (
            <div className="flex items-start gap-2">
              <span className="text-[11px] text-[#a3a3a3] w-24 shrink-0 pt-0.5">Notizen</span>
              <span className="text-[12px] text-[#737373] flex-1">{credential.notes}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t border-[#efefef] mt-0.5">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDelete(credential.id)}
                  className="text-[11px] text-[#EF4444] font-medium hover:underline"
                >
                  Löschen bestätigen
                </button>
                <span className="text-[#c0c0c0] text-[10px]">·</span>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-[11px] text-[#a3a3a3] hover:underline"
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onEdit(credential)}
                  className="flex items-center gap-1 text-[11px] text-[#737373] hover:text-[#000000] transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Bearbeiten
                </button>
                <span className="text-[#e5e5e5]">|</span>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1 text-[11px] text-[#c0c0c0] hover:text-[#EF4444] transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Löschen
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
