"use client";

import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

// Basis-Karte im VOB-Designsystem
export function Card({ hover = false, className = "", style, children, ...props }: CardProps) {
  return (
    <div
      className={`bg-card rounded-xl border border-border ${hover ? "hover:border-foreground/20 transition-colors cursor-pointer" : ""} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}
