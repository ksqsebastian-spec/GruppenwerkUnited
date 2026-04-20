/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // Sans: Plus Jakarta Sans (geladen via next/font)
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Serif: Georgia als Anthropic-Serif-Fallback für Überschriften
        serif: ['Georgia', 'ui-serif', 'serif'],
        // Mono: System-Monospace für Code
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // ─── shadcn/ui Token-Mapping (über CSS-Variablen) ────────────────────
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // ─── Anthropic / Claude Designsystem – benannte Tokens ──────────────
        // Direktzugriff: bg-parchment, text-olive-gray, border-cream, etc.
        parchment:      '#f5f4ed',
        ivory:          '#faf9f5',
        terracotta:     '#c96442',
        coral:          '#d97757',
        'warm-sand':    '#e8e6dc',
        'charcoal-warm':'#4d4c48',
        'olive-gray':   '#5e5d59',
        'stone-gray':   '#87867f',
        'border-cream': '#f0eee6',
        'dark-warm':    '#3d3d3a',
        'dark-surface': '#30302e',
        'near-black':   '#141413',
        'warm-silver':  '#b0aea5',
        // ─── ROI-Modul Farben ────────────────────────────────────────────────
        surface: {
          DEFAULT: "var(--roi-surface, #faf9f5)",
          2: "var(--roi-surface-2, #f0eee6)",
          3: "var(--roi-surface-3, #e8e6dc)",
        },
        "bg": "var(--roi-bg, #f5f4ed)",
        "text": {
          DEFAULT: "var(--roi-text, #141413)",
          muted: "var(--roi-text-muted, #5e5d59)",
          dim: "var(--roi-text-dim, #87867f)",
        },
        // ─── Vollständige Farbpaletten für Status-Farben ─────────────────────
        red: {
          DEFAULT: "var(--roi-red, #b53333)",
          light: "var(--roi-red-light, #FDECE5)",
          50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
          400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
          800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a',
        },
        blue: {
          DEFAULT: "var(--roi-blue, #1B4965)",
          light: "var(--roi-blue-light, #E3EFF6)",
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a5a', 950: '#172554',
        },
        amber: {
          DEFAULT: "var(--roi-amber, #B5651D)",
          light: "var(--roi-amber-light, #FFF3E0)",
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
          800: '#92400e', 900: '#78350f', 950: '#451a03',
        },
      },
      borderRadius: {
        lg: "var(--radius)",           // 8px
        md: "calc(var(--radius) - 2px)", // 6px
        sm: "calc(var(--radius) - 4px)", // 4px
        xl: "calc(var(--radius) * 1.5)", // 12px
        '2xl': "calc(var(--radius) * 2)", // 16px
        '4xl': "calc(var(--radius) * 4)", // 32px
      },
      boxShadow: {
        // Ring-basiertes Shadow-System (Anthropic-Signatur)
        'ring-warm':   '0px 0px 0px 1px #d1cfc5',
        'ring-subtle': '0px 0px 0px 1px #dedc01',
        'ring-deep':   '0px 0px 0px 1px #c2c0b6',
        'ring-dark':   '0px 0px 0px 1px #30302e',
        // Whisper Shadow – kaum sichtbares Heben
        'whisper':     'rgba(0,0,0,0.05) 0px 4px 24px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
