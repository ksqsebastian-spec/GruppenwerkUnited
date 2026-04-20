"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import { Job, Config } from "@/lib/modules/roi/types";
import {
  calculateMonthlyROI,
  calculateBreakEven,
  formatCurrency,
  formatPercent,
} from "@/lib/modules/roi/calculations";
import Tooltip from "../../_components/Tooltip";
import ExportButton from "../../_components/ExportButton";

function ConfigField({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] font-mono uppercase tracking-wider text-text-dim mb-1">
        {label}
      </label>
      <div className="flex items-baseline gap-1">
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="font-mono text-lg font-semibold text-text bg-transparent border-b-2 border-surface-3 focus:border-accent outline-none w-32 transition-colors"
        />
        {suffix && (
          <span className="text-sm text-text-dim font-mono">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function amortisationszeit(monate: number): string {
  if (monate === Infinity) return "—";
  const jahre = Math.floor(monate / 12);
  const rest = monate % 12;
  if (jahre === 0) return `${monate} Mon.`;
  if (rest === 0) return `${jahre} ${jahre === 1 ? "Jahr" : "Jahre"}`;
  return `${jahre} J. ${rest} Mon.`;
}

export default function ROIPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaRoi, setShowPaRoi] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const [jobsRes, configRes] = await Promise.all([
      fetch('/api/roi/jobs'),
      fetch('/api/roi/config'),
    ]);

    if (jobsRes.ok) {
      const jobsData = await jobsRes.json();
      setJobs((jobsData as Job[]) || []);
    }
    if (configRes.ok) {
      const configData = await configRes.json();
      setConfig((configData as Config) ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateConfig = async (key: keyof Config, value: number) => {
    if (!config) return;
    const updated = { ...config, [key]: value };
    setConfig(updated);
    const res = await fetch('/api/roi/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: config.id, key, value }),
    });
    if (!res.ok) {
      console.error('Fehler beim Aktualisieren der Konfiguration:', await res.text());
    }
  };

  // Alle verfügbaren Jahre aus den Jobs
  const availableYears = useMemo(() => {
    const years = [...new Set(jobs.map((j) => j.jahr))].sort();
    return years;
  }, [jobs]);

  // Standardmäßig aktuelles Jahr vorauswählen, sobald Jahre verfügbar sind
  useEffect(() => {
    if (availableYears.length > 0 && selectedYear === null) {
      const currentYear = new Date().getFullYear();
      setSelectedYear(availableYears.includes(currentYear) ? currentYear : availableYears[availableYears.length - 1]);
    }
  }, [availableYears, selectedYear]);

  const filteredJobs = useMemo(
    () => selectedYear === null ? jobs : jobs.filter((j) => j.jahr === selectedYear),
    [jobs, selectedYear],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-dim font-mono text-sm">Laden...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-text-dim font-mono text-sm mb-2">Keine Konfiguration gefunden</p>
          <p className="text-text-dim font-mono text-xs">
            ROI-Konfiguration nicht geladen. Bitte Seite neu laden.
          </p>
        </div>
      </div>
    );
  }

  const monthlyData = calculateMonthlyROI(filteredJobs, config);
  const breakEven = calculateBreakEven(filteredJobs, config);
  const einmalig = config.homepage_kosten + config.ads_setup_kosten;
  const totals = monthlyData.reduce(
    (acc, m) => ({
      ads: acc.ads + m.google_ads_ausgaben,
      pflege: acc.pflege + m.pflegekosten,
      kosten: acc.kosten + m.kosten_gesamt,
      umsatz: acc.umsatz + m.netto_umsatz,
      rohertrag: acc.rohertrag + m.rohertrag,
      marge: acc.marge + m.operative_marge,
    }),
    { ads: 0, pflege: 0, kosten: 0, umsatz: 0, rohertrag: 0, marge: 0 }
  );

  const lastMonth = monthlyData[monthlyData.length - 1];
  const currentRoi = lastMonth ? (showPaRoi ? lastMonth.roi_pa_pct : lastMonth.roi_pct) : 0;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text">
            <Tooltip text="Return on Investment — wie viel Gewinn die Investition in Google Ads und Homepage zurückgebracht hat.">ROI</Tooltip>-Rechnung
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Google Ads & Homepage — automatisch berechnet
          </p>
        </div>
        <ExportButton onClick={() => {
          const wb = XLSX.utils.book_new();
          const roiRows = monthlyData.map((m) => ({
            Monat: m.monat,
            "Google Ads Ausgaben": m.google_ads_ausgaben,
            Pflegekosten: m.pflegekosten,
            "Kosten Gesamt": m.kosten_gesamt,
            "Netto-Umsatz": m.netto_umsatz,
            Rohertrag: m.rohertrag,
            "Operative Marge": m.operative_marge,
            Gesamtergebnis: m.gesamtergebnis,
            "Kum. Gesamtkosten": m.kum_gesamtkosten,
            "Kum. Operative Marge": m.kum_operative_marge,
            "Kum. Ergebnis": m.kum_ergebnis,
            "ROI (%)": Math.round(m.roi_pct * 100) / 100,
            "ROI p.a. (%)": Math.round(m.roi_pa_pct * 100) / 100,
          }));
          const wsROI = XLSX.utils.json_to_sheet(roiRows);
          wsROI["!cols"] = Array(13).fill({ wch: 16 });
          XLSX.utils.book_append_sheet(wb, wsROI, "ROI-Rechnung");
          XLSX.writeFile(wb, `GW-ROI-Rechnung_${new Date().toISOString().slice(0, 10)}.xlsx`);
        }}>
          Export
        </ExportButton>
      </div>

      {/* Jahr-Filter */}
      {availableYears.length > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-dim">Jahr:</span>
          {availableYears.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors ${
                selectedYear === year
                  ? "bg-accent text-white border-accent"
                  : "bg-surface text-text-muted border-border hover:border-accent hover:text-accent"
              }`}
            >
              {year}
            </button>
          ))}
          <button
            onClick={() => setSelectedYear(null)}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors ${
              selectedYear === null
                ? "bg-accent text-white border-accent"
                : "bg-surface text-text-muted border-border hover:border-accent hover:text-accent"
            }`}
          >
            Alle
          </button>
        </div>
      )}

      {/* Amortisation + aktueller ROI — prominente Karten */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-accent" />
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-1">
            <Tooltip text="Zeit bis die gesamte Anfangsinvestition durch operative Erträge zurückgewonnen wird.">Amortisationszeit</Tooltip>
          </p>
          <p className="text-2xl font-semibold text-accent font-mono">
            {amortisationszeit(breakEven.monateBreakEven)}
          </p>
          {breakEven.monateBreakEven !== Infinity && (
            <p className="text-xs text-text-dim mt-1">
              ca. {breakEven.breakEvenDatum.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
            </p>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-[3px] ${currentRoi >= 0 ? "bg-accent" : "bg-red"}`} />
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-mono uppercase tracking-wider text-text-dim">
              <Tooltip text={showPaRoi ? "ROI hochgerechnet auf 12 Monate — vergleichbar mit Jahreszinsen." : "Gesamter Return on Investment seit Beginn."}>
                ROI {showPaRoi ? "p.a." : "gesamt"}
              </Tooltip>
            </p>
            <button
              onClick={() => setShowPaRoi((v) => !v)}
              className="text-[9px] font-mono px-2 py-0.5 rounded border border-border text-text-dim hover:border-accent hover:text-accent transition-colors"
            >
              {showPaRoi ? "→ Gesamt" : "→ p.a."}
            </button>
          </div>
          <p className={`text-2xl font-semibold font-mono ${currentRoi >= 0 ? "text-accent" : "text-red"}`}>
            {formatPercent(currentRoi)}
          </p>
          <p className="text-xs text-text-dim mt-1">kumuliert bis heute</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue" />
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-1">
            <Tooltip text="Monatlicher Überschuss nach Abzug aller laufenden Kosten.">Überdeckung / Monat</Tooltip>
          </p>
          <p className={`text-2xl font-semibold font-mono ${breakEven.ueberdeckungProMonat >= 0 ? "text-accent" : "text-red"}`}>
            {formatCurrency(breakEven.ueberdeckungProMonat)}
          </p>
          <p className="text-xs text-text-dim mt-1">op. Ertrag − lfd. Kosten</p>
        </div>
      </div>

      {/* Config Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-xs font-mono uppercase tracking-wider text-text-dim mb-4">
            <Tooltip text="Kosten die nur einmal anfallen — Homepage-Erstellung und Google Ads Kampagnen-Setup.">Einmalige Investitionen</Tooltip>
          </h3>
          <div className="space-y-4">
            <ConfigField label="Homepage Erstellung" value={config.homepage_kosten} suffix="€" onChange={(v) => updateConfig("homepage_kosten", v)} />
            <ConfigField label="Google Ads Setup" value={config.ads_setup_kosten} suffix="€" onChange={(v) => updateConfig("ads_setup_kosten", v)} />
            <div className="pt-3 border-t border-border">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-dim">Summe</span>
              <p className="text-lg font-semibold text-red font-mono">{formatCurrency(einmalig)}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-xs font-mono uppercase tracking-wider text-text-dim mb-4">
            <Tooltip text="Kosten die jeden Monat anfallen — Ads-Verwaltung und laufendes Werbebudget.">Laufende Kosten</Tooltip> (monatlich)
          </h3>
          <div className="space-y-4">
            <ConfigField label="Google Ads Budget / Monat" value={config.google_ads_budget} suffix="€" onChange={(v) => updateConfig("google_ads_budget", v)} />
            <ConfigField label="Pflegekosten / Monat" value={config.pflegekosten_monat} suffix="€" onChange={(v) => updateConfig("pflegekosten_monat", v)} />
            <ConfigField label="Operative Marge (%)" value={config.operative_marge_pct * 100} suffix="%" onChange={(v) => updateConfig("operative_marge_pct", v / 100)} />
            <ConfigField label="Ø Aufträge / Monat" value={config.avg_auftraege_monat} onChange={(v) => updateConfig("avg_auftraege_monat", v)} />
          </div>
        </div>
      </div>

      {/* Monthly ROI Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text">
            Monatliche Übersicht {selectedYear ? `(${selectedYear})` : "(Alle Jahre)"}
          </h3>
          <button
            onClick={() => setShowPaRoi((v) => !v)}
            className="text-[10px] font-mono px-3 py-1.5 rounded-lg border border-border text-text-dim hover:border-accent hover:text-accent transition-colors"
          >
            ROI anzeigen: {showPaRoi ? "p.a." : "gesamt"} →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                {[
                  { label: "Monat", tip: "" },
                  { label: "Ads Ausg.", tip: "Monatliche Google Ads Werbeausgaben." },
                  { label: "Pflege", tip: "Monatliche Verwaltungsgebühr für Kampagnen-Betreuung." },
                  { label: "Kosten Ges.", tip: "Ads-Ausgaben + Pflegekosten zusammen." },
                  { label: "Netto-Umsatz", tip: "Summe aller Rechnungsbeträge ohne MwSt." },
                  { label: "Rohertrag", tip: "Umsatz minus direkte Kosten." },
                  { label: "Op. Marge", tip: "Operative Marge nach Gemeinkosten." },
                  { label: "Ergebnis", tip: "Op. Marge minus laufende Kosten." },
                  { label: "Kum. Kosten", tip: "Alle bisherigen Ausgaben aufsummiert inkl. Anfangsinvestition." },
                  { label: "Kum. Marge", tip: "Gesamter bisheriger Gewinn aufsummiert." },
                  { label: "Kum. Ergebnis", tip: "Gesamtgewinn minus Gesamtkosten. Positiv = im Plus." },
                  { label: showPaRoi ? "ROI p.a. %" : "ROI %", tip: showPaRoi ? "ROI annualisiert — vergleichbar mit Jahreszinsen." : "Gesamter Return on Investment in Prozent." },
                ].map((h) => (
                  <th key={h.label} className="px-3 py-3 text-[10px] font-mono uppercase tracking-wider text-text-dim font-medium text-right first:text-left">
                    {h.tip ? <Tooltip text={h.tip}>{h.label}</Tooltip> : h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m) => {
                const roiValue = showPaRoi ? m.roi_pa_pct : m.roi_pct;
                return (
                  <tr key={m.datum} className="border-b border-border/50 hover:bg-surface-2/50">
                    <td className="px-3 py-2.5 text-xs font-medium">{m.monat}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-right">{formatCurrency(m.google_ads_ausgaben)}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-right">{formatCurrency(m.pflegekosten)}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-right text-red">{formatCurrency(m.kosten_gesamt)}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-right">{formatCurrency(m.netto_umsatz)}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-right">{formatCurrency(m.rohertrag)}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-right text-accent">{formatCurrency(m.operative_marge)}</td>
                    <td className={`px-3 py-2.5 text-xs font-mono text-right font-medium ${m.gesamtergebnis >= 0 ? "text-accent" : "text-red"}`}>
                      {formatCurrency(m.gesamtergebnis)}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono text-right text-text-dim">{formatCurrency(m.kum_gesamtkosten)}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-right text-text-dim">{formatCurrency(m.kum_operative_marge)}</td>
                    <td className={`px-3 py-2.5 text-xs font-mono text-right font-medium ${m.kum_ergebnis >= 0 ? "text-accent" : "text-red"}`}>
                      {formatCurrency(m.kum_ergebnis)}
                    </td>
                    <td className={`px-3 py-2.5 text-xs font-mono text-right ${roiValue >= 0 ? "text-accent" : "text-red"}`}>
                      {formatPercent(roiValue)}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-surface-2 font-semibold">
                <td className="px-3 py-3 text-xs">GESAMT</td>
                <td className="px-3 py-3 text-xs font-mono text-right">{formatCurrency(totals.ads)}</td>
                <td className="px-3 py-3 text-xs font-mono text-right">{formatCurrency(totals.pflege)}</td>
                <td className="px-3 py-3 text-xs font-mono text-right text-red">{formatCurrency(totals.kosten)}</td>
                <td className="px-3 py-3 text-xs font-mono text-right">{formatCurrency(totals.umsatz)}</td>
                <td className="px-3 py-3 text-xs font-mono text-right">{formatCurrency(totals.rohertrag)}</td>
                <td className="px-3 py-3 text-xs font-mono text-right text-accent">{formatCurrency(totals.marge)}</td>
                <td colSpan={5} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Break-Even Analysis */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-text mb-6">
          <Tooltip text="Der Punkt ab dem Einnahmen die gesamten Investitionskosten decken.">Break-Even</Tooltip> Analyse
        </h3>
        <div className="grid grid-cols-3 gap-8">
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-3">
              1. <Tooltip text="Der Gewinn pro Auftrag nach Abzug der direkten Kosten.">Operativer Ertrag</Tooltip> / Auftrag
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Ø Netto-Umsatz / Auftrag</span>
                <span className="font-mono">{formatCurrency(breakEven.avgUmsatzProAuftrag)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Operative Marge</span>
                <span className="font-mono">{(breakEven.operativeMargePct * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-xs font-medium pt-1 border-t border-border">
                <span>Op. Ertrag / Auftrag</span>
                <span className="font-mono text-accent">{formatCurrency(breakEven.operativerErtragProAuftrag)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Ø Aufträge / Monat</span>
                <span className="font-mono">{breakEven.avgAuftraegeProMonat}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-3">
              2. Laufende Kosten / Monat
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Ø Google Ads / Monat</span>
                <span className="font-mono text-red">{formatCurrency(config.google_ads_budget)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Pflegekosten / Monat</span>
                <span className="font-mono text-red">{formatCurrency(config.pflegekosten_monat)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium pt-1 border-t border-border">
                <span>Laufende Kosten / Monat</span>
                <span className="font-mono text-red">{formatCurrency(breakEven.laufendeKostenProMonat)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-3">
              3. <Tooltip text="Monatlicher Überschuss — wird zum Abbau der Anfangsinvestition genutzt.">Überdeckung</Tooltip> & Amortisation
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Ø Op. Ertrag / Monat</span>
                <span className="font-mono">{formatCurrency(breakEven.operativerErtragProMonat)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">− Laufende Kosten</span>
                <span className="font-mono text-red">{formatCurrency(breakEven.laufendeKostenProMonat)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium pt-1 border-t border-border">
                <span>Überdeckung / Monat</span>
                <span className="font-mono text-accent">{formatCurrency(breakEven.ueberdeckungProMonat)}</span>
              </div>
              <div className="mt-4 p-4 bg-accent-light rounded-lg">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-muted">Offene Investition</span>
                  <span className="font-mono font-medium">{formatCurrency(breakEven.offeneInvestition)}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-muted">Amortisationszeit</span>
                  <span className="font-mono font-semibold text-accent">
                    {amortisationszeit(breakEven.monateBreakEven)}
                  </span>
                </div>
                {breakEven.monateBreakEven !== Infinity && (
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Voraussichtlich</span>
                    <span className="font-mono font-semibold text-accent">
                      {breakEven.breakEvenDatum.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {breakEven.monateBreakEven !== Infinity && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-text-dim mb-2">
              <span>Investition</span>
              <span>Amortisiert</span>
            </div>
            <div className="h-3 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0,
                    ((einmalig - breakEven.offeneInvestition + (totals.marge - totals.kosten)) / einmalig) * 100
                  ))}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
