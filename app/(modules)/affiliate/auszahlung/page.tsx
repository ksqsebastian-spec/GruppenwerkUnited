"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Copy, Check, X, CreditCard, ArrowLeft } from "lucide-react";
import type { EmpfehlungWithHandwerker } from "@/types/affiliate";
import { StatCard } from "../_components/ui/StatCard";
import { Card } from "../_components/ui/Card";
import { Button } from "../_components/ui/Button";
import { formatDate, formatCurrency } from "@/lib/modules/affiliate/utils";

export default function AuszahlungPage(): JSX.Element {
  const [empfehlungen, setEmpfehlungen] = useState<EmpfehlungWithHandwerker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Inline-Bearbeitung für Provision und Betrag
  const [editingProvisionId, setEditingProvisionId] = useState<string | null>(null);
  const [editProvision, setEditProvision] = useState("");
  const [editingBetragId, setEditingBetragId] = useState<string | null>(null);
  const [editBetrag, setEditBetrag] = useState("");

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "25",
        status: "erledigt",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/affiliate/handwerker?view=empfehlungen&${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmpfehlungen(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setEmpfehlungen([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const debounce = setTimeout(fetchData, 300);
    return () => clearTimeout(debounce);
  }, [fetchData]);

  async function handleCopy(text: string, key: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback für ältere Browser
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleUpdateProvision(emp: EmpfehlungWithHandwerker): Promise<void> {
    const value = parseFloat(editProvision);
    if (isNaN(value) || value < 0) return;

    try {
      const res = await fetch("/api/affiliate/empfehlungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, provision_betrag: value }),
      });
      if (!res.ok) {
        alert("Fehler beim Aktualisieren");
        return;
      }
      setEditingProvisionId(null);
      fetchData();
    } catch {
      alert("Netzwerkfehler");
    }
  }

  async function handleUpdateBetrag(emp: EmpfehlungWithHandwerker): Promise<void> {
    const value = parseFloat(editBetrag);
    if (isNaN(value) || value < 0) return;

    try {
      const res = await fetch("/api/affiliate/empfehlungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, rechnungsbetrag: value }),
      });
      if (!res.ok) {
        alert("Fehler beim Aktualisieren");
        return;
      }
      setEditingBetragId(null);
      fetchData();
    } catch {
      alert("Netzwerkfehler");
    }
  }

  async function handleMoveBack(emp: EmpfehlungWithHandwerker): Promise<void> {
    try {
      const res = await fetch("/api/affiliate/empfehlungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, status: "offen" }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.detail || data.error || "Fehler");
        return;
      }
      fetchData();
    } catch {
      alert("Netzwerkfehler");
    }
  }

  async function handleMarkAusgezahlt(emp: EmpfehlungWithHandwerker): Promise<void> {
    if (!confirm(`"${emp.empfehler_name}" als ausgezahlt markieren und ins Archiv verschieben?`)) return;

    try {
      // Empfehlung auf ausgezahlt setzen
      const res = await fetch("/api/affiliate/empfehlungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, status: "ausgezahlt" }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.detail || data.error || "Fehler");
        return;
      }

      // Zugehörigen Handwerker archivieren
      if (emp.handwerker?.id) {
        await fetch("/api/affiliate/handwerker", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: emp.handwerker.id, active: false }),
        });
      }

      fetchData();
    } catch {
      alert("Netzwerkfehler");
    }
  }

  const totalProvision = empfehlungen.reduce((sum, e) => sum + (e.provision_betrag ?? 0), 0);

  // Kopierfeld-Hilfskomponente für Zahlungsdaten
  function CopyField({ label, value, copyKey }: { label: string; value: string | null; copyKey: string }): JSX.Element | null {
    if (!value) return null;
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[80px]">
          {label}
        </span>
        <span className="flex-1 text-sm font-semibold font-mono text-foreground">{value}</span>
        <button
          onClick={() => handleCopy(value, copyKey)}
          className="p-1 rounded cursor-pointer border-0 bg-transparent hover:bg-border transition-colors"
          title="Kopieren"
        >
          {copied === copyKey
            ? <Check size={14} className="text-[#16a34a]" />
            : <Copy size={14} className="text-muted-foreground" />
          }
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn flex flex-col gap-8">
      {/* Seitenkopf */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Auszahlung</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Erledigte Affiliates zur Auszahlung. Daten einsehen, Provision anpassen, als ausgezahlt markieren.
        </p>
      </div>

      {/* Statistik-Raster */}
      <div className="grid grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border">
        <StatCard label="Zur Auszahlung" value={total} />
        <StatCard label="Gesamt Provision" value={formatCurrency(totalProvision)} />
      </div>

      {/* Suche */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl">
        <Search size={16} className="text-muted-foreground shrink-0" />
        <input
          placeholder="Name, Ref-Code suchen..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      {/* Tabelle */}
      <Card className="p-0 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted">
              {["Affiliate", "Kunde", "Ref", "Betrag", "Provision", "Datum", "Aktionen"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Wird geladen...
                </td>
              </tr>
            ) : empfehlungen.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Keine Einträge zur Auszahlung
                </td>
              </tr>
            ) : (
              empfehlungen.map((emp) => (
                <>
                  <tr
                    key={emp.id}
                    className={`border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${expandedId === emp.id ? "bg-muted/30" : ""}`}
                    onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
                  >
                    {/* Affiliate */}
                    <td className="px-4 py-3 text-sm text-foreground font-semibold">
                      {emp.empfehler_name}
                      <div className="text-xs text-muted-foreground font-normal">{emp.empfehler_email}</div>
                    </td>

                    {/* Kunde */}
                    <td className="px-4 py-3 text-sm text-foreground">
                      {emp.handwerker?.name ?? "–"}
                      {emp.handwerker?.telefon && (
                        <div className="text-xs text-muted-foreground">{emp.handwerker.telefon}</div>
                      )}
                    </td>

                    {/* Ref-Code */}
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                      {emp.ref_code}
                    </td>

                    {/* Betrag (inline editierbar) */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {editingBetragId === emp.id ? (
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editBetrag}
                            onChange={(e) => setEditBetrag(e.target.value)}
                            className="w-24 px-2 py-1.5 border border-border rounded-lg text-sm font-semibold bg-card text-foreground outline-none focus:border-foreground/40"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateBetrag(emp);
                              if (e.key === "Escape") setEditingBetragId(null);
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateBetrag(emp)}
                            className="p-1.5 bg-[#16a34a] rounded-md flex items-center cursor-pointer border-0"
                          >
                            <Check size={12} color="white" />
                          </button>
                          <button
                            onClick={() => setEditingBetragId(null)}
                            className="p-1.5 bg-muted rounded-md flex items-center cursor-pointer border border-border"
                          >
                            <X size={12} className="text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingBetragId(emp.id);
                            setEditBetrag(emp.rechnungsbetrag ? String(emp.rechnungsbetrag) : "");
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer ${emp.rechnungsbetrag ? "text-foreground" : "text-muted-foreground"}`}
                          title="Klicke um Betrag einzutragen"
                        >
                          {emp.rechnungsbetrag ? formatCurrency(emp.rechnungsbetrag) : "–"}
                        </button>
                      )}
                    </td>

                    {/* Provision (inline editierbar) */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {editingProvisionId === emp.id ? (
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editProvision}
                            onChange={(e) => setEditProvision(e.target.value)}
                            className="w-24 px-2 py-1.5 border border-border rounded-lg text-sm font-semibold bg-card text-foreground outline-none focus:border-foreground/40"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateProvision(emp);
                              if (e.key === "Escape") setEditingProvisionId(null);
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateProvision(emp)}
                            className="p-1.5 bg-[#16a34a] rounded-md flex items-center cursor-pointer border-0"
                          >
                            <Check size={12} color="white" />
                          </button>
                          <button
                            onClick={() => setEditingProvisionId(null)}
                            className="p-1.5 bg-muted rounded-md flex items-center cursor-pointer border border-border"
                          >
                            <X size={12} className="text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingProvisionId(emp.id);
                            setEditProvision(emp.provision_betrag ? String(emp.provision_betrag) : "");
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer ${emp.provision_betrag ? "text-foreground" : "text-muted-foreground"}`}
                          title="Klicke um Provision anzupassen"
                        >
                          {emp.provision_betrag ? formatCurrency(emp.provision_betrag) : "–"}
                        </button>
                      )}
                    </td>

                    {/* Datum */}
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(emp.created_at)}
                    </td>

                    {/* Aktionen */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleMoveBack(emp)}
                          className="flex items-center gap-1"
                          title="Zurück zu Affiliate (offen)"
                        >
                          <ArrowLeft size={12} /> Zurück
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleMarkAusgezahlt(emp)}
                          className="flex items-center gap-1"
                        >
                          <CreditCard size={12} /> Ausgezahlt
                        </Button>
                      </div>
                    </td>
                  </tr>

                  {/* Ausgeklappte Zahlungsdaten */}
                  {expandedId === emp.id && (
                    <tr key={`${emp.id}-detail`} className="border-b border-border bg-muted/20">
                      <td colSpan={7} className="px-4 pb-4 pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                          <div className="col-span-full text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">
                            Zahlungsdaten
                          </div>
                          <CopyField label="PayPal" value={emp.empfehler_email} copyKey={`${emp.id}-paypal`} />
                          <CopyField label="IBAN" value={emp.iban} copyKey={`${emp.id}-iban`} />
                          <CopyField label="BIC" value={emp.bic} copyKey={`${emp.id}-bic`} />
                          <CopyField label="Inhaber" value={emp.kontoinhaber} copyKey={`${emp.id}-inhaber`} />
                          <CopyField label="Bank" value={emp.bank_name} copyKey={`${emp.id}-bank`} />
                          <CopyField
                            label="Provision"
                            value={emp.provision_betrag ? formatCurrency(emp.provision_betrag) : null}
                            copyKey={`${emp.id}-prov`}
                          />
                          {(!emp.iban && !emp.bic && !emp.kontoinhaber && !emp.bank_name) && (
                            <div className="col-span-full text-xs text-muted-foreground italic">
                              Keine Bankdaten hinterlegt. PayPal-E-Mail wird oben angezeigt.
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Pagination */}
      {total > 25 && (
        <div className="flex justify-center gap-3 items-center">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-6 py-2.5 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Zurück
          </button>
          <span className="px-5 py-2 text-sm font-semibold text-foreground">
            Seite {page} von {Math.ceil(total / 25)}
          </span>
          <button
            disabled={page * 25 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-6 py-2.5 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}
