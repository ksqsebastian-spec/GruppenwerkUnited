"use client";

import { useEffect, useState, useCallback } from "react";
import type { Handwerker, EmpfehlungWithHandwerker } from "@/types/affiliate";
import { Card } from "../_components/ui/Card";
import { Button } from "../_components/ui/Button";
import { Input } from "../_components/ui/Input";
import { Check, X } from "lucide-react";

// Statusanzeige je nach Aktivität und Archivstatus
function getStatusDisplay(hw: Handwerker, archivedIds: Set<string>): { label: string; className: string } {
  if (!hw.active && archivedIds.has(hw.id)) {
    return { label: "Archiv", className: "text-[#2563eb] bg-[#2563eb]/10 border-[#2563eb]/20" };
  }
  if (hw.active) {
    return { label: "Aktiv", className: "text-[#16a34a] bg-[#16a34a]/10 border-[#16a34a]/20" };
  }
  return { label: "Inaktiv", className: "text-destructive bg-destructive/10 border-destructive/20" };
}

// Farbe für Affiliate-Status-Badges
const AFFILIATE_STATUS_CLASSES: Record<string, string> = {
  offen: "text-[#ea580c] bg-[#ea580c]/10 border-[#ea580c]/20",
  erledigt: "text-[#16a34a] bg-[#16a34a]/10 border-[#16a34a]/20",
  ausgezahlt: "text-[#2563eb] bg-[#2563eb]/10 border-[#2563eb]/20",
};

const AFFILIATE_STATUS_LABELS: Record<string, string> = {
  offen: "Offen",
  erledigt: "Erledigt",
  ausgezahlt: "Ausgezahlt",
};

export default function KundePage(): JSX.Element {
  const [handwerker, setHandwerker] = useState<Handwerker[]>([]);
  const [empfehlungen, setEmpfehlungen] = useState<EmpfehlungWithHandwerker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editProvision, setEditProvision] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", telefon: "", provision_prozent: "5" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const [hwRes, empRes] = await Promise.all([
        fetch("/api/affiliate/handwerker"),
        fetch("/api/affiliate/handwerker?view=empfehlungen&pageSize=100"),
      ]);
      if (hwRes.ok) {
        const data = await hwRes.json();
        setHandwerker(data.data || []);
      }
      if (empRes.ok) {
        const data = await empRes.json();
        setEmpfehlungen(data.data || []);
      }
    } catch {
      setHandwerker([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handwerker-IDs mit ausgezahlten Empfehlungen (archiviert)
  const archivedHandwerkerIds = new Set(
    empfehlungen.filter((e) => e.status === "ausgezahlt").map((e) => e.handwerker_id)
  );

  // Affiliates je Handwerker zuordnen
  const affiliatesByHandwerker = new Map<string, { name: string; email: string; status: string }[]>();
  for (const emp of empfehlungen) {
    const list = affiliatesByHandwerker.get(emp.handwerker_id) || [];
    list.push({ name: emp.empfehler_name, email: emp.empfehler_email, status: emp.status });
    affiliatesByHandwerker.set(emp.handwerker_id, list);
  }

  async function handleCreate(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      const res = await fetch("/api/affiliate/handwerker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          telefon: formData.telefon || undefined,
          provision_prozent: parseFloat(formData.provision_prozent),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg = data.detail ? `${data.error}: ${data.detail}` : data.error || "Fehler beim Anlegen";
        setFormError(msg);
        return;
      }

      setShowForm(false);
      setFormData({ name: "", email: "", telefon: "", provision_prozent: "5" });
      fetchData();
    } catch {
      setFormError("Netzwerkfehler");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdateProvision(id: string): Promise<void> {
    const value = parseFloat(editProvision);
    if (isNaN(value) || value < 0 || value > 50) return;

    try {
      await fetch("/api/affiliate/handwerker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, provision_prozent: value }),
      });
      setEditingId(null);
      fetchData();
    } catch {
      // Fehler still ignorieren
    }
  }

  async function handleToggleStatus(hw: Handwerker): Promise<void> {
    try {
      await fetch("/api/affiliate/handwerker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: hw.id, active: !hw.active }),
      });
      fetchData();
    } catch {
      // Fehler still ignorieren
    }
  }

  async function handleDelete(hw: Handwerker): Promise<void> {
    if (!confirm(`Kunde "${hw.name}" wirklich löschen? Das kann nicht rückgängig gemacht werden.`)) return;

    try {
      const res = await fetch(`/api/affiliate/handwerker?id=${hw.id}`, { method: "DELETE" });
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
      {/* Seitenkopf */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Kunde verwalten</h1>
        <Button onClick={() => setShowForm(!showForm)} size="lg">
          {showForm ? "Abbrechen" : "+ Neuer Kunde"}
        </Button>
      </div>

      {/* Anlegen-Formular */}
      {showForm && (
        <Card className="p-5">
          <form onSubmit={handleCreate} className="flex flex-col gap-5">
            <h2 className="text-base font-semibold text-foreground">Neuen Kunde anlegen</h2>
            {formError && (
              <div role="alert" className="text-sm font-medium text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input label="E-Mail" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              <Input label="Telefon" type="tel" value={formData.telefon} onChange={(e) => setFormData({ ...formData, telefon: e.target.value })} placeholder="z.B. +49 123 456789" />
              <Input label="Provision (%)" type="number" step="0.01" min="0" max="50" value={formData.provision_prozent} onChange={(e) => setFormData({ ...formData, provision_prozent: e.target.value })} required />
            </div>
            <Button type="submit" loading={formLoading} size="lg">Kunde anlegen</Button>
          </form>
        </Card>
      )}

      {/* Tabelle */}
      <Card className="p-0 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted">
              {["Name", "E-Mail", "Telefon", "Affiliate", "Provision %", "Status", "Erstellt", "Aktionen"].map((h) => (
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
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Wird geladen...
                </td>
              </tr>
            ) : handwerker.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Noch keine Kunden angelegt
                </td>
              </tr>
            ) : (
              handwerker.map((hw) => {
                const status = getStatusDisplay(hw, archivedHandwerkerIds);
                return (
                  <tr key={hw.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    {/* Name */}
                    <td className="px-4 py-3 text-sm text-foreground font-semibold">
                      {hw.name}
                    </td>

                    {/* E-Mail */}
                    <td className="px-4 py-3 text-sm text-foreground">
                      {hw.email}
                    </td>

                    {/* Telefon */}
                    <td className={`px-4 py-3 text-sm ${hw.telefon ? "text-foreground" : "text-muted-foreground"}`}>
                      {hw.telefon || "–"}
                    </td>

                    {/* Verknüpfte Affiliates */}
                    <td className="px-4 py-3">
                      {(() => {
                        const affiliates = affiliatesByHandwerker.get(hw.id);
                        if (!affiliates || affiliates.length === 0) {
                          return <span className="text-muted-foreground">–</span>;
                        }
                        return affiliates.map((a, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 ${idx < affiliates.length - 1 ? "mb-1" : ""}`}
                          >
                            <span className="text-sm font-semibold text-foreground">{a.name}</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${AFFILIATE_STATUS_CLASSES[a.status] ?? "text-muted-foreground border-border"}`}>
                              {AFFILIATE_STATUS_LABELS[a.status] ?? a.status}
                            </span>
                          </div>
                        ));
                      })()}
                    </td>

                    {/* Provision % (inline editierbar) */}
                    <td className="px-4 py-3">
                      {editingId === hw.id ? (
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="50"
                            value={editProvision}
                            onChange={(e) => setEditProvision(e.target.value)}
                            className="w-20 px-2 py-1.5 border border-border rounded-lg text-sm font-semibold bg-card text-foreground outline-none focus:border-foreground/40"
                          />
                          <button
                            onClick={() => handleUpdateProvision(hw.id)}
                            className="p-1.5 bg-[#16a34a] rounded-md flex items-center cursor-pointer border-0"
                          >
                            <Check size={12} color="white" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 bg-muted rounded-md flex items-center cursor-pointer border border-border"
                          >
                            <X size={12} className="text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(hw.id); setEditProvision(String(hw.provision_prozent)); }}
                          className="px-3 py-1 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
                          title="Klicke zum Bearbeiten"
                        >
                          {hw.provision_prozent}%
                        </button>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(hw)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${status.className}`}
                        title={hw.active ? "Klicke um zu deaktivieren" : "Klicke um zu aktivieren"}
                      >
                        {status.label}
                      </button>
                    </td>

                    {/* Erstellt */}
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(hw.created_at).toLocaleDateString("de-DE")}
                    </td>

                    {/* Aktionen */}
                    <td className="px-4 py-3">
                      <Button size="sm" variant="danger" onClick={() => handleDelete(hw)}>
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
