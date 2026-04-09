"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { formatCurrency, berechneProvision } from "@/lib/modules/affiliate/utils";

interface CompleteFormProps {
  empfehlungId: string;
  provisionProzent: number;
}

export function CompleteForm({ empfehlungId, provisionProzent }: CompleteFormProps): React.JSX.Element {
  const router = useRouter();
  const [betrag, setBetrag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const numericBetrag = parseFloat(betrag) || 0;
  const provision = berechneProvision(numericBetrag, provisionProzent);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (numericBetrag <= 0) {
      setError("Bitte einen gültigen Betrag eingeben");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/referrals/${empfehlungId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rechnungsbetrag: numericBetrag }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ein Fehler ist aufgetreten");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Netzwerkfehler — bitte versuche es erneut");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="border-t border-border pt-5 mt-2">
        <h3 className="text-sm font-semibold text-muted-foreground text-center mb-4">
          Job erledigt?
        </h3>
      </div>

      {error && (
        <div role="alert" className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      <Input
        label="Rechnungsbetrag (brutto)"
        type="number"
        step="0.01"
        min="0.01"
        max="999999"
        value={betrag}
        onChange={(e) => setBetrag(e.target.value)}
        placeholder="€"
        required
      />

      {numericBetrag > 0 && (
        <p className="text-sm font-semibold text-foreground text-center" aria-live="polite">
          Provision: {provisionProzent}% = {formatCurrency(provision)}
        </p>
      )}

      <Button type="submit" loading={loading} size="lg" className="bg-green-600 hover:bg-green-700 text-white">
        ✓ Job erledigt
      </Button>
    </form>
  );
}
