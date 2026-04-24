'use client';

import { useState } from 'react';
import { ChevronRight, Copy, Check, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAppTypKonfiguration } from '@/lib/automationen/app-typen';
import type { AutomatisierungsKnoten } from '@/types';

interface AutomatisierungenBrowserProps {
  knoten: AutomatisierungsKnoten[];
}

export function AutomatisierungenBrowser({ knoten }: AutomatisierungenBrowserProps): React.JSX.Element {
  // Navigations-Pfad: jedes Element ist die ID des gewählten Knotens auf dieser Tiefe
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  // Aktuell ausgewählter Blatt-Knoten (mit Prompt)
  const [selectedLeaf, setSelectedLeaf] = useState<AutomatisierungsKnoten | null>(null);
  const [kopiert, setKopiert] = useState(false);

  const getChildren = (parentId: string | null): AutomatisierungsKnoten[] =>
    knoten
      .filter((n) => n.parent_id === parentId)
      .sort((a, b) => a.position - b.position);

  const handleKnotenClick = (node: AutomatisierungsKnoten, depth: number): void => {
    if (node.prompt_template !== null) {
      setSelectedLeaf(node);
      return;
    }
    // Kategorie-Knoten: in diesen Ordner navigieren
    const newPath = selectedPath.slice(0, depth);
    newPath.push(node.id);
    setSelectedPath(newPath);
    setSelectedLeaf(null);
  };

  const handleKopieren = async (): Promise<void> => {
    if (!selectedLeaf?.prompt_template) return;
    try {
      await navigator.clipboard.writeText(selectedLeaf.prompt_template);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = selectedLeaf.prompt_template;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setKopiert(true);
    setTimeout(() => setKopiert(false), 2000);
  };

  // Spalten-Parents: null = Wurzel, dann die IDs aus dem Pfad
  const spaltenParents: (string | null)[] = [null, ...selectedPath];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Linke Seite: Spalten-Browser */}
      <div className="flex flex-1 overflow-x-auto">
        {spaltenParents.map((parentId, depth) => {
          const children = getChildren(parentId);
          if (depth > 0 && children.length === 0) return null;
          return (
            <div
              key={`spalte-${depth}-${parentId ?? 'root'}`}
              className="flex flex-col min-w-[260px] w-[260px] border-r border-border overflow-y-auto shrink-0"
            >
              {children.map((node) => {
                const config = getAppTypKonfiguration(node.app_type);
                const Logo = config.Logo;
                const isLeaf = node.prompt_template !== null;
                const isAktiv =
                  selectedPath[depth] === node.id || selectedLeaf?.id === node.id;

                return (
                  <button
                    key={node.id}
                    onClick={() => handleKnotenClick(node, depth)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-left w-full border-b border-border/50 transition-colors',
                      isAktiv ? 'bg-muted' : 'hover:bg-muted/50'
                    )}
                  >
                    {/* Service-Logo aus /public/logos/ via app_type */}
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: config.helleFarbe }}
                    >
                      <Logo size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {node.title}
                      </p>
                      {node.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {node.description}
                        </p>
                      )}
                    </div>

                    {!isLeaf && (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Rechte Seite: Kontext-Bausteine */}
      <div className="w-80 shrink-0 flex flex-col border-l border-border bg-background">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Kontext-Bausteine</h3>
        </div>

        {selectedLeaf ? (
          <div className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto">
            <div className="flex items-center gap-2">
              {(() => {
                const cfg = getAppTypKonfiguration(selectedLeaf.app_type);
                const Logo = cfg.Logo;
                return (
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: cfg.helleFarbe }}
                  >
                    <Logo size={14} />
                  </div>
                );
              })()}
              <p className="text-xs font-semibold text-foreground truncate">
                {selectedLeaf.title}
              </p>
            </div>

            {selectedLeaf.gdrive_path && (
              <p className="text-[11px] text-muted-foreground font-mono bg-muted rounded px-2 py-1 truncate">
                {selectedLeaf.gdrive_path}
              </p>
            )}

            <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed bg-muted/50 rounded-lg p-3 flex-1 overflow-y-auto">
              {selectedLeaf.prompt_template}
            </pre>

            <button
              onClick={handleKopieren}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors shrink-0',
                kopiert
                  ? 'bg-green-100 text-green-700'
                  : 'bg-foreground text-background hover:bg-foreground/90'
              )}
            >
              {kopiert ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {kopiert ? 'Kopiert!' : 'Prompt kopieren'}
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Klicke auf Ordner oder Dateien links um Kontext-Bausteine für deinen KI-Prompt zu sammeln.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
