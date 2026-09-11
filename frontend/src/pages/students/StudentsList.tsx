/**
 * StudentsList.tsx - Os alunos da unidade, com RM, período e turma
 * # Pra que serve?
 * - Achar um aluno pelo RM, pelo nome ou pelo CPF
 * - Filtrar por período e por situação, que é como a coordenação pensa a turma
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-08-20): Primeira versão da listagem
 * - v2.0.0 (2026-09-10): Reescrita com paginação e busca do servidor. A versão antiga
 *                        pedia page_size=1000 e a tela quebrava antes de desenhar.
 */

import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { useUnitCode } from "@/contexts/AuthContext"
import { usePagedList } from "@/hooks/usePagedList"
import { orDash } from "@/lib/format"
import {
  labelOf,
  PERIOD_LABELS,
  STUDENT_STATUS_LABELS,
  STUDENT_STATUS_TONES,
} from "@/lib/labels"
import { PERIODS, STUDENT_STATUSES, type StudentRow } from "@/types/api"
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

export default function StudentsList() {
  const unitCode = useUnitCode()

  const [period, setPeriod] = useState<string>(ALL)
  const [status, setStatus] = useState<string>(ALL)

  const list = usePagedList<StudentRow>({
    queryKey: "students",
    endpoint: "/students",
    itemsKey: "students",
    enabled: Boolean(unitCode),
    params: { unit_code: unitCode ?? "" },
  })

  // A API de alunos não filtra por período nem por situação, então esses dois
  // filtros valem sobre a página carregada. O contador embaixo reflete isso.
  const rows = useMemo(() => {
    return list.rows.filter((row) => {
      if (period !== ALL && row.period !== period) return false
      if (status !== ALL && row.status !== status) return false
      return true
    })
  }, [list.rows, period, status])

  const filtering = period !== ALL || status !== ALL

  const columns: Column<StudentRow>[] = [
    {
      key: "student",
      header: "Aluno",
      cell: (row) => <PersonCell name={row.full_name} secondary={row.email} />,
    },
    {
      key: "rm",
      header: "RM",
      cell: (row) => <span className="identifier">{orDash(row.rm)}</span>,
    },
    {
      key: "period",
      header: "Período",
      hideBelow: "sm",
      cell: (row) => <span>{labelOf(PERIOD_LABELS, row.period)}</span>,
    },
    {
      key: "course",
      header: "Curso",
      hideBelow: "md",
      cell: (row) => <span className="text-muted-foreground">{orDash(row.course)}</span>,
    },
    {
      key: "class",
      header: "Turma",
      hideBelow: "lg",
      cell: (row) => <span className="text-muted-foreground">{orDash(row.class_name)}</span>,
    },
    {
      key: "status",
      header: "Situação",
      align: "right",
      cell: (row) => (
        <StatusBadge tone={STUDENT_STATUS_TONES[row.status] ?? "neutral"}>
          {labelOf(STUDENT_STATUS_LABELS, row.status)}
        </StatusBadge>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Alunos"
        description="Quem está matriculado na sua unidade."
        action={
          <Button asChild>
            <Link to="/students/create">
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              Cadastrar aluno
            </Link>
          </Button>
        }
      />

      <Toolbar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Buscar por nome, e-mail ou CPF"
      >
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[8.5rem]" aria-label="Filtrar por período">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todo período</SelectItem>
            {PERIODS.map((value) => (
              <SelectItem key={value} value={value}>
                {PERIOD_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[9.5rem]" aria-label="Filtrar por situação">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toda situação</SelectItem>
            {STUDENT_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {STUDENT_STATUS_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ClearFiltersButton
          show={filtering}
          onClear={() => {
            setPeriod(ALL)
            setStatus(ALL)
          }}
        />
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
          list.search || filtering ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"
        }
        emptyDescription={
          list.search || filtering
            ? "Ajusta a busca ou os filtros."
            : "Cadastre a pessoa primeiro e depois vincule o RM aqui."
        }
      />

      {/* Com filtro de página ligado, o rodapé conta o que sobrou na tela */}
      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={filtering ? rows.length : list.total}
        totalPages={filtering ? 1 : list.totalPages}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        noun="aluno"
        nounPlural="alunos"
        disabled={list.isFetching}
      />

      {filtering && (
        <p className="mt-2 text-[0.75rem] text-muted-foreground">
          Período e situação filtram os alunos desta página. Pra varrer todos, aumente as
          linhas por página ou use a busca, que roda no servidor.
        </p>
      )}
    </>
  )
}
