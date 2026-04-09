"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ChevronDown, ChevronRight, ArrowRight, Check, X, Users } from "lucide-react";
import type { EmpfehlungWithStelle, EmpfehlungStatus, Stelle } from "@/types/recruiting";
import { StatCard } from "./_components/ui/StatCard";
import { Card } from "./_components/ui/Card";
import { formatDate, formatCurrency } from "@/lib/modules/recruiting/utils";

const STATUS_DOT_COLORS: Record<EmpfehlungStatus, string> = {
  offen: "#ea580c",
  eingestellt: "#16a34a",
  probezeit_bestanden: "#2563eb",
  ausgezahlt: "#7C3AED",
};

const STATUS_LABELS: Record<EmpfehlungStatus, string> = {
  offen: "Offen",
  eingestellt: "Eingestellt",
  probezeit_bestanden: "Probezeit bestanden",
  ausgezahlt: "Ausgezahlt",
};

const NEXT_STATUS: Record<EmpfehlungStatus, { label: string; target: EmpfehlungStatus; color: string } | null> = {
  offen: { label: "Eingestellt", target: "eingestellt", color: "#16a34a" },
  eingestellt: { label: "Probezeit bestanden", target: "probezeit_bestanden", color: "#2563eb" },
  probezeit_bestanden: { label: "Ausgezahlt", target: "ausgezahlt", color: "#7C3AED" },
  ausgezahlt: null,
};

interface StelleGroup {
  stelle: Pick<Stelle, "id" | "title"> | null;
  empfehlungen: EmpfehlungWithStelle[];
}

export default function AdminDashboardPage() {
  const [empfehlungen, setEmpfehlungen] = useState<EmpfehlungWithStelle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedKunden, setExpandedKunden] = useState<Set<string>>(new Set());

  // Inline editing
  const [editingPraemieId, setEditingPraemieId] = useState<string | null>(null);
  const [editPraemie, setEditPraemie] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recruiting/stellen?view=empfehlungen&pageSize=200");
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

  // Group empfehlungen by Stelle
  const kundeGroups: StelleGroup[] = (() => {
    const filtered = search
      ? empfehlungen.filter((e) => {
          const s = search.toLowerCase();
          return (
            e.kandidat_name.toLowerCase().includes(s) ||
            e.empfehler_name.toLowerCase().includes(s) ||
            e.ref_code.toLowerCase().includes(s) ||
            (e.stelle?.title ?? "").toLowerCase().includes(s)
          );
        })
      : empfehlungen;

    const map = new Map<string, StelleGroup>();
    for (const emp of filtered) {
      const key = emp.stelle?.id ?? "ohne-stelle";
      if (!map.has(key)) {
        map.set(key, {
          stelle: emp.stelle ?? null,
          empfehlungen: [],
        });
      }
      map.get(key)!.empfehlungen.push(emp);
    }
    return Array.from(map.values()).sort((a, b) => (a.stelle?.title ?? "").localeCompare(b.stelle?.title ?? ""));
  })();

  function toggleKunde(id: string) {
    setExpandedKunden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    setExpandedKunden(new Set(kundeGroups.map((g) => g.stelle?.id ?? "ohne-stelle")));
  }

  function collapseAll() {
    setExpandedKunden(new Set());
  }

  async function handleMoveStatus(emp: EmpfehlungWithStelle) {
    const next = NEXT_STATUS[emp.status];
    if (!next) return;

    if (next.target === "ausgezahlt") {
      if (!confirm(`"${emp.empfehler_name}" als ausgezahlt markieren?`)) return;
    }

    try {
      const res = await fetch("/api/recruiting/empfehlungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, status: next.target }),
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

  const stats = {
    total: empfehlungen.length,
    offen: empfehlungen.filter((e) => e.status === "offen").length,
    eingestellt: empfehlungen.filter((e) => e.status === "eingestellt").length,
    probezeit: empfehlungen.filter((e) => e.status === "probezeit_bestanden").length,
    praemien: empfehlungen
      .filter((e) => e.praemie_betrag)
      .reduce((sum, e) => sum + (e.praemie_betrag ?? 0), 0),
  };

  const cellStyle: React.CSSProperties = { padding: "12px 14px" };

  return (
    <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <h1 style={{ fontSize: "32px", fontWeight: 800, margin: 0, color: "var(--navy)" }}>
        Dashboard
      </h1>

      {/* Stat Cards */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <StatCard label="Gesamt" value={stats.total} bgColor="#eff6ff" color="#2563eb" />
        <StatCard label="Offen" value={stats.offen} bgColor="#fff7ed" color="#ea580c" />
        <StatCard label="Eingestellt" value={stats.eingestellt} bgColor="#f0fdf4" color="#16a34a" />
        <StatCard label="Probezeit" value={stats.probezeit} bgColor="#eff6ff" color="#2563eb" />
        <StatCard label="Prämien" value={formatCurrency(stats.praemien)} bgColor="#f5f3ff" color="#7c3aed" />
      </div>

      {/* Search + Expand/Collapse */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
        <div
          style={{
            flex: 1,
            minWidth: "220px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 18px",
            backgroundColor: "hsl(var(--card))",
            border: "2px solid var(--border)",
            borderRadius: "14px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <Search size={20} color="var(--orange)" />
          <input
            placeholder="Stelle oder Empfehler suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              flex: 1,
              fontSize: "15px",
              backgroundColor: "transparent",
              color: "var(--text)",
              fontWeight: 500,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={expandAll}
            style={{
              padding: "10px 18px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 700,
              border: "2px solid var(--border)",
              backgroundColor: "hsl(var(--card))",
              color: "var(--navy)",
              cursor: "pointer",
            }}
          >
            Alle öffnen
          </button>
          <button
            onClick={collapseAll}
            style={{
              padding: "10px 18px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 700,
              border: "2px solid var(--border)",
              backgroundColor: "hsl(var(--card))",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            Alle schließen
          </button>
        </div>
      </div>

      {/* Stelle Groups */}
      {loading ? (
        <Card style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "15px", borderRadius: "20px" }}>
          Laden...
        </Card>
      ) : kundeGroups.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "15px", borderRadius: "20px" }}>
          Keine Empfehlungen gefunden
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {kundeGroups.map((group) => {
            const groupId = group.stelle?.id ?? "ohne-stelle";
            const isExpanded = expandedKunden.has(groupId);
            const empfehlungCount = group.empfehlungen.length;
            const statusCounts = {
              offen: group.empfehlungen.filter((e) => e.status === "offen").length,
              eingestellt: group.empfehlungen.filter((e) => e.status === "eingestellt").length,
              probezeit_bestanden: group.empfehlungen.filter((e) => e.status === "probezeit_bestanden").length,
              ausgezahlt: group.empfehlungen.filter((e) => e.status === "ausgezahlt").length,
            };

            return (
              <Card
                key={groupId}
                style={{
                  padding: 0,
                  borderRadius: "20px",
                  boxShadow: isExpanded ? "0 4px 20px rgba(0,0,0,0.08)" : "0 2px 10px rgba(0,0,0,0.04)",
                  border: isExpanded ? "2px solid var(--orange)" : "2px solid transparent",
                  transition: "all 0.2s ease",
                  overflow: "hidden",
                }}
              >
                {/* Group Header */}
                <button
                  onClick={() => toggleKunde(groupId)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "20px 24px",
                    border: "none",
                    backgroundColor: isExpanded ? "rgba(242,137,0,0.04)" : "hsl(var(--card))",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  {/* Expand icon */}
                  <div style={{ flexShrink: 0, color: "var(--orange)" }}>
                    {isExpanded ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
                  </div>

                  {/* Stelle avatar */}
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, #050234, #0a0654)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Users size={20} color="white" />
                  </div>

                  {/* Stelle info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--navy)" }}>
                      {group.stelle?.title ?? "Ohne Stelle"}
                    </div>
                  </div>

                  {/* Status dots summary */}
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    {statusCounts.offen > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 700, color: STATUS_DOT_COLORS.offen }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: STATUS_DOT_COLORS.offen }} />
                        {statusCounts.offen}
                      </span>
                    )}
                    {statusCounts.eingestellt > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 700, color: STATUS_DOT_COLORS.eingestellt }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: STATUS_DOT_COLORS.eingestellt }} />
                        {statusCounts.eingestellt}
                      </span>
                    )}
                    {statusCounts.probezeit_bestanden > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 700, color: STATUS_DOT_COLORS.probezeit_bestanden }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: STATUS_DOT_COLORS.probezeit_bestanden }} />
                        {statusCounts.probezeit_bestanden}
                      </span>
                    )}
                    {statusCounts.ausgezahlt > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 700, color: STATUS_DOT_COLORS.ausgezahlt }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: STATUS_DOT_COLORS.ausgezahlt }} />
                        {statusCounts.ausgezahlt}
                      </span>
                    )}
                  </div>

                  {/* Empfehlung count */}
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      flexShrink: 0,
                    }}
                  >
                    {empfehlungCount} {empfehlungCount === 1 ? "Empfehlung" : "Empfehlungen"}
                  </span>
                </button>

                {/* Expanded: Empfehlung table */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                      <thead>
                        <tr style={{ background: "linear-gradient(135deg, #050234 0%, #0a0654 100%)" }}>
                          {["Empfehler", "Ref", "Status", "Prämie", "Datum", "Aktion"].map((h) => (
                            <th
                              key={h}
                              style={{
                                padding: "12px 14px",
                                fontWeight: 700,
                                color: "rgba(255,255,255,0.8)",
                                fontSize: "11px",
                                textTransform: "uppercase",
                                letterSpacing: "0.8px",
                                whiteSpace: "nowrap",
                                textAlign: "left",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.empfehlungen.map((emp, i) => (
                          <tr
                            key={emp.id}
                            style={{
                              borderBottom: "1px solid var(--border)",
                              backgroundColor: i % 2 === 0 ? "hsl(var(--card))" : "hsl(var(--muted))",
                            }}
                          >
                            {/* Empfehler name + email */}
                            <td style={{ ...cellStyle, fontWeight: 600 }}>
                              {emp.empfehler_name}
                              <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 400 }}>
                                {emp.empfehler_email}
                              </div>
                            </td>

                            {/* Ref code */}
                            <td style={{ ...cellStyle, fontFamily: "monospace", fontSize: "12px", color: "var(--blue)", fontWeight: 700 }}>
                              {emp.ref_code}
                            </td>

                            {/* Status dot + label */}
                            <td style={cellStyle}>
                              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span
                                  style={{
                                    width: "10px",
                                    height: "10px",
                                    borderRadius: "50%",
                                    backgroundColor: STATUS_DOT_COLORS[emp.status],
                                    flexShrink: 0,
                                  }}
                                />
                                <span style={{ fontSize: "12px", fontWeight: 600, color: STATUS_DOT_COLORS[emp.status] }}>
                                  {STATUS_LABELS[emp.status]}
                                </span>
                              </span>
                            </td>

                            {/* Prämie (inline editable) */}
                            <td style={cellStyle}>
                              {editingPraemieId === emp.id ? (
                                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editPraemie}
                                    onChange={(e) => setEditPraemie(e.target.value)}
                                    style={{ width: "90px", padding: "6px 8px", border: "2px solid var(--green)", borderRadius: "8px", fontSize: "13px", fontWeight: 700 }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleUpdatePraemie(emp);
                                      if (e.key === "Escape") setEditingPraemieId(null);
                                    }}
                                    autoFocus
                                  />
                                  <button onClick={() => handleUpdatePraemie(emp)} style={{ background: "#16a34a", border: "none", borderRadius: "6px", padding: "4px", cursor: "pointer", display: "flex" }}>
                                    <Check size={12} color="white" />
                                  </button>
                                  <button onClick={() => setEditingPraemieId(null)} style={{ background: "var(--border)", border: "none", borderRadius: "6px", padding: "4px", cursor: "pointer", display: "flex" }}>
                                    <X size={12} color="var(--text-muted)" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingPraemieId(emp.id);
                                    setEditPraemie(emp.praemie_betrag ? String(emp.praemie_betrag) : "");
                                  }}
                                  style={{
                                    background: emp.praemie_betrag ? "#16a34a" : "var(--border)",
                                    border: "none",
                                    cursor: "pointer",
                                    fontWeight: 700,
                                    color: emp.praemie_betrag ? "white" : "var(--text-muted)",
                                    padding: "4px 12px",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    boxShadow: emp.praemie_betrag ? "0 2px 6px rgba(22,163,74,0.3)" : "none",
                                  }}
                                  title="Klicke um Prämie anzupassen"
                                >
                                  {emp.praemie_betrag ? formatCurrency(emp.praemie_betrag) : "–"}
                                </button>
                              )}
                            </td>

                            {/* Datum */}
                            <td style={{ ...cellStyle, whiteSpace: "nowrap", color: "var(--text-muted)", fontSize: "13px" }}>
                              {formatDate(emp.created_at)}
                            </td>

                            {/* Aktion */}
                            <td style={cellStyle}>
                              {NEXT_STATUS[emp.status] && (
                                <button
                                  onClick={() => handleMoveStatus(emp)}
                                  style={{
                                    background: `linear-gradient(135deg, ${NEXT_STATUS[emp.status]!.color}, ${NEXT_STATUS[emp.status]!.color}dd)`,
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "6px 12px",
                                    cursor: "pointer",
                                    color: "white",
                                    fontWeight: 700,
                                    fontSize: "11px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    whiteSpace: "nowrap",
                                    boxShadow: `0 2px 6px ${NEXT_STATUS[emp.status]!.color}40`,
                                  }}
                                >
                                  <ArrowRight size={12} /> {NEXT_STATUS[emp.status]!.label}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
