/**
 * usePagedList.ts - O motor das listagens: paginação, busca e estado numa peça só
 * # Pra que serve?
 * - Falar com as rotas de listagem do jeito que ELAS esperam (page + page_size <= 100)
 * - Dar busca com atraso, pra não disparar uma requisição por tecla digitada
 * - Voltar pra página 1 sozinho quando o filtro muda, senão a lista abre vazia
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Primeira versão, junto com o painel novo
 *
 * Por que isto existe: o painel antigo pedia page_size=1000 em toda listagem e a API
 * recusa acima de 100, então TODA tela de lista quebrava. Aqui a paginação é de
 * verdade — o limite da API é respeitado e a navegação entre páginas é do servidor.
 */

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useState } from "react"
import { api } from "@/lib/api"

/** O teto que a API aceita em page_size. Passar disso é erro 400 na certa. */
export const MAX_PAGE_SIZE = 100

/** As opções de "linhas por página" oferecidas na barra inferior das tabelas. */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, MAX_PAGE_SIZE] as const

interface UsePagedListOptions<TRow> {
  /** Caminho da rota, sem barra no fim. Ex: "/students" */
  endpoint: string
  /** Nome do campo que traz o array na resposta. Ex: "students" */
  itemsKey: string
  /** Parâmetros fixos da tela (unit_code, type, filtros de data...). */
  params?: Record<string, string | number | boolean | undefined>
  /** Deixe false enquanto uma dependência ainda não chegou (ex: unit_code). */
  enabled?: boolean
  /** Chave estável pro cache. Costuma ser o nome do recurso. */
  queryKey: string
  /** Alguns endpoints só filtram do lado do cliente; passe a função aqui. */
  clientFilter?: (row: TRow, search: string) => boolean
  /**
   * Sob que nome a busca vai pra API. As listagens de pessoas usam "search"
   * (texto livre); as de log não têm busca textual e filtram por "cpf".
   */
  searchParam?: string
}

export interface PagedListResult<TRow> {
  rows: TRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  search: string
  isLoading: boolean
  /** true quando está buscando uma página nova mas ainda mostra a anterior. */
  isFetching: boolean
  isError: boolean
  error: unknown
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setSearch: (term: string) => void
  refetch: () => void
}

/** Espera a pessoa parar de digitar antes de deixar o valor "valer". */
function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

export function usePagedList<TRow>({
  endpoint,
  itemsKey,
  params,
  enabled = true,
  queryKey,
  clientFilter,
  searchParam = "search",
}: UsePagedListOptions<TRow>): PagedListResult<TRow> {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState("")

  const debouncedSearch = useDebounced(search)

  // Serializado pra virar chave de cache estável, sem depender da ordem das chaves
  const stableParams = useMemo(() => {
    const entries = Object.entries(params ?? {})
      .filter(([, value]) => value !== undefined && value !== "")
      .sort(([a], [b]) => a.localeCompare(b))

    return Object.fromEntries(entries)
  }, [params])

  // Assinatura textual dos filtros, pra comparar por valor e não por referência
  const paramsSignature = useMemo(() => JSON.stringify(stableParams), [stableParams])

  // Trocar de filtro com a pessoa na página 7 abriria uma lista vazia; volta pro começo.
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, pageSize, paramsSignature])

  const query = useQuery({
    queryKey: [queryKey, stableParams, page, pageSize, debouncedSearch, searchParam],
    enabled,
    // Mantém a página anterior na tela enquanto a nova carrega: sem isso a tabela
    // pisca e "pula" a cada clique em Próxima.
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get(endpoint, {
        params: {
          ...stableParams,
          page,
          page_size: pageSize,
          // A busca do lado do cliente não vai pra API
          ...(clientFilter || !debouncedSearch ? {} : { [searchParam]: debouncedSearch }),
        },
      })

      return data as Record<string, unknown>
    },
  })

  const data = query.data

  // Quando o endpoint não tem busca no servidor, filtra o que já veio.
  // A leitura do array fica DENTRO do useMemo: fora dele, o `?? []` criava um array
  // novo a cada render e o memo nunca valia de nada.
  const rows = useMemo(() => {
    const rawRows = (data?.[itemsKey] as TRow[] | undefined) ?? []

    if (!clientFilter || !debouncedSearch) return rawRows
    return rawRows.filter((row) => clientFilter(row, debouncedSearch.toLowerCase()))
  }, [data, itemsKey, clientFilter, debouncedSearch])

  // Os dois endpoints de log usam total_items em vez de total
  const total = Number(data?.total ?? data?.total_items ?? 0)
  const totalPages = Number(data?.total_pages ?? 0)

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(Math.min(size, MAX_PAGE_SIZE))
  }, [])

  return {
    rows,
    total: clientFilter && debouncedSearch ? rows.length : total,
    page,
    pageSize,
    totalPages: Math.max(totalPages, 1),
    search,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    setPage,
    setPageSize: handleSetPageSize,
    setSearch,
    refetch: query.refetch,
  }
}
