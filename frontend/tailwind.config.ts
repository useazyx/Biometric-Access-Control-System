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
 * - v3.0.0 (2026-09-10): Toda cor passou a declarar <alpha-value>. Sem esse marcador o
 *                        Tailwind NÃO gera as variantes com opacidade: bg-primary/10,
 *                        border-border/70 e afins simplesmente não existiam no CSS, e o
 *                        elemento ficava sem cor nenhuma. Isso derrubava calado as
 *                        etiquetas de estado, o fundo do cabeçalho das tabelas e até o
 *                        hover dos botões do shadcn (hover:bg-primary/90).
 *                        Entraram também os quadros da leitura da digital do login.
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
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        // Cores com significado no domínio do sistema: um acesso é autorizado ou
        // negado, não "verde" ou "vermelho". Assim toda tela usa o mesmo tom.
        authorized: {
          DEFAULT: "hsl(var(--authorized) / <alpha-value>)",
          foreground: "hsl(var(--authorized-foreground) / <alpha-value>)",
        },
        denied: {
          DEFAULT: "hsl(var(--denied) / <alpha-value>)",
          foreground: "hsl(var(--denied-foreground) / <alpha-value>)",
        },
        pending: {
          DEFAULT: "hsl(var(--pending) / <alpha-value>)",
          foreground: "hsl(var(--pending-foreground) / <alpha-value>)",
        },
        entry: "hsl(var(--entry) / <alpha-value>)",
        exit: "hsl(var(--exit) / <alpha-value>)",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          primary: "hsl(var(--sidebar-primary) / <alpha-value>)",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          accent: "hsl(var(--sidebar-accent) / <alpha-value>)",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
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
        // Barra fina que atravessa o topo da tabela enquanto uma página nova carrega
        loading: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(400%)" },
        },
        // A luz do leitor varrendo a digital, de cima a baixo e de volta.
        // Só translateY: a GPU compõe sozinha, sem repintar a cada quadro.
        "scan-sweep": {
          "0%": { transform: "translateY(-115%)" },
          "50%": { transform: "translateY(115%)" },
          "100%": { transform: "translateY(-115%)" },
        },
        // A digital "respirando" enquanto é lida. Só opacity, igualmente barato.
        "scan-pulse": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.85" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "pop-in": {
          from: { opacity: "0", transform: "scale(0.94)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        loading: "loading 1.1s ease-in-out infinite",
        "scan-sweep": "scan-sweep 1.6s ease-in-out infinite",
        "scan-pulse": "scan-pulse 1.6s ease-in-out infinite",
        "fade-in": "fade-in 0.25s ease-out both",
        "pop-in": "pop-in 0.32s cubic-bezier(0.2, 0.8, 0.3, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config
