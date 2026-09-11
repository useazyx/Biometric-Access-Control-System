/**
 * Pagination.tsx - A barra de navegação entre páginas das listagens
 * # Pra que serve?
 * - Mostrar qual fatia do total está na tela, em vez de só "página 3"
 * - Deixar escolher quantas linhas cabem, sem passar do teto que a API aceita
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Primeira versão, junto com o painel novo
 */

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/format"
import { PAGE_SIZE_OPTIONS } from "@/hooks/usePagedList"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  /** Como chamar o que está sendo listado: "aluno", "registro"... */
  noun?: string
  nounPlural?: string
  disabled?: boolean
}

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  noun = "registro",
  nounPlural,
  disabled,
}: PaginationProps) {
  const plural = nounPlural ?? noun + "s"

  // A fatia que está na tela. Na última página o fim é o total, não page * pageSize.
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  const canGoBack = page > 1 && !disabled
  const canGoForward = page < totalPages && !disabled

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-3">
      <p className="text-[0.8125rem] text-muted-foreground">
        {total === 0 ? (
          <>Nenhum {noun} encontrado</>
        ) : (
          <>
            Mostrando <span className="numeric font-medium text-foreground">{formatNumber(first)}</span>
            {"–"}
            <span className="numeric font-medium text-foreground">{formatNumber(last)}</span> de{" "}
            <span className="numeric font-medium text-foreground">{formatNumber(total)}</span> {plural}
          </>
        )}
      </p>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-[0.8125rem] text-muted-foreground">Linhas</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 w-[4.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoBack}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>

          <span className="numeric px-2 text-[0.8125rem] text-muted-foreground">
            {page} / {Math.max(totalPages, 1)}
          </span>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoForward}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}
