"use client";

import { useState } from "react";
import { validateForm, type ReferralFormData } from "@/types";
import { generateRefCode } from "@/lib/generateRefCode";
import {
  generateMailtoLink,
  generateGmailLink,
} from "@/lib/generateMailtoLink";
import { generatePDF } from "@/lib/generatePDF";
import { getReferralBlockText } from "@/lib/referralBlock";

export default function ReferralForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [refCode] = useState(generateRefCode);
  const [copied, setCopied] = useState(false);

  const form: ReferralFormData = { name, email, candidateName };
  const errors = validateForm(form);
  const isReady =
    Object.keys(errors).length === 0 &&
    name.length > 0 &&
    email.length > 0 &&
    candidateName.length > 0;

  const referralData = { ...form, refCode };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleCopy = async () => {
    const text = getReferralBlockText(referralData);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const inputClass = (field: string) =>
    `w-full rounded-lg border px-4 py-3 text-sm transition-colors outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 ${
      touched[field] && errors[field as keyof typeof errors]
        ? "border-red-400"
        : "border-gray-200"
    }`;

  return (
    <section className="pb-8">
      <div
        className="rounded-2xl bg-white p-5 sm:p-8"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      >
        <div className="flex flex-col gap-5">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-xs font-semibold tracking-widest text-gray-500 uppercase"
            >
              Dein Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Lisa Schmidt"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur("name")}
              className={inputClass("name")}
            />
            {touched.name && errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-semibold tracking-widest text-gray-500 uppercase"
            >
              Deine E-Mail
            </label>
            <input
              id="email"
              type="email"
              placeholder="lisa.schmidt@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email")}
              className={inputClass("email")}
            />
            {touched.email && errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Candidate Name */}
          <div>
            <label
              htmlFor="candidateName"
              className="mb-1.5 block text-xs font-semibold tracking-widest text-gray-500 uppercase"
            >
              Wen empfiehlst du?
            </label>
            <input
              id="candidateName"
              type="text"
              placeholder="Tim Wagner"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              onBlur={() => handleBlur("candidateName")}
              className={inputClass("candidateName")}
            />
            {touched.candidateName && errors.candidateName && (
              <p className="mt-1 text-xs text-red-500">
                {errors.candidateName}
              </p>
            )}
          </div>

          {/* Template block preview */}
          {isReady && (
            <div className="fade-in rounded-lg bg-orange-50 p-4">
              <p className="mb-2 text-xs font-semibold tracking-widest text-gray-500 uppercase">
                Dein Empfehlungs-Text
              </p>
              <div className="space-y-1 text-sm text-gray-800">
                <p className="text-gray-400">———————————</p>
                <p className="font-bold">📌 Fachkräfte-Empfehlung</p>
                <p>
                  Empfohlen von: <span className="font-semibold">{name}</span>
                </p>
                <p>Kontakt: {email}</p>
                <p>Ref: {refCode}</p>
                <p className="text-gray-400">———————————</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2.5">
            {/* Copy to clipboard */}
            <button
              type="button"
              onClick={handleCopy}
              disabled={!isReady}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white transition-all ${
                !isReady
                  ? "cursor-not-allowed bg-orange-300 opacity-50"
                  : copied
                    ? "bg-green-600"
                    : "bg-orange-500 hover:-translate-y-px hover:bg-orange-600 hover:shadow-md"
              }`}
            >
              {copied ? "Kopiert!" : "In Zwischenablage kopieren"}
            </button>

            {/* Mail + Gmail + PDF row */}
            <div className="flex gap-2.5">
              <a
                href={isReady ? generateMailtoLink(referralData) : undefined}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-800 transition-all ${
                  isReady
                    ? "hover:-translate-y-px hover:shadow-md"
                    : "pointer-events-none opacity-50"
                }`}
                aria-disabled={!isReady}
              >
                E-Mail
              </a>
              <a
                href={isReady ? generateGmailLink(referralData) : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-800 transition-all ${
                  isReady
                    ? "hover:-translate-y-px hover:shadow-md"
                    : "pointer-events-none opacity-50"
                }`}
                aria-disabled={!isReady}
              >
                Gmail
              </a>
              <button
                type="button"
                onClick={() => generatePDF(referralData)}
                disabled={!isReady}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-800 transition-all ${
                  isReady
                    ? "hover:-translate-y-px hover:shadow-md"
                    : "pointer-events-none opacity-50"
                }`}
              >
                PDF
              </button>
            </div>
          </div>

          {/* Privacy note */}
          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            Daten werden nur zur Prämien-Auszahlung verwendet.
          </p>
        </div>
      </div>
    </section>
  );
}
