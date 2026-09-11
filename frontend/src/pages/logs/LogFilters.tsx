/**
 * LogFilters.tsx - Os filtros compartilhados pelas duas telas de registro de acesso
 * # Pra que serve?
 * - Ter o mesmo período e o mesmo filtro de evento nas duas telas de log
 * - Evitar duas implementações que divergem com o tempo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Primeira versão, junto com o painel novo
 */

import { EVENT_TYPES } from "@/types/api"
import { EVENT_TYPE_LABELS } from "@/lib/labels"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const ALL = "all"

export interface LogFilterState {
  startDate: string
  endDate: string
  eventType: string
}

export const EMPTY_LOG_FILTERS: LogFilterState = {
  startDate: "",
  endDate: "",
  eventType: ALL,
}

export function hasActiveFilters(filters: LogFilterState): boolean {
  return Boolean(filters.startDate || filters.endDate || filters.eventType !== ALL)
}

/** Converte o estado da tela nos parâmetros que a API espera. */
export function toLogParams(filters: LogFilterState) {
  return {
    start_date: filters.startDate || undefined,
    end_date: filters.endDate || undefined,
    event_type: filters.eventType === ALL ? undefined : filters.eventType,
  }
}

export function LogFilters({
  filters,
  onChange,
}: {
  filters: LogFilterState
  onChange: (filters: LogFilterState) => void
}) {
  return (
    <>
      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          value={filters.startDate}
          onChange={(event) => onChange({ ...filters, startDate: event.target.value })}
          aria-label="Data inicial"
          className="w-[9.5rem]"
          // Impede escolher um início depois do fim, que devolveria lista vazia
          max={filters.endDate || undefined}
        />
        <span className="text-[0.8125rem] text-muted-foreground">até</span>
        <Input
          type="date"
          value={filters.endDate}
          onChange={(event) => onChange({ ...filters, endDate: event.target.value })}
          aria-label="Data final"
          className="w-[9.5rem]"
          min={filters.startDate || undefined}
        />
      </div>

      <Select
        value={filters.eventType}
        onValueChange={(value) => onChange({ ...filters, eventType: value })}
      >
        <SelectTrigger className="w-[9.5rem]" aria-label="Filtrar por evento">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Entrada e saída</SelectItem>
          {EVENT_TYPES.map((value) => (
            <SelectItem key={value} value={value}>
              {EVENT_TYPE_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}
