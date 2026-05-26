'use client';

import { useState } from 'react';
import { Eye, EyeOff, Globe, Trash2, Pencil } from 'lucide-react';
import type { ConsultingCredential } from '@/types';

interface Props {
  credential: ConsultingCredential;
  unlocked: boolean;
  onEdit: (credential: ConsultingCredential) => void;
  onDelete: (id: string) => void;
}

function FaviconImage({ url, title }: { url: string | null; title: string }): React.JSX.Element {
  const [error, setError] = useState(false);
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

  if (!src || error) {
    return <Globe className="h-5 w-5 text-[#c0c0c0] shrink-0" />;
  }
  return (
    <img
      src={src}
      alt={title}
      className="h-5 w-5 rounded-sm shrink-0 object-contain"
      onError={() => setError(true)}
    />
  );
}

export function ConsultingCredentialRow({
  credential,
  unlocked,
  onEdit,
  onDelete,
}: Props): React.JSX.Element {
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const displayPassword =
    !unlocked
      ? '••••••••'
      : showPassword
        ? (credential.password ?? '')
        : '••••••••';

  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-[#fafafa] border-b border-[#f0f0f0] last:border-b-0">
      <FaviconImage url={credential.url} title={credential.title} />

      {/* Title + username */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium text-[#000000] leading-tight truncate">
            {credential.title}
          </p>
          {credential.url && (
            <a
              href={credential.url.startsWith('http') ? credential.url : `https://${credential.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#a3a3a3] hover:text-[#000000] transition-colors shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {credential.url.replace(/^https?:\/\//, '').split('/')[0]}
            </a>
          )}
        </div>
        {credential.username && (
          <p className="text-[11px] text-[#737373] mt-0.5 truncate">{credential.username}</p>
        )}
        {credential.notes && (
          <p className="text-[11px] text-[#a3a3a3] mt-0.5 truncate">{credential.notes}</p>
        )}
      </div>

      {/* Password */}
      {credential.password && (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[12px] font-mono text-[#404040]">{displayPassword}</span>
          {unlocked && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="p-1 rounded text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f0f0f0] transition-colors"
              title={showPassword ? 'Verbergen' : 'Anzeigen'}
            >
              {showPassword ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Cost */}
      {credential.cost_monthly != null && credential.cost_monthly > 0 && (
        <span className="text-[12px] text-[#737373] tabular-nums shrink-0">
          {Number(credential.cost_monthly).toLocaleString('de-DE', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          })}
          /Monat
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {confirmDelete ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onDelete(credential.id)}
              className="text-[10px] text-[#EF4444] font-medium hover:underline"
            >
              Löschen
            </button>
            <span className="text-[#c0c0c0] text-[10px]">·</span>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-[10px] text-[#a3a3a3] hover:underline"
            >
              Abbrechen
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onEdit(credential)}
              className="p-1.5 rounded text-[#a3a3a3] hover:text-[#000000] hover:bg-[#f0f0f0] transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded text-[#c0c0c0] hover:text-[#EF4444] hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
