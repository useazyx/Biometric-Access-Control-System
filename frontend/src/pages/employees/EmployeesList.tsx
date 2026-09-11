/**
 * EmployeesList.tsx - A equipe da unidade, com cargo e situação
 * # Pra que serve?
 * - Ver quem trabalha na unidade, com qual cargo e desde quando
 * - Distinguir de cara quem está ativo de quem foi desligado
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-08-22): Primeira versão da listagem
 * - v2.0.0 (2026-09-10): Reescrita com paginação e busca do servidor
 */

import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { useUnitCode } from "@/contexts/AuthContext"
import { usePagedList } from "@/hooks/usePagedList"
import { formatCpf, formatDate, orDash } from "@/lib/format"
import type { EmployeeRow } from "@/types/api"
import { PageHeader, PersonCell, StatusBadge } from "@/components/data/Primitives"
import { Column, DataTable } from "@/components/data/DataTable"
import { Pagination } from "@/components/data/Pagination"
import { ClearFiltersButton, Toolbar } from "@/components/data/Toolbar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ALL = "all"

export default function EmployeesList() {
  const unitCode = useUnitCode()
  const [situation, setSituation] = useState<string>(ALL)

  const list = usePagedList<EmployeeRow>({
    queryKey: "employees",
    endpoint: "/employees",
    itemsKey: "employees",
    enabled: Boolean(unitCode),
    params: { unit_code: unitCode ?? "" },
  })

  // A API não filtra por situação: este filtro vale sobre a página carregada
  const rows = useMemo(() => {
    if (situation === ALL) return list.rows
    const wantActive = situation === "active"
    return list.rows.filter((row) => row.active === wantActive)
  }, [list.rows, situation])

  const filtering = situation !== ALL

  const columns: Column<EmployeeRow>[] = [
    {
      key: "employee",
      header: "Funcionário",
      cell: (row) => <PersonCell name={row.full_name} secondary={row.email} />,
    },
    {
      key: "registration",
      header: "Matrícula",
      cell: (row) => <span className="identifier">{orDash(row.registration_number)}</span>,
    },
    {
      key: "role",
      header: "Cargo",
      hideBelow: "sm",
      cell: (row) => <span>{orDash(row.role_name)}</span>,
    },
    {
      key: "cpf",
      header: "CPF",
      hideBelow: "lg",
      cell: (row) => <span className="identifier">{formatCpf(row.cpf)}</span>,
    },
    {
      key: "admission",
      header: "Admissão",
      hideBelow: "xl",
      cell: (row) => (
        <span className="numeric text-muted-foreground">{formatDate(row.admission_date)}</span>
      ),
    },
    {
      key: "active",
      header: "Situação",
      align: "right",
      cell: (row) => (
        <StatusBadge tone={row.active ? "authorized" : "neutral"}>
          {row.active ? "Ativo" : "Inativo"}
        </StatusBadge>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Funcionários"
        description="A equipe cadastrada na sua unidade."
        action={
          <Button asChild>
            <Link to="/employees/create">
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              Cadastrar funcionário
            </Link>
          </Button>
        }
      />

      <Toolbar search={list.search} onSearchChange={list.setSearch}>
        <Select value={situation} onValueChange={setSituation}>
          <SelectTrigger className="w-[9.5rem]" aria-label="Filtrar por situação">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toda situação</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>

        <ClearFiltersButton show={filtering} onClear={() => setSituation(ALL)} />
      </Toolbar>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        isLoading={list.isLoading}
        isFetching={list.isFetching}
        isError={list.isError}
        error={list.error}
        onRetry={list.refetch}
        emptyTitle={
          list.search || filtering ? "Nenhum funcionário encontrado" : "Nenhum funcionário cadastrado"
        }
        emptyDescription={
          list.search || filtering
            ? "Ajusta a busca ou o filtro."
            : "Cadastre a pessoa primeiro e depois vincule a matrícula e o cargo."
        }
      />

      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={filtering ? rows.length : list.total}
        totalPages={filtering ? 1 : list.totalPages}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        noun="funcionário"
        nounPlural="funcionários"
        disabled={list.isFetching}
      />

      {filtering && (
        <p className="mt-2 text-[0.75rem] text-muted-foreground">
          A situação filtra os funcionários desta página. A busca, essa roda no servidor.
        </p>
      )}
    </>
  )
}
