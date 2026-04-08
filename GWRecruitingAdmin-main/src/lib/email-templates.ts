// Email template generator — produces copy-pasteable text for Outlook/mail clients.
// No automated sending; admin copies the output manually.

export type EmailType = "ausgezahlt";

interface AusgezahltParams {
  empfehlerName: string;
  empfehlerEmail: string;
  refCode: string;
  praemieBetrag: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function generateAusgezahltEmail(params: AusgezahltParams) {
  return {
    subject: "Deine Prämie wurde ausgezahlt",
    body: `Hey ${params.empfehlerName},

deine Prämie für die Empfehlung (Ref: ${params.refCode}) in Höhe von ${formatCurrency(params.praemieBetrag)} wurde soeben überwiesen.

Danke fürs Empfehlen!

Viele Grüße,
Seehafer Elemente`,
  };
}

export function generateMailtoLink(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
