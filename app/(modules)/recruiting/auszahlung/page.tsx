"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Copy, Check, X, CreditCard, ArrowLeft } from "lucide-react";
import type { EmpfehlungWithStelle } from "@/types/recruiting";
import { StatCard } from "../_components/ui/StatCard";
import { Card } from "../_components/ui/Card";
import { Button } from "../_components/ui/Button";
import { formatDate, formatCurrency } from "@/lib/modules/recruiting/utils";

export default function AuszahlungPage() {
  const [empfehlungen, setEmpfehlungen] = useState<EmpfehlungWithStelle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Inline editing for praemie
  const [editingPraemieId, setEditingPraemieId] = useState<string | null>(null);
  const [editPraemie, setEditPraemie] = useState("");

  const fetchData = useCallback(async () => {
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

  async function handleCopy(text: string, key: string) {
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

  async function handleUpdatePraemie(emp: EmpfehlungWithStelle) {
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

  async function handleMoveBack(emp: EmpfehlungWithStelle) {
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

  async function handleMarkAusgezahlt(emp: EmpfehlungWithStelle) {
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

  const cellStyle = { padding: "14px 16px" };

  function CopyField({ label, value, copyKey }: { label: string; value: string | null; copyKey: string }) {
    if (!value) return null;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", backgroundColor: "#f8f7f4", borderRadius: "10px", border: "1px solid var(--border)" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", minWidth: "80px" }}>{label}</span>
        <span style={{ flex: 1, fontSize: "14px", fontWeight: 600, fontFamily: "monospace", color: "var(--navy)" }}>{value}</span>
        <button
          onClick={() => handleCopy(value, copyKey)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px", display: "flex", alignItems: "center" }}
          title="Kopieren"
        >
          {copied === copyKey ? <Check size={14} color="#16a34a" /> : <Copy size={14} color="var(--text-muted)" />}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div>
        <h1 style={{ fontSize: "32px", fontWeight: 800, margin: 0, color: "var(--navy)" }}>Auszahlung</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "15px", margin: "8px 0 0 0" }}>
          Empfehlungen nach bestandener Probezeit. Prämie anpassen und als ausgezahlt markieren.
        </p>
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <StatCard label="Zur Auszahlung" value={total} bgColor="#f0fdf4" color="#16a34a" />
        <StatCard label="Gesamt Prämien" value={formatCurrency(totalPraemie)} bgColor="#f5f3ff" color="#7c3aed" />
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 18px", backgroundColor: "white", border: "2px solid var(--border)", borderRadius: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <Search size={20} color="var(--orange)" />
        <input
          placeholder="Name, Ref-Code suchen..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ border: "none", outline: "none", flex: 1, fontSize: "15px", backgroundColor: "transparent", color: "var(--text)", fontWeight: 500 }}
        />
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: "auto", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", tableLayout: "auto" }}>
          <thead>
            <tr style={{ textAlign: "left", background: "linear-gradient(135deg, #050234 0%, #0a0654 100%)" }}>
              {["Empfehler", "Stelle", "Ref", "Prämie", "Datum", "Aktionen"].map((h) => (
                <th key={h} style={{ padding: "16px 16px", fontWeight: 700, color: "rgba(255,255,255,0.8)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.8px", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "15px" }}>Laden...</td></tr>
            ) : empfehlungen.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "15px" }}>Keine Einträge zur Auszahlung</td></tr>
            ) : (
              empfehlungen.map((emp, i) => (
                <>
                  <tr
                    key={emp.id}
                    style={{
                      borderBottom: expandedId === emp.id ? "none" : "1px solid var(--border)",
                      backgroundColor: expandedId === emp.id ? "rgba(37,99,235,0.04)" : i % 2 === 0 ? "white" : "#f8f7f4",
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                    onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
                  >
                    <td style={{ ...cellStyle, fontWeight: 600 }}>
                      {emp.empfehler_name}
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 400 }}>{emp.empfehler_email}</div>
                    </td>
                    <td style={cellStyle}>
                      {emp.stelle?.title ?? "–"}
                    </td>
                    <td style={{ ...cellStyle, fontFamily: "monospace", fontSize: "12px", color: "var(--blue)", fontWeight: 700 }}>{emp.ref_code}</td>

                    {/* Prämie (editable) */}
                    <td style={cellStyle} onClick={(e) => e.stopPropagation()}>
                      {editingPraemieId === emp.id ? (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <input
                            type="number" step="0.01" min="0" value={editPraemie}
                            onChange={(e) => setEditPraemie(e.target.value)}
                            style={{ width: "90px", padding: "8px 10px", border: "2px solid var(--green)", borderRadius: "10px", fontSize: "14px", fontWeight: 700 }}
                            onKeyDown={(e) => { if (e.key === "Enter") handleUpdatePraemie(emp); if (e.key === "Escape") setEditingPraemieId(null); }}
                            autoFocus
                          />
                          <button onClick={() => handleUpdatePraemie(emp)} style={{ background: "#16a34a", border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                            <Check size={14} color="white" />
                          </button>
                          <button onClick={() => setEditingPraemieId(null)} style={{ background: "var(--border)", border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                            <X size={14} color="var(--text-muted)" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingPraemieId(emp.id); setEditPraemie(emp.praemie_betrag ? String(emp.praemie_betrag) : ""); }}
                          style={{
                            background: emp.praemie_betrag ? "#16a34a" : "var(--border)",
                            border: "none", cursor: "pointer", fontWeight: 700,
                            color: emp.praemie_betrag ? "white" : "var(--text-muted)",
                            padding: "6px 16px", borderRadius: "16px", fontSize: "13px",
                            boxShadow: emp.praemie_betrag ? "0 2px 8px rgba(22,163,74,0.3)" : "none",
                          }}
                          title="Klicke um Prämie anzupassen"
                        >
                          {emp.praemie_betrag ? formatCurrency(emp.praemie_betrag) : "–"}
                        </button>
                      )}
                    </td>

                    <td style={{ ...cellStyle, whiteSpace: "nowrap", color: "var(--text-muted)" }}>{formatDate(emp.created_at)}</td>

                    <td style={cellStyle} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => handleMoveBack(emp)}
                          style={{
                            background: "linear-gradient(135deg, #ea580c, #c2410c)",
                            border: "none", borderRadius: "10px", padding: "8px 12px", cursor: "pointer",
                            color: "white", fontWeight: 700, fontSize: "12px", display: "flex", alignItems: "center", gap: "4px",
                            boxShadow: "0 2px 8px rgba(234,88,12,0.3)",
                          }}
                          title="Zurück zu Eingestellt"
                        >
                          <ArrowLeft size={14} /> Zurück
                        </button>
                        <button
                          onClick={() => handleMarkAusgezahlt(emp)}
                          style={{
                            background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                            border: "none", borderRadius: "10px", padding: "8px 16px", cursor: "pointer",
                            color: "white", fontWeight: 700, fontSize: "12px", display: "flex", alignItems: "center", gap: "6px",
                            boxShadow: "0 2px 8px rgba(124,58,237,0.3)",
                          }}
                        >
                          <CreditCard size={14} /> Ausgezahlt
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded payment details */}
                  {expandedId === emp.id && (
                    <tr key={`${emp.id}-detail`} style={{ borderBottom: "1px solid var(--border)", backgroundColor: "rgba(37,99,235,0.04)" }}>
                      <td colSpan={6} style={{ padding: "0 16px 16px 16px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", maxWidth: "700px" }}>
                          <div style={{ gridColumn: "1 / -1", fontSize: "12px", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "1px", padding: "4px 0" }}>
                            Zahlungsdaten
                          </div>
                          <CopyField label="E-Mail" value={emp.empfehler_email} copyKey={`${emp.id}-email`} />
                          <CopyField label="IBAN" value={emp.iban} copyKey={`${emp.id}-iban`} />
                          <CopyField label="BIC" value={emp.bic} copyKey={`${emp.id}-bic`} />
                          <CopyField label="Inhaber" value={emp.kontoinhaber} copyKey={`${emp.id}-inhaber`} />
                          <CopyField label="Bank" value={emp.bank_name} copyKey={`${emp.id}-bank`} />
                          <CopyField label="Prämie" value={emp.praemie_betrag ? formatCurrency(emp.praemie_betrag) : null} copyKey={`${emp.id}-praemie`} />
                          {(!emp.iban && !emp.bic && !emp.kontoinhaber && !emp.bank_name) && (
                            <div style={{ gridColumn: "1 / -1", color: "var(--text-muted)", fontSize: "13px", fontStyle: "italic" }}>
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

      {/* Pagination */}
      {total > 25 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", alignItems: "center" }}>
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            style={{
              padding: "12px 24px", border: "none", borderRadius: "24px",
              background: page === 1 ? "var(--border)" : "linear-gradient(135deg, #050234 0%, #0a0654 100%)",
              color: page === 1 ? "var(--text-muted)" : "white",
              cursor: page === 1 ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "14px",
            }}
          >
            Zurück
          </button>
          <span style={{ padding: "8px 20px", fontSize: "15px", fontWeight: 700, color: "var(--navy)" }}>
            Seite {page} von {Math.ceil(total / 25)}
          </span>
          <button
            disabled={page * 25 >= total}
            onClick={() => setPage((p) => p + 1)}
            style={{
              padding: "12px 24px", border: "none", borderRadius: "24px",
              background: page * 25 >= total ? "var(--border)" : "linear-gradient(135deg, #f28900 0%, #ff6b00 100%)",
              color: page * 25 >= total ? "var(--text-muted)" : "white",
              cursor: page * 25 >= total ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "14px",
            }}
          >
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}
