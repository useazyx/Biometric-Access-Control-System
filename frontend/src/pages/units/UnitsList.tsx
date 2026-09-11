/**
 * UnitsList.tsx - As Etecs e Fatecs cadastradas no sistema
 * # Pra que serve?
 * - Administrar as unidades e distinguir sede de extensão
 * - Deixar claro por que uma unidade com gente dentro não pode ser apagada
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-08-28): Primeira versão da listagem
 * - v2.0.0 (2026-09-10): Reescrita. Esta rota NÃO pagina (devolve tudo de uma vez),
 *                        então aqui a busca e o filtro são do lado do cliente mesmo.
 */

import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Trash2 } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, apiErrorMessage } from "@/lib/api"
import { useUnitCode } from "@/contexts/AuthContext"
import { orDash } from "@/lib/format"
import { UNIT_TYPES, type Unit } from "@/types/api"
import { PageHeader, StatusBadge } from "@/components/data/Primitives"
import { Column, DataTable } from "@/components/data/DataTable"
import { ClearFiltersButton, Toolbar } from "@/components/data/Toolbar"
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

const ALL = "all"

export default function UnitsList() {
  const queryClient = useQueryClient()
  const myUnitCode = useUnitCode()

  const [search, setSearch] = useState("")
  const [type, setType] = useState<string>(ALL)
  const [pendingDelete, setPendingDelete] = useState<Unit | null>(null)

  const units = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data } = await api.get<{ units: Unit[] }>("/units")
      return data.units ?? []
    },
  })

  const remove = useMutation({
    mutationFn: async (unit: Unit) => {
      await api.delete("/units/" + unit.id)
    },
    onSuccess: (_, unit) => {
      toast.success("Unidade removida", { description: unit.name })
      queryClient.invalidateQueries({ queryKey: ["units"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setPendingDelete(null)
    },
    onError: (error) => {
      // O caso comum é a unidade ainda ter pessoas: a API explica isso na mensagem
      toast.error(apiErrorMessage(error, "Não consegui remover essa unidade."))
    },
  })

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()

    return (units.data ?? []).filter((unit) => {
      if (type !== ALL && unit.unit_type !== type) return false
      if (!term) return true

      return (
        unit.name.toLowerCase().includes(term) ||
        unit.unit_code.toLowerCase().includes(term) ||
        (unit.address ?? "").toLowerCase().includes(term)
      )
    })
  }, [units.data, search, type])

  const columns: Column<Unit>[] = [
    {
      key: "name",
      header: "Unidade",
      cell: (unit) => (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-medium">
            {unit.name}
            {/* A unidade da própria pessoa é a que manda no que ela vê nas listagens */}
            {unit.unit_code === myUnitCode && (
              <span className="ml-2 align-middle text-[0.6875rem] font-normal text-primary">
                sua unidade
              </span>
            )}
          </span>
          <span className="identifier truncate text-muted-foreground">{unit.unit_code}</span>
        </span>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      cell: (unit) => <StatusBadge tone="primary">{unit.unit_type}</StatusBadge>,
    },
    {
      key: "extension",
      header: "Vínculo",
      hideBelow: "sm",
      cell: (unit) => (
        <StatusBadge tone="neutral">{unit.is_extension ? "Extensão" : "Sede"}</StatusBadge>
      ),
    },
    {
      key: "address",
      header: "Endereço",
      hideBelow: "lg",
      cell: (unit) => (
        <span className="block max-w-[22rem] truncate text-muted-foreground" title={unit.address ?? undefined}>
          {orDash(unit.address)}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Telefone",
      hideBelow: "xl",
      cell: (unit) => <span className="identifier text-muted-foreground">{orDash(unit.phone)}</span>,
    },
    {
      key: "actions",
      header: <span className="sr-only">Ações</span>,
      align: "right",
      width: "3.5rem",
      cell: (unit) => (
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => setPendingDelete(unit)}
          aria-label={"Remover " + unit.name}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      ),
    },
  ]

  const filtering = type !== ALL

  return (
    <>
      <PageHeader
        title="Unidades"
        description="As Etecs e Fatecs atendidas pelo sistema."
        action={
          <Button asChild>
            <Link to="/units/create">
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              Cadastrar unidade
            </Link>
          </Button>
        }
      />

      <Toolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome, código ou endereço"
      >
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[9rem]" aria-label="Filtrar por tipo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Etec e Fatec</SelectItem>
            {UNIT_TYPES.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ClearFiltersButton show={filtering} onClear={() => setType(ALL)} />
      </Toolbar>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(unit) => unit.id}
        isLoading={units.isLoading}
        isFetching={units.isFetching}
        isError={units.isError}
        error={units.error}
        onRetry={() => units.refetch()}
        emptyTitle={search || filtering ? "Nenhuma unidade encontrada" : "Nenhuma unidade cadastrada"}
        emptyDescription={
          search || filtering
            ? "Ajusta a busca ou o filtro."
            : "Cadastre a primeira unidade pra poder cadastrar pessoas nela."
        }
      />

      <p className="mt-3 px-1 text-[0.8125rem] text-muted-foreground">
        {rows.length} de {units.data?.length ?? 0} unidades
      </p>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              O sistema não deixa apagar unidade que ainda tem gente cadastrada, pra não
              deixar pessoas e digitais órfãs. Se houver alguém nela, remova ou transfira
              essas pessoas primeiro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
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
