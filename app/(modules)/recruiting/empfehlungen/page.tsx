"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Pencil, ArrowRight } from "lucide-react";
import type { EmpfehlungWithStelle, Stelle } from "@/types/recruiting";
import { StatCard } from "../_components/ui/StatCard";
import { Card } from "../_components/ui/Card";
import { Button } from "../_components/ui/Button";
import { Input } from "../_components/ui/Input";
import { formatDate, formatCurrency } from "@/lib/modules/recruiting/utils";

// Status-Punkt-Farben bleiben als kleine Indikatoren erhalten
const STATUS_DOT: Record<string, string> = {
  offen: "#ea580c",
  eingestellt: "#2563eb",
  probezeit_bestanden: "#16a34a",
};

export default function EmpfehlungenPage(): React.JSX.Element {
  const [empfehlungen, setEmpfehlungen] = useState<EmpfehlungWithStelle[]>([]);
  const [stellen, setStellen] = useState<Stelle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [showBankdaten, setShowBankdaten] = useState(false);
  const [formData, setFormData] = useState({
    stelle_id: "",
    kandidat_kontakt: "",
    empfehler_name: "",
    empfehler_email: "",
    position: "",
  });
  const [bankFormData, setBankFormData] = useState({
    iban: "",
    bic: "",
    kontoinhaber: "",
    bank_name: "",
  });

  const [editingEmp, setEditingEmp] = useState<EmpfehlungWithStelle | null>(null);
  const [editFormData, setEditFormData] = useState({
    stelle_id: "",
    kandidat_kontakt: "",
    empfehler_name: "",
    empfehler_email: "",
    position: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "25",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/recruiting/stellen?view=empfehlungen&${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const all: EmpfehlungWithStelle[] = data.data || [];
      const filtered = all.filter((e) => e.status === "offen" || e.status === "eingestellt");
      setEmpfehlungen(filtered);
      setTotal(data.total || 0);
    } catch {
      setEmpfehlungen([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchStellen = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/recruiting/stellen");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStellen((data.data || []).filter((s: Stelle) => s.active));
    } catch {
      setStellen([]);
    }
  }, []);

  useEffect(() => {
    fetchStellen();
  }, [fetchStellen]);

  useEffect(() => {
    const debounce = setTimeout(fetchData, 300);
    return () => clearTimeout(debounce);
  }, [fetchData]);

  async function handleCreate(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    const selectedStelle = stellen.find((s) => s.id === formData.stelle_id);
    if (!selectedStelle) {
      setFormError("Bitte Stelle auswählen");
      setFormLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/recruiting/empfehlungen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kandidat_name: selectedStelle.title,
          kandidat_kontakt: formData.kandidat_kontakt || undefined,
          empfehler_name: formData.empfehler_name,
          empfehler_email: formData.empfehler_email,
          stelle_id: formData.stelle_id,
          position: formData.position || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.detail || data.error || "Fehler beim Erstellen");
        return;
      }

      // Falls Bankdaten angegeben wurden, separat speichern
      if (showBankdaten && (bankFormData.iban || bankFormData.bic || bankFormData.kontoinhaber || bankFormData.bank_name)) {
        const created = await res.json().catch(() => null);
        if (created?.id) {
          await fetch("/api/recruiting/empfehlungen", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: created.id,
              iban: bankFormData.iban || null,
              bic: bankFormData.bic || null,
              kontoinhaber: bankFormData.kontoinhaber || null,
              bank_name: bankFormData.bank_name || null,
            }),
          });
        }
      }

      setShowForm(false);
      setFormData({ stelle_id: "", kandidat_kontakt: "", empfehler_name: "", empfehler_email: "", position: "" });
      setBankFormData({ iban: "", bic: "", kontoinhaber: "", bank_name: "" });
      setShowBankdaten(false);
      fetchData();
    } catch {
      setFormError("Netzwerkfehler");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleStatusChange(emp: EmpfehlungWithStelle, newStatus: string): Promise<void> {
    try {
      const res = await fetch("/api/recruiting/empfehlungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.detail || data.error || "Fehler beim Verschieben");
        return;
      }
      fetchData();
    } catch {
      alert("Netzwerkfehler");
    }
  }

  async function handleDelete(emp: EmpfehlungWithStelle): Promise<void> {
    if (!confirm(`"${emp.empfehler_name}" wirklich löschen?`)) return;

    try {
      const res = await fetch(`/api/recruiting/empfehlungen?id=${emp.id}`, { method: "DELETE" });
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

  function startEditing(emp: EmpfehlungWithStelle): void {
    setEditingEmp(emp);
    setEditFormData({
      stelle_id: emp.stelle?.id ?? "",
      kandidat_kontakt: emp.kandidat_kontakt ?? "",
      empfehler_name: emp.empfehler_name,
      empfehler_email: emp.empfehler_email,
      position: emp.position ?? "",
    });
    setEditError("");
    setShowForm(false);
  }

  async function handleSaveEdit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!editingEmp) return;
    setEditLoading(true);
    setEditError("");

    try {
      const selectedStelle = stellen.find((s) => s.id === editFormData.stelle_id);
      const res = await fetch("/api/recruiting/empfehlungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingEmp.id,
          empfehler_name: editFormData.empfehler_name,
          empfehler_email: editFormData.empfehler_email,
          stelle_id: editFormData.stelle_id,
          kandidat_kontakt: editFormData.kandidat_kontakt || undefined,
          kandidat_name: selectedStelle?.title ?? undefined,
          position: editFormData.position || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setEditError(data.error || "Fehler beim Speichern");
        return;
      }

      setEditingEmp(null);
      fetchData();
    } catch {
      setEditError("Netzwerkfehler");
    } finally {
      setEditLoading(false);
    }
  }

  const stats = {
    total: empfehlungen.filter((e) => e.status === "offen").length,
    praemie: empfehlungen
      .filter((e) => e.status === "offen" && e.praemie_betrag)
      .reduce((sum, e) => sum + (e.praemie_betrag ?? 0), 0),
  };

  // Formular-Render-Funktion für Erstellen und Bearbeiten
  function renderForm(
    mode: "create" | "edit",
    data: typeof formData,
    setData: (d: typeof formData) => void,
    onSubmit: (e: React.FormEvent) => void,
    isLoading: boolean,
    error: string,
    bankdaten: boolean,
    setBankdaten: (v: boolean) => void,
    onCancel: () => void,
  ): React.JSX.Element {
    return (
      <Card className="p-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <h2 className="text-base font-semibold text-foreground">
            {mode === "create" ? "Neue Empfehlung erstellen" : "Empfehlung bearbeiten"}
          </h2>
          {error && (
            <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Stelle
              </label>
              <select
                value={data.stelle_id}
                onChange={(e) => setData({ ...data, stelle_id: e.target.value })}
                required
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-card text-foreground outline-none focus:border-foreground/30 cursor-pointer"
              >
                <option value="">Stelle auswählen...</option>
                {stellen.map((st) => (
                  <option key={st.id} value={st.id}>{st.title}</option>
                ))}
              </select>
            </div>
            <Input label="Kandidat Kontakt (optional)" value={data.kandidat_kontakt} onChange={(e) => setData({ ...data, kandidat_kontakt: e.target.value })} placeholder="E-Mail oder Telefon" />
            <Input label="Empfehler Name" value={data.empfehler_name} onChange={(e) => setData({ ...data, empfehler_name: e.target.value })} required />
            <Input label="Empfehler E-Mail" type="email" value={data.empfehler_email} onChange={(e) => setData({ ...data, empfehler_email: e.target.value })} required />
            <Input label="Position (optional)" value={data.position} onChange={(e) => setData({ ...data, position: e.target.value })} placeholder="z.B. Elektriker, Projektleiter" />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={bankdaten}
              onChange={(e) => setBankdaten(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            Bankdaten hinzufügen
          </label>

          {bankdaten && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted rounded-lg border border-border">
              <Input label="IBAN" placeholder="DE89 3704 0044 0532 0130 00" value={bankFormData.iban} onChange={(e) => setBankFormData({ ...bankFormData, iban: e.target.value })} />
              <Input label="BIC" placeholder="COBADEFFXXX" value={bankFormData.bic} onChange={(e) => setBankFormData({ ...bankFormData, bic: e.target.value })} />
              <Input label="Kontoinhaber" placeholder="Name des Kontoinhabers" value={bankFormData.kontoinhaber} onChange={(e) => setBankFormData({ ...bankFormData, kontoinhaber: e.target.value })} />
              <Input label="Bank" placeholder="Name der Bank" value={bankFormData.bank_name} onChange={(e) => setBankFormData({ ...bankFormData, bank_name: e.target.value })} />
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" loading={isLoading} className="flex-1">
              {mode === "create" ? "Empfehlung erstellen" : "Änderungen speichern"}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>Abbrechen</Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <div className="animate-fadeIn flex flex-col gap-8">
      {/* Seitenheader */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Empfehlungen</h1>
        {!editingEmp && (
          <Button onClick={() => { setShowForm(!showForm); setEditingEmp(null); }}>
            {showForm ? "Abbrechen" : "+ Neue Empfehlung"}
          </Button>
        )}
      </div>

      {/* Statistik-Raster */}
      <div className="grid grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border">
        <StatCard label="Offen" value={stats.total} />
        <StatCard label="Prämien (offen)" value={formatCurrency(stats.praemie)} />
      </div>

      {/* Formulare */}
      {showForm && !editingEmp &&
        renderForm("create", formData, setFormData, handleCreate, formLoading, formError, showBankdaten, setShowBankdaten, () => setShowForm(false))
      }
      {editingEmp &&
        renderForm("edit", editFormData, setEditFormData, handleSaveEdit, editLoading, editError, showBankdaten, setShowBankdaten, () => setEditingEmp(null))
      }

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
              {["Empfehler", "Stelle", "Ref", "Prämie", "Status", "Datum", "Aktionen"].map((h) => (
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
                  Keine offenen Einträge
                </td>
              </tr>
            ) : (
              empfehlungen.map((emp) => (
                <tr
                  key={emp.id}
                  className={`border-b border-border hover:bg-muted/50 transition-colors ${editingEmp?.id === emp.id ? "bg-muted/30" : ""}`}
                >
                  {/* Empfehler Name + E-Mail */}
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

                  {/* Prämie */}
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">
                    {emp.praemie_betrag ? formatCurrency(emp.praemie_betrag) : "–"}
                  </td>

                  {/* Status mit Punkt-Indikator */}
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_DOT[emp.status] ?? "#6b7280" }}
                      />
                      <span className="text-xs text-muted-foreground capitalize">
                        {emp.status === "probezeit_bestanden" ? "Probezeit bestanden" : emp.status}
                      </span>
                    </span>
                  </td>

                  {/* Datum */}
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(emp.created_at)}
                  </td>

                  {/* Aktionen */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => startEditing(emp)}
                        className="text-xs px-2.5 py-1.5 rounded-md border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil size={12} /> Bearbeiten
                      </button>
                      {emp.status === "offen" && (
                        <button
                          onClick={() => handleStatusChange(emp, "eingestellt")}
                          className="text-xs px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowRight size={12} /> Eingestellt
                        </button>
                      )}
                      {emp.status === "eingestellt" && (
                        <button
                          onClick={() => handleStatusChange(emp, "probezeit_bestanden")}
                          className="text-xs px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowRight size={12} /> Probezeit bestanden
                        </button>
                      )}
                      <Button size="sm" variant="danger" onClick={() => handleDelete(emp)}>Löschen</Button>
                    </div>
                  </td>
                </tr>
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
