"use client";

import { useEffect, useState, useCallback } from "react";
import type { Stelle, EmpfehlungWithStelle, EmpfehlungStatus, AppSettings } from "@/types/recruiting";
import { Card } from "../_components/ui/Card";
import { Button } from "../_components/ui/Button";
import { Input } from "../_components/ui/Input";

// Status-Punkt-Farben bleiben als kleine Indikatoren erhalten
const STATUS_COLORS: Record<EmpfehlungStatus, string> = {
  offen: "#ea580c",
  eingestellt: "#16a34a",
  probezeit_bestanden: "#2563eb",
  ausgezahlt: "#7C3AED",
};

export default function StellenPage(): React.JSX.Element {
  const [stellen, setStellen] = useState<Stelle[]>([]);
  const [empfehlungen, setEmpfehlungen] = useState<EmpfehlungWithStelle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Prämie-Einstellungen
  const [praemie, setPraemie] = useState<number | null>(null);
  const [editingPraemie, setEditingPraemie] = useState(false);
  const [praemieInput, setPraemieInput] = useState("");
  const [praemieLoading, setPraemieLoading] = useState(false);

  const fetchData = useCallback(async (): Promise<void> => {
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

  const fetchSettings = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/recruiting/settings");
      if (res.ok) {
        const data: AppSettings = await res.json();
        setPraemie(data.praemie_betrag_default);
      }
    } catch {
      // Stille Fehlerbehandlung
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, [fetchData, fetchSettings]);

  // Empfehlungen nach Stelle gruppieren
  const empfehlungenByStelle = new Map<string, EmpfehlungWithStelle[]>();
  for (const emp of empfehlungen) {
    const list = empfehlungenByStelle.get(emp.stelle_id) || [];
    list.push(emp);
    empfehlungenByStelle.set(emp.stelle_id, list);
  }

  async function handleCreate(e: React.FormEvent): Promise<void> {
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

  async function handleToggleStatus(stelle: Stelle): Promise<void> {
    try {
      await fetch("/api/recruiting/stellen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: stelle.id, active: !stelle.active }),
      });
      fetchData();
    } catch {
      // Stille Fehlerbehandlung
    }
  }

  async function handleDelete(stelle: Stelle): Promise<void> {
    if (!confirm(`Stellenangebot "${stelle.title}" wirklich löschen? Das kann nicht rückgängig gemacht werden.`)) return;

    try {
      const res = await fetch(`/api/recruiting/stellen?id=${stelle.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Fehler beim Löschen");
        return;
      }
      fetchData();
    } catch {
      alert("Netzwerkfehler");
    }
  }

  async function handleSavePraemie(): Promise<void> {
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
      // Stille Fehlerbehandlung
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
    <div className="animate-fadeIn flex flex-col gap-8">
      {/* Seitenheader */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Stellenangebote verwalten</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Abbrechen" : "+ Neues Stellenangebot"}
        </Button>
      </div>

      {/* Standard-Prämie Einstellung */}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">Standard-Prämie:</span>
          {editingPraemie ? (
            <div className="flex gap-2 items-center">
              <input
                type="number"
                step="0.01"
                min="0"
                value={praemieInput}
                onChange={(e) => setPraemieInput(e.target.value)}
                disabled={praemieLoading}
                className="w-28 px-3 py-1.5 border border-border rounded-lg text-sm font-semibold bg-card text-foreground outline-none focus:border-foreground/30"
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
                Abbrechen
              </Button>
            </div>
          ) : (
            <button
              onClick={() => {
                setPraemieInput(String(praemie ?? 0));
                setEditingPraemie(true);
              }}
              className="text-sm font-semibold text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
              title="Klicke zum Bearbeiten"
            >
              {praemie !== null ? formatCurrency(praemie) : "..."}
            </button>
          )}
        </div>
      </Card>

      {/* Formular: Neue Stelle anlegen */}
      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleCreate} className="flex flex-col gap-5">
            <h2 className="text-base font-semibold text-foreground">Neues Stellenangebot anlegen</h2>
            {formError && (
              <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Titel"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="description"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Beschreibung
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30 resize-y font-inherit"
                placeholder="Optionale Beschreibung der Stelle..."
              />
            </div>
            <Button type="submit" loading={formLoading}>Stellenangebot anlegen</Button>
          </form>
        </Card>
      )}

      {/* Tabelle */}
      <Card className="p-0 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["Titel", "Beschreibung", "Empfehlungen", "Status", "Erstellt", "Aktionen"].map((h) => (
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
            ) : stellen.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Noch keine Stellenangebote angelegt
                </td>
              </tr>
            ) : (
              stellen.map((stelle) => {
                const linkedEmp = empfehlungenByStelle.get(stelle.id) || [];
                // Nach Status gruppieren
                const statusCounts: Partial<Record<EmpfehlungStatus, number>> = {};
                for (const emp of linkedEmp) {
                  statusCounts[emp.status] = (statusCounts[emp.status] || 0) + 1;
                }

                return (
                  <tr key={stelle.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{stelle.title}</td>
                    <td className="px-4 py-3 max-w-[250px]">
                      {stelle.description ? (
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-sm text-foreground">
                          {stelle.description}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {linkedEmp.length === 0 ? (
                        <span className="text-muted-foreground">0</span>
                      ) : (
                        <div className="flex gap-2 items-center flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{linkedEmp.length}</span>
                          {(Object.entries(statusCounts) as [EmpfehlungStatus, number][]).map(([status, count]) => (
                            <div
                              key={status}
                              className="flex items-center gap-1"
                              title={`${status}: ${count}`}
                            >
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: STATUS_COLORS[status] }}
                              />
                              <span
                                className="text-xs font-semibold"
                                style={{ color: STATUS_COLORS[status] }}
                              >
                                {count}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(stelle)}
                        className={`text-xs font-semibold px-3 py-1 rounded-md border cursor-pointer transition-colors ${
                          stelle.active
                            ? "border-green-600 text-green-700 hover:bg-green-50"
                            : "border-red-500 text-red-600 hover:bg-red-50"
                        }`}
                        title={stelle.active ? "Klicke um zu deaktivieren" : "Klicke um zu aktivieren"}
                      >
                        {stelle.active ? "Aktiv" : "Inaktiv"}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(stelle.created_at).toLocaleDateString("de-DE")}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="danger" onClick={() => handleDelete(stelle)}>
                        Löschen
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
