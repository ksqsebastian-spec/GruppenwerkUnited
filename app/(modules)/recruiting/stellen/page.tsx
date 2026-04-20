"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, X } from "lucide-react";
import type { Stelle, EmpfehlungWithStelle, EmpfehlungStatus } from "@/types/recruiting";
import { Card } from "../_components/ui/Card";
import { Button } from "../_components/ui/Button";
import { Input } from "../_components/ui/Input";

const STATUS_COLORS: Record<EmpfehlungStatus, string> = {
  offen: "#ea580c",
  eingestellt: "#16a34a",
  probezeit_bestanden: "#2563eb",
  ausgezahlt: "#7C3AED",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount);
}

export default function StellenPage(): React.JSX.Element {
  const [stellen, setStellen] = useState<Stelle[]>([]);
  const [empfehlungen, setEmpfehlungen] = useState<EmpfehlungWithStelle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", praemie_betrag: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Inline Prämie-Bearbeitung pro Stelle
  const [editingPraemieId, setEditingPraemieId] = useState<string | null>(null);
  const [praemieInput, setPraemieInput] = useState("");

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

    const praemie = formData.praemie_betrag ? parseFloat(formData.praemie_betrag) : undefined;
    if (formData.praemie_betrag && (isNaN(praemie!) || praemie! < 0)) {
      setFormError("Ungültiger Prämienbetrag");
      setFormLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/recruiting/stellen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          praemie_betrag: praemie,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.detail ? `${data.error}: ${data.detail}` : data.error || "Fehler beim Anlegen");
        return;
      }

      setShowForm(false);
      setFormData({ title: "", description: "", praemie_betrag: "" });
      fetchData();
    } catch {
      setFormError("Netzwerkfehler");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleSavePraemie(stelle: Stelle): Promise<void> {
    const value = praemieInput === "" ? null : parseFloat(praemieInput);
    if (value !== null && (isNaN(value) || value < 0)) return;

    try {
      const res = await fetch("/api/recruiting/stellen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: stelle.id, praemie_betrag: value }),
      });
      if (!res.ok) {
        alert("Fehler beim Speichern der Prämie");
        return;
      }
      setEditingPraemieId(null);
      fetchData();
    } catch {
      alert("Netzwerkfehler");
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
    if (!confirm(`Stellenangebot "${stelle.title}" wirklich löschen?`)) return;
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

  return (
    <div className="animate-fadeIn flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Stellenangebote verwalten</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Abbrechen" : "+ Neues Stellenangebot"}
        </Button>
      </div>

      {/* Formular */}
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
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Prämie (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={formData.praemie_betrag}
                  onChange={(e) => setFormData({ ...formData, praemie_betrag: e.target.value })}
                  placeholder="z.B. 1500"
                  className="px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground outline-none focus:border-foreground/30"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="description" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Beschreibung
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30 resize-y"
                placeholder="Optionale Beschreibung..."
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
              {["Titel", "Prämie", "Empfehlungen", "Status", "Erstellt", "Aktionen"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Wird geladen...</td>
              </tr>
            ) : stellen.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Noch keine Stellenangebote angelegt</td>
              </tr>
            ) : (
              stellen.map((stelle) => {
                const linkedEmp = empfehlungenByStelle.get(stelle.id) || [];
                const statusCounts: Partial<Record<EmpfehlungStatus, number>> = {};
                for (const emp of linkedEmp) {
                  statusCounts[emp.status] = (statusCounts[emp.status] || 0) + 1;
                }

                return (
                  <tr key={stelle.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{stelle.title}</td>

                    {/* Prämie – inline bearbeitbar */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {editingPraemieId === stelle.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={praemieInput}
                            onChange={(e) => setPraemieInput(e.target.value)}
                            className="w-24 px-2 py-1.5 border border-border rounded-lg text-sm font-semibold bg-card text-foreground outline-none focus:border-foreground/30"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSavePraemie(stelle);
                              if (e.key === "Escape") setEditingPraemieId(null);
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePraemie(stelle)}
                            className="p-1.5 bg-green-600 rounded-md cursor-pointer border-none"
                          >
                            <Check size={12} color="white" />
                          </button>
                          <button
                            onClick={() => setEditingPraemieId(null)}
                            className="p-1.5 bg-muted border border-border rounded-md cursor-pointer"
                          >
                            <X size={12} className="text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPraemieId(stelle.id);
                            setPraemieInput(stelle.praemie_betrag != null ? String(stelle.praemie_betrag) : "");
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer font-semibold text-foreground"
                          title="Klicke um Prämie anzupassen"
                        >
                          {stelle.praemie_betrag != null ? formatCurrency(stelle.praemie_betrag) : "–"}
                        </button>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {linkedEmp.length === 0 ? (
                        <span className="text-muted-foreground">0</span>
                      ) : (
                        <div className="flex gap-2 items-center flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{linkedEmp.length}</span>
                          {(Object.entries(statusCounts) as [EmpfehlungStatus, number][]).map(([status, count]) => (
                            <div key={status} className="flex items-center gap-1" title={`${status}: ${count}`}>
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                              <span className="text-xs font-semibold" style={{ color: STATUS_COLORS[status] }}>{count}</span>
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
