"use client";

import { useEffect, useState, useCallback } from "react";
import { Copy, Check, Mail, User, ArrowRight, FileDown } from "lucide-react";
import type { EmpfehlungWithStelle } from "@/types/recruiting";
import { Card } from "../_components/ui/Card";
import { Button } from "../_components/ui/Button";
import { formatCurrency } from "@/lib/modules/recruiting/utils";
import {
  generateAusgezahltEmail,
  generateOutlookLink,
} from "@/lib/modules/recruiting/email-templates";
import { generateReceipt } from "@/lib/modules/recruiting/pdf-receipt";

export default function EmailConfiguratorPage(): React.JSX.Element {
  const [empfehlungen, setEmpfehlungen] = useState<EmpfehlungWithStelle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [copied, setCopied] = useState<"subject" | "body" | "all" | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/recruiting/stellen?view=empfehlungen&pageSize=100");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmpfehlungen(data.data || []);
    } catch {
      setEmpfehlungen([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selected = empfehlungen.find((e) => e.id === selectedId);

  const generatedEmail = selected
    ? generateAusgezahltEmail({
        empfehlerName: selected.empfehler_name,
        empfehlerEmail: selected.empfehler_email,
        refCode: selected.ref_code,
        praemieBetrag: selected.praemie_betrag ?? 0,
      })
    : null;

  async function copyToClipboard(text: string, type: "subject" | "body" | "all"): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  const outlookLink =
    selected && generatedEmail
      ? generateOutlookLink(selected.empfehler_email, generatedEmail.subject, generatedEmail.body)
      : "";

  return (
    <div className="animate-fadeIn flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">E-Mail Konfigurator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Wähle eine Empfehlung, um die Auszahlungs-E-Mail zu generieren.
        </p>
      </div>

      {/* Empfehlung cards */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Empfehlung auswählen
        </p>

        {loading ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            Wird geladen...
          </Card>
        ) : empfehlungen.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            Keine Empfehlungen vorhanden.
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {empfehlungen.map((emp) => {
              const isSelected = selectedId === emp.id;
              return (
                <button
                  key={emp.id}
                  onClick={() => setSelectedId(emp.id)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-colors ${
                    isSelected
                      ? "border-foreground bg-muted"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-foreground" : "bg-muted"}`}>
                    <User size={18} className={isSelected ? "text-background" : "text-muted-foreground"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{emp.empfehler_name}</span>
                      <ArrowRight size={13} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{emp.stelle?.title ?? emp.kandidat_name}</span>
                    </div>
                    <div className="flex items-center gap-2.5 mt-1">
                      <span className="font-mono text-xs font-semibold text-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                        {emp.ref_code}
                      </span>
                      {emp.praemie_betrag && (
                        <span className="text-xs font-semibold text-foreground">
                          {formatCurrency(emp.praemie_betrag)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Generierte E-Mail */}
      {generatedEmail && selected && (
        <Card className="p-0 overflow-hidden">
          {/* Betreff-Header */}
          <div className="flex justify-between items-center px-6 py-5 bg-foreground border-b border-border rounded-t-xl">
            <div>
              <span className="text-[11px] text-background/50 font-semibold uppercase tracking-wider">
                Betreff
              </span>
              <div className="text-base font-semibold mt-1 text-background">
                {generatedEmail.subject}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(generatedEmail.subject, "subject")}
              aria-label="Betreff kopieren"
              className="text-background/70 hover:text-background hover:bg-white/10"
            >
              {copied === "subject" ? <Check size={16} /> : <Copy size={16} />}
            </Button>
          </div>

          {/* Nachrichtentext */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Nachricht
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(generatedEmail.body, "body")}
                aria-label="Nachricht kopieren"
              >
                {copied === "body" ? (
                  <><Check size={14} /> Kopiert</>
                ) : (
                  <><Copy size={14} /> Kopieren</>
                )}
              </Button>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground bg-muted p-6 rounded-xl border border-border m-0">
              {generatedEmail.body}
            </pre>
          </div>

          {/* Aktionen */}
          <div className="flex gap-3 px-6 py-5 border-t border-border flex-wrap">
            <Button
              size="lg"
              onClick={() =>
                copyToClipboard(
                  `Betreff: ${generatedEmail.subject}\n\n${generatedEmail.body}`,
                  "all"
                )
              }
            >
              {copied === "all" ? (
                <><Check size={18} /> Alles kopiert!</>
              ) : (
                <><Copy size={18} /> Alles kopieren</>
              )}
            </Button>
            <a href={outlookLink} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="lg">
                <Mail size={18} /> In Outlook öffnen
              </Button>
            </a>
            <Button
              variant="secondary"
              size="lg"
              onClick={async () => {
                try {
                  await generateReceipt({
                    empfehlung: selected,
                    emailSubject: generatedEmail.subject,
                    emailBody: generatedEmail.body,
                  });
                } catch {
                  alert("Fehler beim Erstellen des Belegs");
                }
              }}
            >
              <FileDown size={18} /> Beleg herunterladen
            </Button>
          </div>
        </Card>
      )}

      {!selectedId && !loading && empfehlungen.length > 0 && (
        <Card className="p-12 text-center">
          <Mail size={36} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Wähle oben eine Empfehlung aus, um die E-Mail zu generieren.
          </p>
        </Card>
      )}
    </div>
  );
}
