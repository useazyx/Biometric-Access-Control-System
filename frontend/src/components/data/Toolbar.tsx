/**
 * Toolbar.tsx - A faixa de busca e filtros que fica acima de cada tabela
 * # Pra que serve?
 * - Dar o mesmo campo de busca, com o mesmo comportamento, em toda listagem
 * - Abrigar os filtros próprios de cada tela sem cada uma inventar um layout
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Primeira versão, junto com o painel novo
 */

import type { ReactNode } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface ToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  /** Filtros específicos da tela (selects de período, tipo, data...). */
  children?: ReactNode
  /** Ação primária da tela, alinhada à direita. */
  action?: ReactNode
}

export function Toolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Buscar por nome, e-mail ou CPF",
  children,
  action,
}: ToolbarProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[13rem] flex-1 sm:max-w-sm">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="pl-8 pr-8"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Limpar a busca"
            className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>

      {children}

      {action && <div className="ml-auto">{action}</div>}
    </div>
  )
}

/** Botão que zera todos os filtros de uma tela de uma vez. */
export function ClearFiltersButton({ onClear, show }: { onClear: () => void; show: boolean }) {
  if (!show) return null

  return (
    <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
      <X className="mr-1 h-3.5 w-3.5" aria-hidden />
      Limpar filtros
    </Button>
  )
}
