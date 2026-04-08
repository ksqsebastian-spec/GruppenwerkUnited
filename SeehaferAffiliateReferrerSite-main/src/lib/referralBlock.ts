import type { ReferralData } from "@/types";

export function getReferralBlockText(data: ReferralData): string {
  const bankSection =
    data.noPaypal && data.kontoinhaber
      ? `\nBankverbindung:\nKontoinhaber: ${data.kontoinhaber}\nIBAN: ${data.iban}\n`
      : "";

  return `———————————
Empfehlung
Dieser Auftrag wurde
empfohlen von:
${data.name}
${data.email}
${bankSection}Ref: ${data.refCode}
———————————`;
}
