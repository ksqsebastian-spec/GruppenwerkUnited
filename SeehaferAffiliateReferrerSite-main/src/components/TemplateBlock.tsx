"use client";

import { motion } from "motion/react";
import type { ReferralData } from "@/types";

interface TemplateBlockProps {
  data: ReferralData;
}

export default function TemplateBlock({ data }: TemplateBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-orange-bg rounded-[var(--radius-sm)] p-4"
    >
      <p className="text-text-muted mb-2 text-[12px] font-semibold tracking-[1px] uppercase">
        Dein Empfehlungsblock
      </p>
      <div className="text-text-main space-y-1 text-sm">
        <p className="text-text-muted">———————————</p>
        <p className="font-bold">
          <span role="img" aria-label="Pin">
            📌
          </span>{" "}
          Empfehlung
        </p>
        <p>Dieser Auftrag wurde</p>
        <p>empfohlen von:</p>
        <p className="font-semibold">{data.name}</p>
        <p>{data.email}</p>
        {data.noPaypal && data.kontoinhaber && (
          <>
            <p className="text-text-muted mt-2 text-[12px] font-semibold">
              Bankverbindung:
            </p>
            <p>Kontoinhaber: {data.kontoinhaber}</p>
            <p>IBAN: {data.iban}</p>
          </>
        )}
        <p>Ref: {data.refCode}</p>
        <p className="text-text-muted">———————————</p>
      </div>
    </motion.div>
  );
}
