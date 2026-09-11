/**
 * tailwind.config.ts - Liga os tokens do design system nas classes do Tailwind
 * # Pra que serve?
 * - Deixar as cores do index.css disponíveis como classe (ex: bg-authorized)
 * - Definir a tipografia e as sombras do sistema num lugar só
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-08-10): Configuração padrão do shadcn/ui
 * - v2.0.0 (2026-09-09): Expostos os tokens semânticos de acesso (authorized/denied/
 *                        pending/entry/exit), a fonte do sistema e a escala de sombra.
 *                        Retirado o "./app/**" do content, que não existe neste projeto.
 */

import type { Config } from "tailwindcss"

export default {
  darkMode: ["class"],
  // Só as pastas que existem de verdade: varrer pasta inexistente é só custo de build
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // Inter pra interface; se não carregar, cai na fonte do sistema
        sans: [
          "Inter var",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        // Monoespaçada pros identificadores: CPF, RM, código de unidade, template
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      colors: {
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
        // Cores com significado no domínio do sistema: um acesso é autorizado ou
        // negado, não "verde" ou "vermelho". Assim toda tela usa o mesmo tom.
        authorized: {
          DEFAULT: "hsl(var(--authorized))",
          foreground: "hsl(var(--authorized-foreground))",
        },
        denied: {
          DEFAULT: "hsl(var(--denied))",
          foreground: "hsl(var(--denied-foreground))",
        },
        pending: {
          DEFAULT: "hsl(var(--pending))",
          foreground: "hsl(var(--pending-foreground))",
        },
        entry: "hsl(var(--entry))",
        exit: "hsl(var(--exit))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        // Uma escala só de sombra, definida em tokens (funciona no claro e no escuro)
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
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
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config
