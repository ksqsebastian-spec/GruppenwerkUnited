"use client";

import { useEffect, useState, useCallback } from "react";
import type { Stelle, EmpfehlungWithStelle, EmpfehlungStatus, AppSettings } from "@/types/recruiting";
import { Card } from "../_components/ui/Card";
import { Button } from "../_components/ui/Button";
import { Input } from "../_components/ui/Input";

const STATUS_COLORS: Record<EmpfehlungStatus, string> = {
  offen: "#ea580c",
  eingestellt: "#16a34a",
  probezeit_bestanden: "#2563eb",
  ausgezahlt: "#7C3AED",
};

export default function StellenPage() {
  const [stellen, setStellen] = useState<Stelle[]>([]);
  const [empfehlungen, setEmpfehlungen] = useState<EmpfehlungWithStelle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Praemie settings
  const [praemie, setPraemie] = useState<number | null>(null);
  const [editingPraemie, setEditingPraemie] = useState(false);
  const [praemieInput, setPraemieInput] = useState("");
  const [praemieLoading, setPraemieLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [stellenRes, empRes] = await Promise.all([
        fetch("/api/recruiting/stellen"),
        fetch("/api/recruiting/stellen?view=empfehlungen&pageSize=100"),
      ]);
      if (stellenRes.ok) {
        const data = await stellenRes.json();
        setStellen(data.data || []);
      }
      if (empRes.ok) {
        const data = await empRes.json();
        setEmpfehlungen(data.data || []);
      }
    } catch {
      setStellen([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/recruiting/settings");
      if (res.ok) {
        const data: AppSettings = await res.json();
        setPraemie(data.praemie_betrag_default);
      }
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, [fetchData, fetchSettings]);

  // Map stelle_id -> empfehlungen grouped by status
  const empfehlungenByStelle = new Map<string, EmpfehlungWithStelle[]>();
  for (const emp of empfehlungen) {
    const list = empfehlungenByStelle.get(emp.stelle_id) || [];
    list.push(emp);
    empfehlungenByStelle.set(emp.stelle_id, list);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      const res = await fetch("/api/recruiting/stellen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg = data.detail ? `${data.error}: ${data.detail}` : data.error || "Fehler beim Anlegen";
        setFormError(msg);
        return;
      }

      setShowForm(false);
      setFormData({ title: "", description: "" });
      fetchData();
    } catch {
      setFormError("Netzwerkfehler");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggleStatus(stelle: Stelle) {
    try {
      await fetch("/api/recruiting/stellen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: stelle.id, active: !stelle.active }),
      });
      fetchData();
    } catch {
      // silent fail
    }
  }

  async function handleDelete(stelle: Stelle) {
    if (!confirm(`Stelle "${stelle.title}" wirklich loschen? Das kann nicht ruckgangig gemacht werden.`)) return;

    try {
      const res = await fetch(`/api/recruiting/stellen?id=${stelle.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Fehler beim Loschen");
        return;
      }
      fetchData();
    } catch {
      alert("Netzwerkfehler");
    }
  }

  async function handleSavePraemie() {
    const value = parseFloat(praemieInput);
    if (isNaN(value) || value < 0) return;

    setPraemieLoading(true);
    try {
      const res = await fetch("/api/recruiting/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ praemie_betrag_default: value }),
      });
      if (res.ok) {
        const data: AppSettings = await res.json();
        setPraemie(data.praemie_betrag_default);
        setEditingPraemie(false);
      }
    } catch {
      // silent fail
    } finally {
      setPraemieLoading(false);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  }

  return (
    <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 800, margin: 0, color: "var(--navy)" }}>Stellen verwalten</h1>
        <Button onClick={() => setShowForm(!showForm)} size="lg">
          {showForm ? "Abbrechen" : "+ Neue Stelle"}
        </Button>
      </div>

      {/* Global Praemie Settings */}
      <Card style={{ borderLeft: "5px solid var(--navy)", borderRadius: "20px", boxShadow: "0 4px 20px rgba(5,2,52,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--navy)" }}>Standard-Pramie:</h2>
          {editingPraemie ? (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={praemieInput}
                onChange={(e) => setPraemieInput(e.target.value)}
                disabled={praemieLoading}
                style={{
                  width: "120px",
                  padding: "8px 10px",
                  border: "2px solid var(--orange)",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSavePraemie();
                  if (e.key === "Escape") setEditingPraemie(false);
                }}
              />
              <Button size="sm" onClick={handleSavePraemie} loading={praemieLoading}>
                OK
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingPraemie(false)}>
                X
              </Button>
            </div>
          ) : (
            <button
              onClick={() => {
                setPraemieInput(String(praemie ?? 0));
                setEditingPraemie(true);
              }}
              style={{
                background: "linear-gradient(135deg, #f28900, #ff6b00)",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                color: "white",
                padding: "6px 16px",
                borderRadius: "16px",
                fontSize: "14px",
                boxShadow: "0 2px 8px rgba(242,137,0,0.3)",
              }}
              title="Klicke zum Bearbeiten"
            >
              {praemie !== null ? formatCurrency(praemie) : "..."}
            </button>
          )}
        </div>
      </Card>

      {/* Create Form */}
      {showForm && (
        <Card style={{ borderLeft: "5px solid var(--orange)", borderRadius: "20px", boxShadow: "0 4px 20px rgba(242,137,0,0.1)" }}>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "var(--navy)" }}>Neue Stelle anlegen</h2>
            {formError && (
              <div role="alert" style={{ color: "var(--red)", fontSize: "14px", fontWeight: 600, backgroundColor: "var(--red-bg)", padding: "12px 16px", borderRadius: "12px" }}>
                {formError}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
              <Input
                label="Titel"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label
                htmlFor="description"
                style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-muted)" }}
              >
                Beschreibung
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "14px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "hsl(var(--card))",
                  color: "var(--text)",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                  transition: "border-color 0.2s ease",
                }}
                placeholder="Optionale Beschreibung der Stelle..."
              />
            </div>
            <Button type="submit" loading={formLoading} size="lg">Stelle anlegen</Button>
          </form>
        </Card>
      )}

      {/* Table */}
      <Card style={{ padding: 0, overflow: "auto", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ textAlign: "left", background: "linear-gradient(135deg, #050234 0%, #0a0654 100%)" }}>
              {["Titel", "Beschreibung", "Empfehlungen", "Status", "Erstellt", "Aktionen"].map((h) => (
                <th key={h} style={{ padding: "16px 18px", fontWeight: 700, color: "rgba(255,255,255,0.8)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "15px" }}>
                  Laden...
                </td>
              </tr>
            ) : stellen.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "15px" }}>
                  Noch keine Stellen angelegt
                </td>
              </tr>
            ) : (
              stellen.map((stelle, i) => {
                const linkedEmp = empfehlungenByStelle.get(stelle.id) || [];
                // Group by status
                const statusCounts: Partial<Record<EmpfehlungStatus, number>> = {};
                for (const emp of linkedEmp) {
                  statusCounts[emp.status] = (statusCounts[emp.status] || 0) + 1;
                }

                const statusDisplay = stelle.active
                  ? { label: "AKTIV", color: "#16a34a", shadow: "rgba(22,163,74,0.3)" }
                  : { label: "INAKTIV", color: "#dc2626", shadow: "rgba(220,38,38,0.3)" };

                return (
                  <tr key={stelle.id} style={{ borderBottom: "1px solid var(--border)", backgroundColor: i % 2 === 0 ? "hsl(var(--card))" : "hsl(var(--muted))" }}>
                    <td style={{ padding: "16px 18px", fontWeight: 600 }}>{stelle.title}</td>
                    <td style={{ padding: "16px 18px", maxWidth: "250px", color: stelle.description ? "var(--text)" : "var(--text-muted)" }}>
                      {stelle.description ? (
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {stelle.description}
                        </span>
                      ) : (
                        "–"
                      )}
                    </td>
                    <td style={{ padding: "16px 18px" }}>
                      {linkedEmp.length === 0 ? (
                        <span style={{ color: "var(--text-muted)" }}>0</span>
                      ) : (
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: "15px" }}>{linkedEmp.length}</span>
                          {(Object.entries(statusCounts) as [EmpfehlungStatus, number][]).map(([status, count]) => (
                            <div
                              key={status}
                              style={{ display: "flex", alignItems: "center", gap: "4px" }}
                              title={`${status}: ${count}`}
                            >
                              <span
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  backgroundColor: STATUS_COLORS[status],
                                  display: "inline-block",
                                }}
                              />
                              <span style={{ fontSize: "12px", fontWeight: 600, color: STATUS_COLORS[status] }}>
                                {count}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "16px 18px" }}>
                      <button
                        onClick={() => handleToggleStatus(stelle)}
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "white",
                          backgroundColor: statusDisplay.color,
                          padding: "6px 14px",
                          borderRadius: "16px",
                          border: "none",
                          cursor: "pointer",
                          boxShadow: `0 2px 8px ${statusDisplay.shadow}`,
                        }}
                        title={stelle.active ? "Klicke um zu deaktivieren" : "Klicke um zu aktivieren"}
                      >
                        {statusDisplay.label}
                      </button>
                    </td>
                    <td style={{ padding: "16px 18px", whiteSpace: "nowrap", color: "var(--text-muted)" }}>
                      {new Date(stelle.created_at).toLocaleDateString("de-DE")}
                    </td>
                    <td style={{ padding: "16px 18px" }}>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(stelle)}>
                        Loschen
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
