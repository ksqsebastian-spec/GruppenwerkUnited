"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

// Größen-Klassen im VOB-Designsystem
const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

// Varianten-Klassen im VOB-Designsystem
function getVariantClasses(variant: ButtonVariant): string {
  const base =
    "rounded-lg font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap border";

  switch (variant) {
    case "primary":
      return `${base} bg-foreground text-background border-foreground hover:bg-foreground/90`;
    case "secondary":
      return `${base} bg-card text-foreground border-border hover:bg-muted`;
    case "danger":
      return `${base} bg-red-600 text-white border-red-600 hover:bg-red-700`;
    case "ghost":
      return `${base} bg-transparent text-muted-foreground border-transparent hover:bg-muted`;
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", loading, disabled, children, className = "", style, ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${getVariantClasses(variant)} ${sizeClasses[size]} ${disabled || loading ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
        style={style}
        {...props}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {children}
      </button>
    );
  }
);
