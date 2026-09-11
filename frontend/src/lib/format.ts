/**
 * format.ts - Converte os dados crus da API no que a pessoa lê na tela
 * # Pra que serve?
 * - Formatar CPF, data, hora e duração de um jeito só no sistema inteiro
 * - Evitar que cada tela invente o próprio formato e a leitura fique inconsistente
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Primeira versão, junto com o painel novo
 */

/** O banco guarda CPF ora formatado, ora só com dígitos. Na tela sai sempre igual. */
export function formatCpf(cpf: string | null | undefined): string {
  if (!cpf) return "—"

  const digits = cpf.replace(/\D/g, "")
  if (digits.length !== 11) return cpf

  return digits.slice(0, 3) + "." + digits.slice(3, 6) + "." + digits.slice(6, 9) + "-" + digits.slice(9)
}

/** Guarda só os dígitos, que é o que os formulários mandam pra API. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "")
}

/** Vai formatando o CPF conforme a pessoa digita, sem atrapalhar o apagar. */
export function maskCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11)

  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2")
}

/** Telefone brasileiro, aceitando fixo (10 dígitos) e celular (11). */
export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11)

  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2")
  }

  return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2")
}

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" })
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

/** Só a data: 10/09/2026 */
export function formatDate(value: string | null | undefined): string {
  const date = parseDate(value)
  return date ? DATE_FORMATTER.format(date) : "—"
}

/** Data e hora: 10/09/2026 14:32 */
export function formatDateTime(value: string | null | undefined): string {
  const date = parseDate(value)
  return date ? DATE_TIME_FORMATTER.format(date) : "—"
}

/** Pra preencher input[type=date], que só aceita AAAA-MM-DD. */
export function toDateInput(value: string | null | undefined): string {
  const date = parseDate(value)
  return date ? date.toISOString().slice(0, 10) : ""
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Duração de sessão: a API manda minutos, a pessoa lê "1h 20min". */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "—"
  if (minutes < 1) return "menos de 1min"

  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)

  if (!hours) return rest + "min"
  if (!rest) return hours + "h"

  return hours + "h " + rest + "min"
}

/** Número com separador de milhar brasileiro. */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("pt-BR").format(value)
}

/** Campo de texto que pode vir vazio, nulo ou só com espaço. */
export function orDash(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : "—"
}

/** Iniciais pro avatar, no máximo duas letras. */
export function initials(fullName: string | null | undefined): string {
  if (!fullName) return "?"

  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
