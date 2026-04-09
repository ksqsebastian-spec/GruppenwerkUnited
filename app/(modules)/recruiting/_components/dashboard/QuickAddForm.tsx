"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export function QuickAddForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setGeneralError("");

    const formData = new FormData(e.currentTarget);
    const body = {
      kandidat_name: formData.get("kandidat_name"),
      kandidat_kontakt: formData.get("kandidat_kontakt") || undefined,
      empfehler_name: formData.get("empfehler_name"),
      empfehler_email: formData.get("empfehler_email"),
      position: formData.get("position") || undefined,
      ref_code: formData.get("ref_code") || undefined,
    };

    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setErrors(
            Object.fromEntries(
              Object.entries(data.details).map(([k, v]) => [
                k,
                Array.isArray(v) ? v[0] : String(v),
              ])
            )
          );
        } else {
          setGeneralError(data.error || "Ein Fehler ist aufgetreten");
        }
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setGeneralError("Netzwerkfehler — bitte versuche es erneut");
    } finally {
      setLoading(false);
    }
  }

  const year = new Date().getFullYear();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {generalError && (
        <div role="alert" className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
          {generalError}
        </div>
      )}

      <Input
        label="Kandidat"
        name="kandidat_name"
        required
        maxLength={120}
        error={errors.kandidat_name}
        autoComplete="off"
      />

      <Input
        label="Kontakt (Email/Telefon)"
        name="kandidat_kontakt"
        maxLength={200}
        error={errors.kandidat_kontakt}
        autoComplete="off"
      />

      <Input
        label="Empfehler Name"
        name="empfehler_name"
        required
        maxLength={120}
        error={errors.empfehler_name}
        autoComplete="off"
      />

      <Input
        label="E-Mail"
        name="empfehler_email"
        type="email"
        required
        maxLength={200}
        error={errors.empfehler_email}
        autoComplete="off"
      />

      <Input
        label="Position (optional)"
        name="position"
        maxLength={200}
        error={errors.position}
        autoComplete="off"
      />

      <Input
        label="Ref-Code (optional)"
        name="ref_code"
        placeholder={`#SEE-${year}-`}
        maxLength={20}
        error={errors.ref_code}
        autoComplete="off"
      />

      <Button type="submit" loading={loading} size="lg">
        Empfehlung anlegen
      </Button>
    </form>
  );
}
