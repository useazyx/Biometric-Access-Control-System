/**
 * Primitives.tsx - As peças pequenas que se repetem em toda tela do painel
 * # Pra que serve?
 * - Cabeçalho de página, etiqueta de estado, cartão de número e célula de pessoa
 * - Manter a cor de estado saindo SEMPRE do token, nunca escrita na mão na tela
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Primeira versão, junto com o painel novo
 */

import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { formatCpf, formatNumber, initials } from "@/lib/format"
import type { Tone } from "@/lib/labels"

/** Título da tela, explicação curta e a ação principal. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold leading-tight">{title}</h2>
        {description && (
          <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

/**
 * Cada tom puxa de um token do index.css. É por isso que a etiqueta nunca recebe
 * uma cor literal: "autorizado" é um significado, não um verde específico.
 */
const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary/10 text-primary border-primary/25",
  authorized: "bg-authorized/10 text-authorized border-authorized/30",
  denied: "bg-denied/10 text-denied border-denied/30",
  pending: "bg-pending/15 text-pending border-pending/30",
  exit: "bg-exit/10 text-exit border-exit/30",
}

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[0.6875rem] font-medium leading-4",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Um número grande do painel, com o rótulo do que ele conta. */
export function StatTile({
  label,
  value,
  icon,
  to,
  hint,
}: {
  label: string
  value: number | null | undefined
  icon: ReactNode
  /** Quando informado, o cartão vira atalho pra listagem correspondente. */
  to?: string
  hint?: string
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[0.75rem] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </span>
      </div>
      <p className="numeric mt-2 text-2xl font-semibold leading-none">{formatNumber(value)}</p>
      {hint && <p className="mt-1.5 text-[0.75rem] text-muted-foreground">{hint}</p>}
    </>
  )

  const className = cn(
    "rounded-lg border border-border bg-card p-3.5 text-left",
    to && "transition-colors hover:border-primary/40 hover:bg-accent/40",
  )

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}

/**
 * Pessoa numa célula de tabela: nome em cima, identificador embaixo.
 * Junta as duas informações que sempre são consultadas em conjunto, e economiza
 * uma coluna inteira numa tabela que já é larga.
 */
export function PersonCell({
  name,
  cpf,
  secondary,
}: {
  name: string | null | undefined
  cpf?: string | null
  /** Alternativa ao CPF: e-mail, matrícula, o que identificar melhor naquela tela. */
  secondary?: string | null
}) {
  const below = secondary ?? (cpf ? formatCpf(cpf) : null)

  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-[0.625rem] font-semibold text-secondary-foreground">
        {initials(name)}
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate font-medium">{name || "—"}</span>
        {below && <span className="identifier truncate text-muted-foreground">{below}</span>}
      </span>
    </div>
  )
}

/** Bloco rotulado das telas de detalhe e de conta. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.75rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-sm">{children}</dd>
    </div>
  )
}

/** Cartão simples com título, usado nas telas que não são tabela. */
export function Panel({
  title,
  description,
  children,
  footer,
}: {
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      {(title || description) && (
        <header className="border-b border-border px-4 py-3">
          {title && <h3 className="text-sm font-semibold">{title}</h3>}
          {description && (
            <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">{description}</p>
          )}
        </header>
      )}
      <div className="p-4">{children}</div>
      {footer && <footer className="border-t border-border px-4 py-3">{footer}</footer>}
    </section>
  )
}
