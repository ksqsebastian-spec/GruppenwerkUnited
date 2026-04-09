"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Copy, Check, X, CreditCard, ArrowLeft } from "lucide-react";
import type { EmpfehlungWithStelle } from "@/types/recruiting";
import { StatCard } from "../_components/ui/StatCard";
import { Card } from "../_components/ui/Card";
import { formatDate, formatCurrency } from "@/lib/modules/recruiting/utils";

export default function AuszahlungPage(): React.JSX.Element {
  const [empfehlungen, setEmpfehlungen] = useState<EmpfehlungWithStelle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Inline-Bearbeitung der Prämie
  const [editingPraemieId, setEditingPraemieId] = useState<string | null>(null);
  const [editPraemie, setEditPraemie] = useState("");

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "25",
        status: "probezeit_bestanden",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/recruiting/stellen?view=empfehlungen&${params}`);
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

  async function handleUpdatePraemie(emp: EmpfehlungWithStelle): Promise<void> {
    const value = parseFloat(editPraemie);
    if (isNaN(value) || value < 0) return;

    try {
      const res = await fetch("/api/recruiting/empfehlungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, praemie_betrag: value }),
      });
      if (!res.ok) {
        alert("Fehler beim Aktualisieren");
        return;
      }
      setEditingPraemieId(null);
      fetchData();
    } catch {
      alert("Netzwerkfehler");
    }
  }

  async function handleMoveBack(emp: EmpfehlungWithStelle): Promise<void> {
    try {
      const res = await fetch("/api/recruiting/empfehlungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, status: "eingestellt" }),
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

  async function handleMarkAusgezahlt(emp: EmpfehlungWithStelle): Promise<void> {
    if (!confirm(`"${emp.empfehler_name}" als ausgezahlt markieren und ins Archiv verschieben?`)) return;

    try {
      const res = await fetch("/api/recruiting/empfehlungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, status: "ausgezahlt" }),
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

  const totalPraemie = empfehlungen.reduce((sum, e) => sum + (e.praemie_betrag ?? 0), 0);

  // Kopierfeld für Bankdaten
  function CopyField({ label, value, copyKey }: { label: string; value: string | null; copyKey: string }): React.JSX.Element | null {
    if (!value) return null;
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide min-w-[70px]">{label}</span>
        <span className="flex-1 text-sm font-medium font-mono text-foreground">{value}</span>
        <button
          onClick={() => handleCopy(value, copyKey)}
          className="p-1 rounded cursor-pointer hover:bg-border transition-colors"
          title="Kopieren"
        >
          {copied === copyKey ? <Check size={13} className="text-green-600" /> : <Copy size={13} className="text-muted-foreground" />}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn flex flex-col gap-8">
      {/* Seitenheader */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Auszahlung</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Empfehlungen nach bestandener Probezeit. Prämie anpassen und als ausgezahlt markieren.
        </p>
      </div>

      {/* Statistik-Raster */}
      <div className="grid grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border">
        <StatCard label="Zur Auszahlung" value={total} />
        <StatCard label="Gesamt Prämien" value={formatCurrency(totalPraemie)} />
      </div>

      {/* Suchleiste */}
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
            <tr className="border-b border-border bg-muted/50">
              {["Empfehler", "Stelle", "Ref", "Prämie", "Datum", "Aktionen"].map((h) => (
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
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Wird geladen...
                </td>
              </tr>
            ) : empfehlungen.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Keine Einträge zur Auszahlung
                </td>
              </tr>
            ) : (
              empfehlungen.map((emp) => (
                <>
                  <tr
                    key={emp.id}
                    className={`border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${expandedId === emp.id ? "bg-muted/30 border-b-0" : ""}`}
                    onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
                  >
                    {/* Empfehler */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-foreground">{emp.empfehler_name}</span>
                      <div className="text-xs text-muted-foreground">{emp.empfehler_email}</div>
                    </td>

                    {/* Stelle */}
                    <td className="px-4 py-3 text-sm text-foreground">
                      {emp.stelle?.title ?? "–"}
                    </td>

                    {/* Ref-Code */}
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground font-semibold">
                      {emp.ref_code}
                    </td>

                    {/* Prämie (inline bearbeitbar) */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {editingPraemieId === emp.id ? (
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editPraemie}
                            onChange={(e) => setEditPraemie(e.target.value)}
                            className="w-24 px-2 py-1.5 border border-border rounded-lg text-sm font-semibold bg-card text-foreground outline-none focus:border-foreground/30"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdatePraemie(emp);
                              if (e.key === "Escape") setEditingPraemieId(null);
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdatePraemie(emp)}
                            className="p-1.5 bg-green-600 rounded-md flex items-center cursor-pointer border-none"
                          >
                            <Check size={12} color="white" />
                          </button>
                          <button
                            onClick={() => setEditingPraemieId(null)}
                            className="p-1.5 bg-muted border border-border rounded-md flex items-center cursor-pointer"
                          >
                            <X size={12} className="text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPraemieId(emp.id);
                            setEditPraemie(emp.praemie_betrag ? String(emp.praemie_betrag) : "");
                          }}
                          className={`text-xs px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                            emp.praemie_betrag
                              ? "border-green-600 text-green-700 hover:bg-green-50"
                              : "border-border text-muted-foreground hover:bg-muted"
                          }`}
                          title="Klicke um Prämie anzupassen"
                        >
                          {emp.praemie_betrag ? formatCurrency(emp.praemie_betrag) : "–"}
                        </button>
                      )}
                    </td>

                    {/* Datum */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(emp.created_at)}
                    </td>

                    {/* Aktionen */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMoveBack(emp)}
                          className="text-xs px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1 cursor-pointer"
                          title="Zurück zu Eingestellt"
                        >
                          <ArrowLeft size={12} /> Zurück
                        </button>
                        <button
                          onClick={() => handleMarkAusgezahlt(emp)}
                          className="text-xs px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <CreditCard size={12} /> Ausgezahlt
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Ausgeklappt: Zahlungsdaten */}
                  {expandedId === emp.id && (
                    <tr key={`${emp.id}-detail`} className="border-b border-border bg-muted/20">
                      <td colSpan={6} className="px-4 pb-4 pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
                          <div className="col-span-full text-[10px] font-semibold text-muted-foreground uppercase tracking-widest py-2">
                            Zahlungsdaten
                          </div>
                          <CopyField label="E-Mail" value={emp.empfehler_email} copyKey={`${emp.id}-email`} />
                          <CopyField label="IBAN" value={emp.iban} copyKey={`${emp.id}-iban`} />
                          <CopyField label="BIC" value={emp.bic} copyKey={`${emp.id}-bic`} />
                          <CopyField label="Inhaber" value={emp.kontoinhaber} copyKey={`${emp.id}-inhaber`} />
                          <CopyField label="Bank" value={emp.bank_name} copyKey={`${emp.id}-bank`} />
                          <CopyField label="Prämie" value={emp.praemie_betrag ? formatCurrency(emp.praemie_betrag) : null} copyKey={`${emp.id}-praemie`} />
                          {(!emp.iban && !emp.bic && !emp.kontoinhaber && !emp.bank_name) && (
                            <div className="col-span-full text-xs text-muted-foreground italic">
                              Keine Bankdaten hinterlegt. E-Mail wird oben angezeigt.
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

      {/* Seitenwechsel */}
      {total > 25 && (
        <div className="flex justify-center gap-3 items-center">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-5 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Zurück
          </button>
          <span className="px-4 py-2 text-sm font-medium text-muted-foreground">
            Seite {page} von {Math.ceil(total / 25)}
          </span>
          <button
            disabled={page * 25 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-5 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}
