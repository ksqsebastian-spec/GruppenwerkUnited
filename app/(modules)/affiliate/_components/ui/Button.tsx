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

// Klassen je nach Variante
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-foreground text-background border border-foreground hover:bg-foreground/90",
  secondary: "bg-muted text-foreground border border-border hover:bg-muted/80",
  danger: "bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90",
  ghost: "bg-transparent text-muted-foreground border border-transparent hover:bg-muted",
};

// Klassen je nach Größe
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", loading, disabled, children, className = "", style, ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2 rounded-lg font-medium
          transition-colors whitespace-nowrap cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          ${VARIANT_CLASSES[variant]}
          ${SIZE_CLASSES[size]}
          ${className}
        `}
        style={style}
        {...props}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {children}
      </button>
    );
  }
);
