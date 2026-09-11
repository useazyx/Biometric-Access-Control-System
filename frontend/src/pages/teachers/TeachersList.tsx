/**
 * TeachersList.tsx - Os professores da unidade e o que cada um pode lecionar
 * # Pra que serve?
 * - Ver de relance as matérias de cada professor
 * - Saber quem pode dar aula em Etec, em Fatec, ou nas duas
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-08-22): Primeira versão da listagem
 * - v2.0.0 (2026-09-10): Reescrita com paginação e busca do servidor
 */

import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { useUnitCode } from "@/contexts/AuthContext"
import { usePagedList } from "@/hooks/usePagedList"
import type { TeacherRow } from "@/types/api"
import { PageHeader, PersonCell, StatusBadge } from "@/components/data/Primitives"
import { Column, DataTable } from "@/components/data/DataTable"
import { Pagination } from "@/components/data/Pagination"
import { Toolbar } from "@/components/data/Toolbar"
import { Button } from "@/components/ui/button"

export default function TeachersList() {
  const unitCode = useUnitCode()

  const list = usePagedList<TeacherRow>({
    queryKey: "teachers",
    endpoint: "/teachers",
    itemsKey: "teachers",
    enabled: Boolean(unitCode),
    params: { unit_code: unitCode ?? "" },
  })

  const columns: Column<TeacherRow>[] = [
    {
      key: "teacher",
      header: "Professor",
      cell: (row) => <PersonCell name={row.full_name} secondary={"Matrícula #" + row.employee_id} />,
    },
    {
      key: "subjects",
      header: "Matérias",
      cell: (row) => <SubjectList subjects={row.subjects} />,
    },
    {
      key: "teaches",
      header: "Pode lecionar em",
      align: "right",
      cell: (row) => <TeachesIn etec={row.can_teach_etec} fatec={row.can_teach_fatec} />,
    },
  ]

  return (
    <>
      <PageHeader
        title="Professores"
        description="O corpo docente da sua unidade e as matérias de cada um."
        action={
          <Button asChild>
            <Link to="/teachers/create">
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              Cadastrar professor
            </Link>
          </Button>
        }
      />

      <Toolbar search={list.search} onSearchChange={list.setSearch} />

      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(row) => row.id}
        isLoading={list.isLoading}
        isFetching={list.isFetching}
        isError={list.isError}
        error={list.error}
        onRetry={list.refetch}
        emptyTitle={list.search ? "Nenhum professor encontrado" : "Nenhum professor cadastrado"}
        emptyDescription={
          list.search
            ? "Tenta outro nome, e-mail ou CPF."
            : "Professor é um funcionário com matérias: cadastre o funcionário antes."
        }
      />

      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        noun="professor"
        nounPlural="professores"
        disabled={list.isFetching}
      />
    </>
  )
}

/** Mostra até três matérias e resume o resto, senão a coluna estoura a largura. */
function SubjectList({ subjects }: { subjects: string[] }) {
  if (!subjects?.length) {
    return <span className="text-muted-foreground">—</span>
  }

  const visible = subjects.slice(0, 3)
  const hidden = subjects.length - visible.length

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((subject) => (
        <StatusBadge key={subject} tone="neutral">
          {subject}
        </StatusBadge>
      ))}
      {hidden > 0 && (
        <span className="text-[0.75rem] text-muted-foreground" title={subjects.join(", ")}>
          +{hidden}
        </span>
      )}
    </div>
  )
}

function TeachesIn({ etec, fatec }: { etec: boolean; fatec: boolean }) {
  if (!etec && !fatec) {
    return <span className="text-[0.8125rem] text-muted-foreground">Não definido</span>
  }

  return (
    <div className="flex justify-end gap-1">
      {etec && <StatusBadge tone="primary">Etec</StatusBadge>}
      {fatec && <StatusBadge tone="primary">Fatec</StatusBadge>}
    </div>
  )
}
