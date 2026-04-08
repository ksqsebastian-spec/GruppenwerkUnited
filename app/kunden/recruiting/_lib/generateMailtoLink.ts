import type { ReferralData } from "./types";
import { getReferralBlockText } from "./referralBlock";

export function generateMailtoLink(data: ReferralData): string {
  const subject = encodeURIComponent(
    "Empfehlung – Seehafer Elemente Fachkräfte",
  );
  const body = encodeURIComponent(getReferralBlockText(data));
  return `mailto:?subject=${subject}&body=${body}`;
}

export function generateGmailLink(data: ReferralData): string {
  const subject = encodeURIComponent(
    "Empfehlung – Seehafer Elemente Fachkräfte",
  );
  const body = encodeURIComponent(getReferralBlockText(data));
  return `https://mail.google.com/mail/?view=cm&su=${subject}&body=${body}`;
}
