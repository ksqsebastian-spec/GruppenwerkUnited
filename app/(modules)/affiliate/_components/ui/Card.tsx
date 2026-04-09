"use client";

import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

// Einfache Card-Komponente im VOB-Design
export function Card({ hover = false, style, className = "", children, ...props }: CardProps): React.JSX.Element {
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
