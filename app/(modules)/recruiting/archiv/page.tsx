"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Archive, ArrowLeft } from "lucide-react";
import type { EmpfehlungWithStelle } from "@/types/recruiting";
import { StatCard } from "../_components/ui/StatCard";
import { formatDate, formatCurrency } from "@/lib/modules/recruiting/utils";

export default function ArchivPage(): React.JSX.Element {
  const [empfehlungen, setEmpfehlungen] = useState<EmpfehlungWithStelle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "25",
        status: "ausgezahlt",
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

  async function handleMoveBack(emp: EmpfehlungWithStelle): Promise<void> {
    try {
      const res = await fetch("/api/recruiting/empfehlungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, status: "probezeit_bestanden" }),
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
  const totalPages = Math.ceil(total / 25);

  return (
    <div className="animate-fadeIn flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <Archive size={22} className="text-muted-foreground" />
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Archiv</h1>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border">
        <StatCard label="Archiviert" value={total} />
        <StatCard label="Ausgezahlt gesamt" value={formatCurrency(totalPraemie)} />
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
      <div className="bg-card rounded-xl border border-border overflow-hidden overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted">
              {["Empfehler", "Stelle", "Ref", "Prämie", "Ausgezahlt am", "Erstellt", "Aktionen"].map((h) => (
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
                  Noch keine archivierten Einträge
                </td>
              </tr>
            ) : (
              empfehlungen.map((emp) => (
                <tr key={emp.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                  {/* Empfehler */}
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {emp.empfehler_name}
                    <div className="text-xs text-muted-foreground font-normal">{emp.empfehler_email}</div>
                  </td>

                  {/* Stelle */}
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{emp.stelle?.title ?? "–"}</div>
                  </td>

                  {/* Ref */}
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">{emp.ref_code}</td>

                  {/* Prämie */}
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {emp.praemie_betrag ? formatCurrency(emp.praemie_betrag) : "–"}
                  </td>

                  {/* Ausgezahlt am */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {emp.ausgezahlt_am ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted border border-border text-foreground">
                        {formatDate(emp.ausgezahlt_am)}
                      </span>
                    ) : "–"}
                  </td>

                  {/* Erstellt */}
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(emp.created_at)}
                  </td>

                  {/* Aktionen */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleMoveBack(emp)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-muted transition-colors whitespace-nowrap cursor-pointer"
                      title="Zurück zur Auszahlung"
                    >
                      <ArrowLeft size={13} /> Zur Auszahlung
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Seitennavigation */}
      {total > 25 && (
        <div className="flex justify-center gap-3 items-center">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-5 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Zurück
          </button>
          <span className="px-4 py-2 text-sm font-medium text-foreground">
            Seite {page} von {totalPages}
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
