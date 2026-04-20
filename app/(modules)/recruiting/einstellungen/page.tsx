"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Card } from "../_components/ui/Card";
import { StatCard } from "../_components/ui/StatCard";
import { formatCurrency } from "@/lib/modules/recruiting/utils";

export default function EinstellungenPage(): React.JSX.Element {
  const [praemieDefault, setPraemieDefault] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const res = await fetch("/api/recruiting/settings");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setPraemieDefault(data.praemie_betrag_default);
        setInputValue(String(data.praemie_betrag_default));
      } catch {
        setPraemieDefault(1000);
        setInputValue("1000");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(): Promise<void> {
    const value = parseFloat(inputValue);
    if (isNaN(value) || value < 0 || value > 99999) {
      alert("Ungültiger Betrag. Bitte gib einen Wert zwischen 0 und 99.999 ein.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/recruiting/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ praemie_betrag_default: value }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Fehler beim Speichern");
        return;
      }
      setPraemieDefault(value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert("Netzwerkfehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fadeIn flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Einstellungen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Standard-Prämie für neue Recruiting-Empfehlungen konfigurieren.
        </p>
      </div>

      {/* Aktueller Wert */}
      <div className="grid grid-cols-1 gap-px bg-border rounded-xl overflow-hidden border border-border">
        <StatCard
          label="Aktuelle Standard-Prämie"
          value={loading ? "…" : praemieDefault != null ? formatCurrency(praemieDefault) : "–"}
        />
      </div>

      {/* Bearbeitung */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">Standard-Prämie anpassen</h2>
        <p className="text-xs text-muted-foreground mb-5">
          Dieser Betrag wird automatisch bei jeder neuen Empfehlung vorausgefüllt. Du kannst ihn pro
          Eintrag in der Auszahlungsübersicht individuell überschreiben.
        </p>

        <div className="flex items-end gap-3 max-w-xs">
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Betrag in €
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-xl focus-within:border-foreground/30 transition-colors">
              <span className="text-sm text-muted-foreground">€</span>
              <input
                type="number"
                min="0"
                max="99999"
                step="50"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                disabled={loading}
                className="flex-1 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
                placeholder="1000"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Speichern...
              </>
            ) : saved ? (
              <>
                <Check size={14} />
                Gespeichert
              </>
            ) : (
              "Speichern"
            )}
          </button>
        </div>

        {saved && (
          <p className="mt-3 text-xs text-green-700">
            Standard-Prämie auf {praemieDefault != null ? formatCurrency(praemieDefault) : inputValue} gesetzt.
          </p>
        )}
      </Card>
    </div>
  );
}
