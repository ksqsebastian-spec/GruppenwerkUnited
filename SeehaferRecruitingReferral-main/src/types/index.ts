export interface ReferralFormData {
  name: string;
  email: string;
  candidateName: string;
}

export interface ReferralData extends ReferralFormData {
  refCode: string;
}

const nameRegex = /^[a-zA-ZäöüÄÖÜßéèêàáâ\s\-]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidationErrors {
  name?: string;
  email?: string;
  candidateName?: string;
}

export function validateForm(data: ReferralFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  // Name
  if (!data.name) {
    errors.name = "Bitte gib deinen Namen ein.";
  } else if (data.name.length > 80) {
    errors.name = "Name darf maximal 80 Zeichen haben.";
  } else if (!nameRegex.test(data.name)) {
    errors.name = "Nur Buchstaben, Leerzeichen und Bindestriche erlaubt.";
  }

  // Email
  if (!data.email) {
    errors.email = "Bitte gib deine E-Mail ein.";
  } else if (data.email.length > 120) {
    errors.email = "E-Mail darf maximal 120 Zeichen haben.";
  } else if (!emailRegex.test(data.email)) {
    errors.email = "Bitte gib eine gültige E-Mail-Adresse ein.";
  }

  // Candidate name
  if (!data.candidateName) {
    errors.candidateName = "Bitte gib den Namen der empfohlenen Person ein.";
  } else if (data.candidateName.length > 80) {
    errors.candidateName = "Name darf maximal 80 Zeichen haben.";
  } else if (!nameRegex.test(data.candidateName)) {
    errors.candidateName =
      "Nur Buchstaben, Leerzeichen und Bindestriche erlaubt.";
  }

  return errors;
}
