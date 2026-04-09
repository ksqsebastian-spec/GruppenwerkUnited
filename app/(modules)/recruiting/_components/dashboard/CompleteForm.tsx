"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

interface CompleteFormProps {
  empfehlungId: string;
}

export function CompleteForm({ empfehlungId }: CompleteFormProps): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/referrals/${empfehlungId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
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
          Kandidat eingestellt?
        </h3>
      </div>

      {error && (
        <div role="alert" className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} size="lg" className="bg-green-600 hover:bg-green-700 text-white">
        Als eingestellt markieren
      </Button>
    </form>
  );
}
