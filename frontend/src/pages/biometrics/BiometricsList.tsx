/**
 * BiometricsList.tsx - As digitais registradas na unidade
 * # Pra que serve?
 * - Ver de quem é cada digital e qual dedo foi registrado
 * - Remover uma digital específica quando ela precisa ser recadastrada
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-09-01): Primeira versão da listagem
 * - v2.0.0 (2026-09-10): Reescrita com paginação de servidor. A busca desta tela é
 *                        local: a rota de digitais não aceita o parâmetro de busca.
 */

import { useCallback, useState } from "react"
import { Link } from "react-router-dom"
import { Fingerprint, Plus, Trash2 } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, apiErrorMessage } from "@/lib/api"
import { useUnitCode } from "@/contexts/AuthContext"
import { usePagedList } from "@/hooks/usePagedList"
import { formatDateTime, orDash } from "@/lib/format"
import { FINGER_LABELS, labelOf } from "@/lib/labels"
import type { BiometricRow } from "@/types/api"
import { PageHeader, PersonCell, StatusBadge } from "@/components/data/Primitives"
import { Column, DataTable } from "@/components/data/DataTable"
import { Pagination } from "@/components/data/Pagination"
import { Toolbar } from "@/components/data/Toolbar"
import { Button } from "@/components/ui/button"
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

export default function BiometricsList() {
  const unitCode = useUnitCode()
  const queryClient = useQueryClient()

  const [pendingDelete, setPendingDelete] = useState<BiometricRow | null>(null)

  // A rota de digitais não tem busca no servidor, então filtra o que já veio.
  // Precisa ser estável entre renders, senão o hook refaz a consulta à toa.
  const clientFilter = useCallback((row: BiometricRow, term: string) => {
    const name = row.person?.full_name?.toLowerCase() ?? ""
    const cpf = row.person?.cpf?.toLowerCase() ?? ""
    return name.includes(term) || cpf.includes(term)
  }, [])

  const list = usePagedList<BiometricRow>({
    queryKey: "biometrics",
    endpoint: "/biometrics",
    itemsKey: "biometrics",
    enabled: Boolean(unitCode),
    params: { unit_code: unitCode ?? "" },
    clientFilter,
  })

  const remove = useMutation({
    mutationFn: async (row: BiometricRow) => {
      // A API apaga pela dupla pessoa + dedo, não pelo id da digital
      await api.delete("/biometrics", {
        data: { cpf: row.person?.cpf, finger: row.finger },
      })
    },
    onSuccess: (_, row) => {
      toast.success("Digital removida", {
        description: labelOf(FINGER_LABELS, row.finger) + " de " + (row.person?.full_name ?? "—"),
      })
      queryClient.invalidateQueries({ queryKey: ["biometrics"] })
      setPendingDelete(null)
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Não consegui remover essa digital."))
    },
  })

  const columns: Column<BiometricRow>[] = [
    {
      key: "person",
      header: "Pessoa",
      cell: (row) => <PersonCell name={row.person?.full_name} cpf={row.person?.cpf} />,
    },
    {
      key: "finger",
      header: "Dedo",
      cell: (row) => (
        <span className="flex items-center gap-1.5">
          <Fingerprint className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          {labelOf(FINGER_LABELS, row.finger)}
        </span>
      ),
    },
    {
      key: "device",
      header: "Sensor",
      hideBelow: "sm",
      cell: (row) => <StatusBadge tone="neutral">{orDash(row.device)}</StatusBadge>,
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
      key: "registered",
      header: "Registrada em",
      align: "right",
      hideBelow: "md",
      cell: (row) => (
        <span className="numeric whitespace-nowrap text-muted-foreground">
          {formatDateTime(row.registration_date)}
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
          aria-label="Remover esta digital"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Digitais"
        description="As biometrias registradas na sua unidade. Cada pessoa pode ter até dez, uma por dedo."
        action={
          <Button asChild>
            <Link to="/biometrics/register">
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              Registrar digital
            </Link>
          </Button>
        }
      />

      <Toolbar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Filtrar esta página por nome ou CPF"
      />

      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(row) => row.id}
        isLoading={list.isLoading}
        isFetching={list.isFetching}
        isError={list.isError}
        error={list.error}
        onRetry={list.refetch}
        emptyTitle={list.search ? "Nenhuma digital encontrada" : "Nenhuma digital registrada"}
        emptyDescription={
          list.search
            ? "A busca desta tela olha só a página atual."
            : "Registre a primeira digital pra catraca começar a reconhecer as pessoas."
        }
      />

      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        totalPages={list.search ? 1 : list.totalPages}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        noun="digital"
        nounPlural="digitais"
        disabled={list.isFetching}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover esta digital?</AlertDialogTitle>
            <AlertDialogDescription>
              {labelOf(FINGER_LABELS, pendingDelete?.finger)} de{" "}
              {pendingDelete?.person?.full_name ?? "—"}. A pessoa continua cadastrada, mas
              perde o acesso por esse dedo até registrar de novo.
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
