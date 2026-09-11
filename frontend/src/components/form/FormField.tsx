/**
 * FormField.tsx - As peças de formulário que todas as telas de cadastro usam
 * # Pra que serve?
 * - Amarrar rótulo, campo, dica e erro com os ids certos, pra leitor de tela seguir
 * - Deixar o erro do servidor aparecer embaixo do campo que ele reclamou
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Primeira versão, junto com o painel novo
 */

import { useId, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface FieldProps {
  label: string
  /** Mensagem de erro; quando presente, marca o campo como inválido. */
  error?: string
  /** Explicação curta embaixo do campo. */
  hint?: string
  required?: boolean
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode
  className?: string
}

export function FormField({ label, error, hint, required, children, className }: FieldProps) {
  const id = useId()
  const hintId = id + "-hint"
  const errorId = id + "-error"

  // O leitor de tela precisa saber qual texto explica o campo, e o erro tem prioridade
  const describedBy = error ? errorId : hint ? hintId : undefined

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden>
            *
          </span>
        )}
      </Label>

      {children({ id, describedBy, invalid: Boolean(error) })}

      {error ? (
        <p id={errorId} className="text-[0.75rem] text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[0.75rem] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** Campo de texto simples: o caso mais comum, já montado. */
export function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  required,
  type = "text",
  placeholder,
  autoComplete,
  maxLength,
  className,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  required?: boolean
  type?: string
  placeholder?: string
  autoComplete?: string
  maxLength?: number
  className?: string
  disabled?: boolean
}) {
  return (
    <FormField label={label} error={error} hint={hint} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          disabled={disabled}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={cn(invalid && "border-destructive focus-visible:ring-destructive")}
        />
      )}
    </FormField>
  )
}

/** Linha de botões do rodapé do formulário. */
export function FormActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-end gap-2 pt-1">{children}</div>
}

/** Grade de duas colunas que vira uma só em tela estreita. */
export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>
}
