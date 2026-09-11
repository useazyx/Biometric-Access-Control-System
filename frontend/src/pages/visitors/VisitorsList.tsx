/**
 * VisitorsList.tsx - Quem visitou a unidade, a que veio e por quem foi recebido
 * # Pra que serve?
 * - Saber quem está autorizado a entrar como visitante e até quando
 * - Deixar claro quem é o funcionário responsável por aquela visita
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-08-25): Primeira versão da listagem
 * - v2.0.0 (2026-09-10): Reescrita com paginação e busca do servidor. Entrou o aviso
 *                        de autorização vencida, que antes não aparecia em lugar nenhum.
 */

import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { useUnitCode } from "@/contexts/AuthContext"
import { usePagedList } from "@/hooks/usePagedList"
import { formatDate, orDash } from "@/lib/format"
import type { VisitorRow } from "@/types/api"
import { PageHeader, PersonCell, StatusBadge } from "@/components/data/Primitives"
import { Column, DataTable } from "@/components/data/DataTable"
import { Pagination } from "@/components/data/Pagination"
import { Toolbar } from "@/components/data/Toolbar"
import { Button } from "@/components/ui/button"

export default function VisitorsList() {
  const unitCode = useUnitCode()

  const list = usePagedList<VisitorRow>({
    queryKey: "visitors",
    endpoint: "/visitors",
    itemsKey: "visitors",
    enabled: Boolean(unitCode),
    params: { unit_code: unitCode ?? "" },
  })

  const columns: Column<VisitorRow>[] = [
    {
      key: "visitor",
      header: "Visitante",
      cell: (row) => <PersonCell name={row.person?.full_name} cpf={row.person?.cpf} />,
    },
    {
      key: "company",
      header: "Empresa",
      hideBelow: "sm",
      cell: (row) => <span>{orDash(row.company)}</span>,
    },
    {
      key: "reason",
      header: "Motivo",
      hideBelow: "md",
      cell: (row) => (
        <span className="block max-w-[18rem] truncate text-muted-foreground" title={row.visit_reason ?? undefined}>
          {orDash(row.visit_reason)}
        </span>
      ),
    },
    {
      key: "responsible",
      header: "Responsável",
      hideBelow: "xl",
      cell: (row) => (
        <span className="text-muted-foreground">
          {orDash(row.responsible_employee?.person?.full_name)}
        </span>
      ),
    },
    {
      key: "registered",
      header: "Cadastro",
      hideBelow: "lg",
      cell: (row) => <span className="numeric text-muted-foreground">{formatDate(row.registration_date)}</span>,
    },
    {
      key: "expiry",
      header: "Validade",
      align: "right",
      cell: (row) => <ExpiryCell expiry={row.visit_expiry_date} />,
    },
  ]

  return (
    <>
      <PageHeader
        title="Visitantes"
        description="Quem tem autorização de visita na sua unidade."
        action={
          <Button asChild>
            <Link to="/visitors/create">
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              Cadastrar visitante
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
        emptyTitle={list.search ? "Nenhum visitante encontrado" : "Nenhum visitante cadastrado"}
        emptyDescription={
          list.search
            ? "Tenta outro nome, e-mail ou CPF."
            : "Cadastre a pessoa como visitante e indique o funcionário responsável."
        }
      />

      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        noun="visitante"
        nounPlural="visitantes"
        disabled={list.isFetching}
      />
    </>
  )
}

/**
 * Autorização sem data de fim não vence; com data no passado, venceu.
 * A diferença importa na portaria, então ela aparece como estado, não como data solta.
 */
function ExpiryCell({ expiry }: { expiry: string | null }) {
  if (!expiry) {
    return <StatusBadge tone="neutral">Sem prazo</StatusBadge>
  }

  const expiryDate = new Date(expiry)
  const expired = !Number.isNaN(expiryDate.getTime()) && expiryDate < new Date()

  return (
    <StatusBadge tone={expired ? "denied" : "authorized"}>
      {expired ? "Vencida em " : "Até "}
      {formatDate(expiry)}
    </StatusBadge>
  )
}
