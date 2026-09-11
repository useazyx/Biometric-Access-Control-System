/**
 * FormAlert.tsx - O aviso de erro que vale pro formulário inteiro
 * # Pra que serve?
 * - Mostrar a falha que não pertence a nenhum campo específico
 * - Ser anunciado por leitor de tela, já que aparece depois do envio
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Primeira versão, junto com o painel novo
 */

import { AlertCircle } from "lucide-react"

export function FormAlert({ message }: { message: string | null | undefined }) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-[0.8125rem] text-destructive"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  )
}
