import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CompleteForm } from "@/components/dashboard/CompleteForm";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Empfehlung } from "@/types";

export default async function EmpfehlungDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Fetch the empfehlung
  const { data: empfehlung, error } = await supabase
    .from("empfehlungen")
    .select("*")
    .eq("id", id)
    .single<Empfehlung>();

  if (error || !empfehlung) redirect("/dashboard");

  return (
    <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <Link
        href="/dashboard"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "var(--text-muted)",
          textDecoration: "none",
          fontSize: "14px",
        }}
      >
        <ArrowLeft size={16} />
        Zurück
      </Link>

      <h1 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
        Empfehlung Details
      </h1>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
              {empfehlung.kandidat_name}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "4px 0 0" }}>
              Empfehler: {empfehlung.empfehler_name}
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "2px 0 0" }}>
              {empfehlung.empfehler_email}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Ref: </span>
              <span style={{ fontWeight: 600 }}>{empfehlung.ref_code}</span>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Erfasst: </span>
              {formatDate(empfehlung.created_at)}
            </div>
            {empfehlung.kandidat_kontakt && (
              <div>
                <span style={{ color: "var(--text-muted)" }}>Kontakt: </span>
                {empfehlung.kandidat_kontakt}
              </div>
            )}
            {empfehlung.position && (
              <div>
                <span style={{ color: "var(--text-muted)" }}>Position: </span>
                {empfehlung.position}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Status:</span>
            <Badge status={empfehlung.status} />
          </div>

          {empfehlung.praemie_betrag && empfehlung.status !== "offen" && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "var(--green-bg)",
                borderRadius: "var(--radius-sm)",
                fontSize: "13px",
              }}
            >
              <div style={{ fontWeight: 600, color: "var(--green)" }}>
                Prämie: {formatCurrency(empfehlung.praemie_betrag)}
              </div>
            </div>
          )}

          {empfehlung.status === "ausgezahlt" && empfehlung.ausgezahlt_am && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#F3F0FF",
                borderRadius: "var(--radius-sm)",
                fontSize: "13px",
              }}
            >
              Ausgezahlt am {formatDate(empfehlung.ausgezahlt_am)}
            </div>
          )}

          {empfehlung.status === "offen" && (
            <CompleteForm empfehlungId={empfehlung.id} />
          )}
        </div>
      </Card>
    </div>
  );
}
