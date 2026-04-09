"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Check, X, Pencil, ArrowRight } from "lucide-react";
import type { EmpfehlungWithHandwerker, Handwerker } from "@/types/affiliate";
import { StatCard } from "../_components/ui/StatCard";
import { Card } from "../_components/ui/Card";
import { Button } from "../_components/ui/Button";
import { Input } from "../_components/ui/Input";
import { formatDate, formatCurrency } from "@/lib/modules/affiliate/utils";

export default function EmpfehlungenPage(): React.JSX.Element {
  const [empfehlungen, setEmpfehlungen] = useState<EmpfehlungWithHandwerker[]>([]);
  const [handwerker, setHandwerker] = useState<Handwerker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [showBankdaten, setShowBankdaten] = useState(false);
  const [formData, setFormData] = useState({
    handwerker_id: "",
    kunde_kontakt: "",
    empfehler_name: "",
    empfehler_email: "",
  });
  const [bankFormData, setBankFormData] = useState({
    iban: "",
    bic: "",
    kontoinhaber: "",
    bank_name: "",
  });

  const [editingEmp, setEditingEmp] = useState<EmpfehlungWithHandwerker | null>(null);
  const [editFormData, setEditFormData] = useState({
    handwerker_id: "",
    kunde_kontakt: "",
    empfehler_name: "",
    empfehler_email: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [editingBetragId, setEditingBetragId] = useState<string | null>(null);
  const [editBetrag, setEditBetrag] = useState("");

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "25",
        status: "offen",
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

  const fetchHandwerker = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/affiliate/handwerker");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHandwerker((data.data || []).filter((h: Handwerker) => h.active));
    } catch {
      setHandwerker([]);
    }
  }, []);

  useEffect(() => {
    fetchHandwerker();
  }, [fetchHandwerker]);

  useEffect(() => {
    const debounce = setTimeout(fetchData, 300);
    return () => clearTimeout(debounce);
  }, [fetchData]);

  async function handleCreate(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    const selectedPartner = handwerker.find((h) => h.id === formData.handwerker_id);
    if (!selectedPartner) {
      setFormError("Bitte Kunde auswählen");
      setFormLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/affiliate/empfehlungen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kunde_name: selectedPartner.name,
          kunde_kontakt: formData.kunde_kontakt || undefined,
          empfehler_name: formData.empfehler_name,
          empfehler_email: formData.empfehler_email,
          handwerker_id: formData.handwerker_id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.detail || data.error || "Fehler beim Erstellen");
        return;
      }

      // Bankdaten speichern falls angegeben
      if (showBankdaten && (bankFormData.iban || bankFormData.bic || bankFormData.kontoinhaber || bankFormData.bank_name)) {
        const created = await res.json().catch(() => null);
        if (created?.id) {
          await fetch("/api/affiliate/empfehlungen", {
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
      setFormData({ handwerker_id: "", kunde_kontakt: "", empfehler_name: "", empfehler_email: "" });
      setBankFormData({ iban: "", bic: "", kontoinhaber: "", bank_name: "" });
      setShowBankdaten(false);
      fetchData();
    } catch {
      setFormError("Netzwerkfehler");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleMoveToAuszahlung(emp: EmpfehlungWithHandwerker): Promise<void> {
    try {
      const res = await fetch("/api/affiliate/empfehlungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, status: "erledigt" }),
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

  async function handleDelete(emp: EmpfehlungWithHandwerker): Promise<void> {
    if (!confirm(`"${emp.empfehler_name}" wirklich löschen?`)) return;

    try {
      const res = await fetch(`/api/affiliate/empfehlungen?id=${emp.id}`, { method: "DELETE" });
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
        const data = await res.json();
        alert(data.error || "Fehler beim Aktualisieren");
        return;
      }
      setEditingBetragId(null);
      fetchData();
    } catch {
      alert("Netzwerkfehler");
    }
  }

  function startEditing(emp: EmpfehlungWithHandwerker): void {
    setEditingEmp(emp);
    setEditFormData({
      handwerker_id: emp.handwerker?.id ?? "",
      kunde_kontakt: emp.kunde_kontakt ?? "",
      empfehler_name: emp.empfehler_name,
      empfehler_email: emp.empfehler_email,
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
      const res = await fetch("/api/affiliate/empfehlungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingEmp.id,
          empfehler_name: editFormData.empfehler_name,
          empfehler_email: editFormData.empfehler_email,
          handwerker_id: editFormData.handwerker_id,
          kunde_kontakt: editFormData.kunde_kontakt || undefined,
          kunde_name: handwerker.find((h) => h.id === editFormData.handwerker_id)?.name ?? undefined,
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
    total: total,
    provision: empfehlungen
      .filter((e) => e.provision_betrag)
      .reduce((sum, e) => sum + (e.provision_betrag ?? 0), 0),
  };

  // Formular-Render-Hilfsfunktion (Erstellen oder Bearbeiten)
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
      <Card className="p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <h2 className="text-base font-semibold text-foreground">
            {mode === "create" ? "Neuen Affiliate erstellen" : "Affiliate bearbeiten"}
          </h2>
          {error && (
            <div role="alert" className="text-sm font-medium text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Kunde</label>
              <select
                value={data.handwerker_id}
                onChange={(e) => setData({ ...data, handwerker_id: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm bg-card text-foreground border border-border rounded-lg outline-none transition-colors focus:border-foreground/40 cursor-pointer"
              >
                <option value="">Kunde auswählen...</option>
                {handwerker.map((hw) => (
                  <option key={hw.id} value={hw.id}>{hw.name} ({hw.provision_prozent}%)</option>
                ))}
              </select>
            </div>
            <Input label="Kontakt (optional)" value={data.kunde_kontakt} onChange={(e) => setData({ ...data, kunde_kontakt: e.target.value })} placeholder="E-Mail oder Telefon" />
            <Input label="Affiliate Name" value={data.empfehler_name} onChange={(e) => setData({ ...data, empfehler_name: e.target.value })} required />
            <Input label="Affiliate E-Mail (PayPal)" type="email" value={data.empfehler_email} onChange={(e) => setData({ ...data, empfehler_email: e.target.value })} required />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground">
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
            <Button type="submit" loading={isLoading} size="lg" className="flex-1">
              {mode === "create" ? "Affiliate erstellen" : "Änderungen speichern"}
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={onCancel}>Abbrechen</Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <div className="animate-fadeIn flex flex-col gap-8">
      {/* Seitenkopf */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Affiliate</h1>
        {!editingEmp && (
          <Button onClick={() => { setShowForm(!showForm); setEditingEmp(null); }} size="lg">
            {showForm ? "Abbrechen" : "+ Neuer Affiliate"}
          </Button>
        )}
      </div>

      {/* Statistik-Raster */}
      <div className="grid grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border">
        <StatCard label="Offen" value={stats.total} />
        <StatCard label="Provision (offen)" value={formatCurrency(stats.provision)} />
      </div>

      {/* Formular */}
      {showForm && !editingEmp &&
        renderForm("create", formData, setFormData, handleCreate, formLoading, formError, showBankdaten, setShowBankdaten, () => setShowForm(false))
      }
      {editingEmp &&
        renderForm("edit", editFormData, setEditFormData, handleSaveEdit, editLoading, editError, showBankdaten, setShowBankdaten, () => setEditingEmp(null))
      }

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
              {["Affiliate", "Kunde", "Provision %", "Ref", "Betrag", "Provision", "Datum", "Aktionen"].map((h) => (
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
            ) : empfehlungen.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Keine offenen Einträge
                </td>
              </tr>
            ) : (
              empfehlungen.map((emp) => (
                <tr
                  key={emp.id}
                  className={`border-b border-border hover:bg-muted/50 transition-colors ${editingEmp?.id === emp.id ? "bg-muted/30" : ""}`}
                >
                  {/* Affiliate Name + E-Mail */}
                  <td className="px-4 py-3 text-sm text-foreground font-semibold">
                    {emp.empfehler_name}
                    <div className="text-xs text-muted-foreground font-normal">{emp.empfehler_email}</div>
                  </td>

                  {/* Kunde */}
                  <td className="px-4 py-3 text-sm text-foreground">
                    {emp.handwerker?.name ?? "–"}
                  </td>

                  {/* Provision % */}
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold border border-border text-foreground bg-muted">
                      {emp.handwerker?.provision_prozent ?? "–"}%
                    </span>
                  </td>

                  {/* Ref-Code */}
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                    {emp.ref_code}
                  </td>

                  {/* Betrag (inline editierbar) */}
                  <td className="px-4 py-3">
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

                  {/* Provision */}
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">
                    {emp.provision_betrag ? formatCurrency(emp.provision_betrag) : "–"}
                  </td>

                  {/* Datum */}
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(emp.created_at)}
                  </td>

                  {/* Aktionen */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => startEditing(emp)}
                        className="flex items-center gap-1"
                      >
                        <Pencil size={12} /> Bearbeiten
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleMoveToAuszahlung(emp)}
                        className="flex items-center gap-1"
                      >
                        <ArrowRight size={12} /> Zur Auszahlung
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(emp)}>
                        Löschen
                      </Button>
                    </div>
                  </td>
                </tr>
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
