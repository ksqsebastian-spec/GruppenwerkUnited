import type { ReferralData } from "./types";

/**
 * Generiert den Empfehlungstext-Block für Recruiting-Empfehlungen
 */
export function getReferralBlockText(data: ReferralData): string {
  return `———————————
Fachkräfte-Empfehlung
Empfohlen von:
${data.name}
${data.email}
Kandidat/in: ${data.candidateName}
Ref: ${data.refCode}
———————————`;
}
