/**
 * DataTable.tsx - A tabela que todas as listagens usam
 * # Pra que serve?
 * - Ter UM lugar que sabe desenhar carregando, vazio, com erro e com dado
 * - Garantir que toda listagem do sistema tenha a mesma densidade e o mesmo
 *   comportamento de rolagem horizontal em tela estreita
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Primeira versão, junto com o painel novo
 */

import type { ReactNode } from "react"
import { AlertCircle, Inbox, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/api"
import { Button } from "@/components/ui/button"

export interface Column<TRow> {
  /** Identificador da coluna, usado como chave do React. */
  key: string
  header: ReactNode
  /** Como desenhar a célula desta coluna para uma linha. */
  cell: (row: TRow) => ReactNode
  /** Colunas que podem sumir em tela estreita sem prejudicar a leitura. */
  hideBelow?: "sm" | "md" | "lg" | "xl"
  /** Alinhamento; números e ações costumam ir pra direita. */
  align?: "left" | "right" | "center"
  /** Largura fixa, pra coluna de ação não esticar. */
  width?: string
}

interface DataTableProps<TRow> {
  columns: Column<TRow>[]
  rows: TRow[]
  /** Chave estável de cada linha. */
  rowKey: (row: TRow) => string | number
  isLoading?: boolean
  isFetching?: boolean
  isError?: boolean
  error?: unknown
  onRetry?: () => void
  /** Texto do estado vazio, que muda se a pessoa está filtrando ou não. */
  emptyTitle?: string
  emptyDescription?: string
  /** Ação disparada ao clicar na linha (abrir detalhe, por exemplo). */
  onRowClick?: (row: TRow) => void
}

const HIDE_CLASSES: Record<NonNullable<Column<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
}

const ALIGN_CLASSES = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const

export function DataTable<TRow>({
  columns,
  rows,
  rowKey,
  isLoading,
  isFetching,
  isError,
  error,
  onRetry,
  emptyTitle = "Nada por aqui ainda",
  emptyDescription = "Quando houver registro, ele aparece nesta lista.",
  onRowClick,
}: DataTableProps<TRow>) {
  const columnCount = columns.length

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card">
      {/* Recarregando uma página nova: avisa sem tirar a tabela antiga da tela */}
      {isFetching && !isLoading && (
        <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-primary/20">
          <div className="h-full w-1/3 animate-[loading_1.1s_ease-in-out_infinite] bg-primary" />
        </div>
      )}

      {/* A tabela é o único elemento que pode rolar de lado; o corpo da página, não */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[0.8125rem]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    "whitespace-nowrap px-3 py-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground",
                    ALIGN_CLASSES[column.align ?? "left"],
                    column.hideBelow && HIDE_CLASSES[column.hideBelow],
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <SkeletonRows columns={columns} />
            ) : isError ? (
              <StateRow colSpan={columnCount}>
                <ErrorState error={error} onRetry={onRetry} />
              </StateRow>
            ) : rows.length === 0 ? (
              <StateRow colSpan={columnCount}>
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </StateRow>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-b border-border/70 last:border-0 transition-colors",
                    onRowClick ? "cursor-pointer hover:bg-muted/60" : "hover:bg-muted/40",
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-3 py-2 align-middle",
                        ALIGN_CLASSES[column.align ?? "left"],
                        column.hideBelow && HIDE_CLASSES[column.hideBelow],
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StateRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-12">
        {children}
      </td>
    </tr>
  )
}

/** Esqueleto com a mesma quantidade de colunas, pra tabela não "pular" ao carregar. */
function SkeletonRows<TRow>({ columns }: { columns: Column<TRow>[] }) {
  return (
    <>
      {Array.from({ length: 8 }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-border/70 last:border-0">
          {columns.map((column) => (
            <td
              key={column.key}
              className={cn("px-3 py-2", column.hideBelow && HIDE_CLASSES[column.hideBelow])}
            >
              <div className="h-4 animate-pulse rounded bg-muted" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-sm text-[0.8125rem] text-muted-foreground">{description}</p>}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error?: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-medium">Não consegui carregar esta lista</p>
      <p className="max-w-md text-[0.8125rem] text-muted-foreground">
        {apiErrorMessage(error, "Tenta de novo daqui a pouco.")}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          Tentar de novo
        </Button>
      )}
    </div>
  )
}

/** Usado nas telas que carregam um registro só, fora de tabela. */
export function InlineLoading({ label = "Carregando..." }: { label?: string }) {
  return (
    <span className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      {label}
    </span>
  )
}
