"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface CompleteFormProps {
  empfehlungId: string;
}

export function CompleteForm({ empfehlungId }: CompleteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/referrals/${empfehlungId}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

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
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "16px" }}
    >
      <div
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: "20px",
          marginTop: "8px",
        }}
      >
        <h3
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--text-muted)",
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          Kandidat eingestellt?
        </h3>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "12px",
            backgroundColor: "var(--red-bg)",
            color: "var(--red)",
            borderRadius: "var(--radius-sm)",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      <Button
        type="submit"
        loading={loading}
        size="lg"
        style={{
          backgroundColor: "var(--green)",
        }}
      >
        Als eingestellt markieren
      </Button>
    </form>
  );
}
