/**
 * WebAccessLogs.tsx - A auditoria de quem entrou no sistema web
 * # Pra que serve?
 * - Saber quem acessou a administração, quando saiu e quanto tempo ficou
 * - Distinguir sessão encerrada de sessão ainda aberta
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-09-03): Primeira versão da consulta
 * - v2.0.0 (2026-09-10): Reescrita com paginação de servidor. A versão antiga pedia
 *                        page_size=1000 "pra mostrar mais registros" e não mostrava
 *                        nenhum, porque a API recusa acima de 100.
 */

import { useState } from "react"
import { usePagedList } from "@/hooks/usePagedList"
import { formatDateTime, formatDuration } from "@/lib/format"
import { labelOf, PERSON_TYPE_LABELS } from "@/lib/labels"
import type { WebLogRow } from "@/types/api"
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

export default function WebAccessLogs() {
  const [filters, setFilters] = useState<LogFilterState>(EMPTY_LOG_FILTERS)

  const list = usePagedList<WebLogRow>({
    queryKey: "web-logs",
    endpoint: "/web-access-logs",
    itemsKey: "logs",
    params: toLogParams(filters),
    searchParam: "cpf",
  })

  const columns: Column<WebLogRow>[] = [
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
      key: "login",
      header: "Entrou",
      cell: (row) => <span className="numeric whitespace-nowrap">{formatDateTime(row.login_time)}</span>,
    },
    {
      key: "logout",
      header: "Saiu",
      hideBelow: "lg",
      cell: (row) =>
        row.logout_time ? (
          <span className="numeric whitespace-nowrap text-muted-foreground">
            {formatDateTime(row.logout_time)}
          </span>
        ) : (
          // Sem hora de saída a sessão nunca foi encerrada: ou ainda está aberta,
          // ou a pessoa fechou o navegador sem sair. Vale sinalizar.
          <StatusBadge tone="pending">Em aberto</StatusBadge>
        ),
    },
    {
      key: "duration",
      header: "Duração",
      align: "right",
      hideBelow: "sm",
      cell: (row) => (
        <span className="numeric text-muted-foreground">
          {formatDuration(row.session_duration_minutes)}
        </span>
      ),
    },
    {
      key: "unit",
      header: "Unidade",
      align: "right",
      hideBelow: "xl",
      cell: (row) => (
        <span className="identifier text-muted-foreground">{row.unit?.unit_code ?? "—"}</span>
      ),
    },
  ]

  const filtering = hasActiveFilters(filters)

  return (
    <>
      <PageHeader
        title="Acessos ao sistema"
        description="Quem entrou na administração web, quando saiu e quanto tempo ficou."
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
        emptyTitle="Nenhum acesso no período"
        emptyDescription={
          filtering || list.search
            ? "Amplia o período ou limpa os filtros."
            : "Todo login na administração web fica registrado aqui."
        }
      />

      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        noun="acesso"
        nounPlural="acessos"
        disabled={list.isFetching}
      />
    </>
  )
}
