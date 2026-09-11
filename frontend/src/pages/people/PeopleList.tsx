/**
 * PeopleList.tsx - O cadastro central: toda pessoa da unidade, de qualquer perfil
 * # Pra que serve?
 * - Encontrar uma pessoa por nome, e-mail ou CPF sem saber o perfil dela
 * - Servir de porta pro cadastro em duas etapas (primeiro a pessoa, depois o perfil)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-08-18): Primeira versão da listagem
 * - v2.0.0 (2026-09-10): Reescrita. A versão antiga pedia page_size=1000, que a API
 *                        recusa, então a tela nunca carregava: agora a paginação é
 *                        do servidor e a busca também.
 */

import { useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Trash2 } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, apiErrorMessage } from "@/lib/api"
import { useUnitCode } from "@/contexts/AuthContext"
import { usePagedList } from "@/hooks/usePagedList"
import { formatCpf, orDash } from "@/lib/format"
import { labelOf, PERSON_TYPE_LABELS } from "@/lib/labels"
import { PERSON_TYPES, type PersonSummary, type PersonType } from "@/types/api"
import { PageHeader, PersonCell, StatusBadge } from "@/components/data/Primitives"
import { Column, DataTable } from "@/components/data/DataTable"
import { Pagination } from "@/components/data/Pagination"
import { Toolbar } from "@/components/data/Toolbar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

/** Valor do filtro "todos", já que o Select do Radix não aceita item de valor vazio. */
const ALL = "all"

export default function PeopleList() {
  const unitCode = useUnitCode()
  const queryClient = useQueryClient()

  const [type, setType] = useState<string>(ALL)
  const [pendingDelete, setPendingDelete] = useState<PersonSummary | null>(null)

  const list = usePagedList<PersonSummary>({
    queryKey: "people",
    endpoint: "/people",
    itemsKey: "people",
    enabled: Boolean(unitCode),
    params: {
      unit_code: unitCode ?? "",
      type: type === ALL ? undefined : type,
    },
  })

  const remove = useMutation({
    mutationFn: async (person: PersonSummary) => {
      await api.delete("/people", { data: { cpf: person.cpf } })
    },
    onSuccess: (_, person) => {
      toast.success("Pessoa removida", { description: person.full_name })
      // A remoção mexe em várias listas (aluno some da de alunos também)
      queryClient.invalidateQueries()
      setPendingDelete(null)
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Não consegui remover essa pessoa."))
    },
  })

  const columns: Column<PersonSummary>[] = [
    {
      key: "person",
      header: "Pessoa",
      cell: (row) => <PersonCell name={row.full_name} cpf={row.cpf} />,
    },
    {
      key: "type",
      header: "Perfil",
      cell: (row) => (
        <StatusBadge tone="neutral">{labelOf(PERSON_TYPE_LABELS, row.type)}</StatusBadge>
      ),
    },
    {
      key: "email",
      header: "E-mail",
      hideBelow: "md",
      cell: (row) => <span className="text-muted-foreground">{orDash(row.email)}</span>,
    },
    {
      key: "cpf",
      header: "CPF",
      hideBelow: "lg",
      cell: (row) => <span className="identifier">{formatCpf(row.cpf)}</span>,
    },
    {
      key: "unit",
      header: "Unidade",
      hideBelow: "xl",
      cell: (row) => (
        <span className="identifier text-muted-foreground">
          {row.registration_unit?.unit_code ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Ações</span>,
      align: "right",
      width: "3.5rem",
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => setPendingDelete(row)}
          aria-label={"Remover " + row.full_name}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Pessoas"
        description="Todo mundo cadastrado na sua unidade, de qualquer perfil."
        action={
          <Button asChild>
            <Link to="/people/create">
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              Cadastrar pessoa
            </Link>
          </Button>
        }
      />

      <Toolbar search={list.search} onSearchChange={list.setSearch}>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[10.5rem]" aria-label="Filtrar por perfil">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os perfis</SelectItem>
            {PERSON_TYPES.map((personType) => (
              <SelectItem key={personType} value={personType}>
                {PERSON_TYPE_LABELS[personType as PersonType]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        emptyTitle={list.search ? "Nenhuma pessoa encontrada" : "Nenhuma pessoa cadastrada"}
        emptyDescription={
          list.search
            ? "Tenta outro nome, e-mail ou CPF."
            : "Comece cadastrando a primeira pessoa da unidade."
        }
      />

      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        noun="pessoa"
        nounPlural="pessoas"
        disabled={list.isFetching}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {pendingDelete?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso apaga também o perfil dela (aluno, funcionário, visitante) e as digitais
              registradas. Não dá pra desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                // Sem isso o diálogo fecha antes da requisição terminar
                event.preventDefault()
                if (pendingDelete) remove.mutate(pendingDelete)
              }}
              disabled={remove.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {remove.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
