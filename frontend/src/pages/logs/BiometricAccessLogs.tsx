/**
 * BiometricAccessLogs.tsx - Toda passagem pela catraca, autorizada ou não
 * # Pra que serve?
 * - Responder quem estava na escola numa determinada hora, sem investigação
 * - Mostrar as tentativas NEGADAS, que são o que interessa numa ocorrência
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-09-03): Primeira versão da consulta
 * - v2.0.0 (2026-09-10): Reescrita com paginação de servidor e filtro por período.
 *                        Esta rota pagina com total_items em vez de total.
 */

import { useState } from "react"
import { useUnitCode } from "@/contexts/AuthContext"
import { usePagedList } from "@/hooks/usePagedList"
import { formatDateTime, orDash } from "@/lib/format"
import { EVENT_TYPE_LABELS, EVENT_TYPE_TONES, labelOf, PERSON_TYPE_LABELS } from "@/lib/labels"
import type { BiometricLogRow } from "@/types/api"
import { PageHeader, PersonCell, StatusBadge } from "@/components/data/Primitives"
import { Column, DataTable } from "@/components/data/DataTable"
import { Pagination } from "@/components/data/Pagination"
import { ClearFiltersButton, Toolbar } from "@/components/data/Toolbar"
import {
  EMPTY_LOG_FILTERS,
  hasActiveFilters,
  LogFilters,
  toLogParams,
  type LogFilterState,
} from "./LogFilters"

export default function BiometricAccessLogs() {
  const unitCode = useUnitCode()
  const [filters, setFilters] = useState<LogFilterState>(EMPTY_LOG_FILTERS)

  const list = usePagedList<BiometricLogRow>({
    queryKey: "biometric-logs",
    endpoint: "/biometric-access-logs",
    itemsKey: "logs",
    params: toLogParams(filters),
    // Esta rota não tem busca por texto livre: o que ela aceita é o CPF exato
    searchParam: "cpf",
  })

  const columns: Column<BiometricLogRow>[] = [
    {
      key: "person",
      header: "Pessoa",
      cell: (row) => <PersonCell name={row.person?.full_name} cpf={row.person?.cpf} />,
    },
    {
      key: "type",
      header: "Perfil",
      hideBelow: "md",
      cell: (row) => (
        <span className="text-muted-foreground">
          {labelOf(PERSON_TYPE_LABELS, row.person?.type)}
        </span>
      ),
    },
    {
      key: "event",
      header: "Evento",
      cell: (row) => (
        <StatusBadge tone={EVENT_TYPE_TONES[row.event_type] ?? "neutral"}>
          {labelOf(EVENT_TYPE_LABELS, row.event_type)}
        </StatusBadge>
      ),
    },
    {
      key: "authorized",
      header: "Resultado",
      cell: (row) => (
        <StatusBadge tone={row.is_authorized ? "authorized" : "denied"}>
          {row.is_authorized ? "Autorizado" : "Negado"}
        </StatusBadge>
      ),
    },
    {
      key: "device",
      header: "Sensor",
      hideBelow: "xl",
      cell: (row) => (
        <span className="text-muted-foreground">{orDash(row.biometric_device)}</span>
      ),
    },
    {
      key: "unit",
      header: "Unidade",
      hideBelow: "lg",
      cell: (row) => (
        <span className="identifier text-muted-foreground">{row.unit?.unit_code ?? "—"}</span>
      ),
    },
    {
      key: "time",
      header: "Quando",
      align: "right",
      cell: (row) => (
        <span className="numeric whitespace-nowrap">{formatDateTime(row.access_time)}</span>
      ),
    },
  ]

  const filtering = hasActiveFilters(filters)

  return (
    <>
      <PageHeader
        title="Acessos da catraca"
        description="Toda passagem registrada pelo sensor, incluindo as tentativas negadas."
      />

      <Toolbar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Buscar pelo CPF da pessoa"
      >
        <LogFilters filters={filters} onChange={setFilters} />
        <ClearFiltersButton show={filtering} onClear={() => setFilters(EMPTY_LOG_FILTERS)} />
      </Toolbar>

      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(row) => row.id}
        isLoading={list.isLoading}
        isFetching={list.isFetching}
        isError={list.isError}
        error={list.error}
        onRetry={list.refetch}
        emptyTitle="Nenhuma passagem no período"
        emptyDescription={
          filtering || list.search
            ? "Amplia o período ou limpa os filtros."
            : "Assim que alguém encostar o dedo no sensor, a passagem aparece aqui."
        }
      />

      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        noun="passagem"
        nounPlural="passagens"
        disabled={list.isFetching}
      />

      <p className="mt-2 text-[0.75rem] text-muted-foreground">
        Mostrando os acessos de todas as unidades
        {unitCode ? ", inclusive a sua (" + unitCode + ")" : ""}.
      </p>
    </>
  )
}
