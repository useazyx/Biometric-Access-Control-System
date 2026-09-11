/**
 * Dashboard.tsx - A tela de abertura: o tamanho do cadastro e o movimento recente
 * # Pra que serve?
 * - Responder de bate-pronto quanta gente existe e quem passou pela catraca hoje
 * - Servir de atalho pras listagens, sem precisar caçar na navegação
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-08-15): Primeira versão do painel
 * - v2.0.0 (2026-09-10): Reescrito. Os cartões viraram atalho pras listagens e
 *                        entrou a distribuição por perfil, que era a pergunta que o
 *                        painel antigo não respondia.
 */

import { useQuery } from "@tanstack/react-query"
import {
  Building2,
  Fingerprint,
  GraduationCap,
  UserCog,
  Users,
  UserSquare2,
} from "lucide-react"
import { api } from "@/lib/api"
import { useUnitCode } from "@/contexts/AuthContext"
import { formatDateTime, formatNumber } from "@/lib/format"
import { EVENT_TYPE_LABELS, EVENT_TYPE_TONES, labelOf, PERSON_TYPE_LABELS } from "@/lib/labels"
import { PageHeader, Panel, PersonCell, StatTile, StatusBadge } from "@/components/data/Primitives"
import { Column, DataTable } from "@/components/data/DataTable"
import type {
  BiometricLogRow,
  DashboardStatistics,
  PeopleBreakdown,
  PersonType,
  UnitBreakdown,
} from "@/types/api"

export default function Dashboard() {
  const unitCode = useUnitCode()

  const statistics = useQuery({
    queryKey: ["dashboard", "statistics"],
    queryFn: async () => {
      const { data } = await api.get<{ statistics: DashboardStatistics }>("/dashboard/statistics")
      return data.statistics
    },
  })

  const people = useQuery({
    queryKey: ["dashboard", "people-breakdown"],
    queryFn: async () => {
      const { data } = await api.get<{ breakdown: PeopleBreakdown }>("/dashboard/people-breakdown")
      return data.breakdown
    },
  })

  const units = useQuery({
    queryKey: ["dashboard", "unit-breakdown"],
    queryFn: async () => {
      const { data } = await api.get<{ breakdown: UnitBreakdown }>("/dashboard/unit-breakdown")
      return data.breakdown
    },
  })

  // As últimas passagens pela catraca: é o dado "vivo" do sistema
  const recentAccess = useQuery({
    queryKey: ["dashboard", "recent-access"],
    queryFn: async () => {
      const { data } = await api.get<{ logs: BiometricLogRow[] }>("/biometric-access-logs", {
        params: { page: 1, page_size: 8 },
      })
      return data.logs ?? []
    },
  })

  const stats = statistics.data

  return (
    <>
      <PageHeader
        title="Painel"
        description={
          unitCode
            ? "Números do cadastro e as últimas passagens registradas."
            : "Sua conta não está vinculada a uma unidade, então algumas listagens ficam vazias."
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile
          label="Pessoas"
          value={stats?.totalPeople}
          icon={<Users className="h-4 w-4" aria-hidden />}
          to="/people"
        />
        <StatTile
          label="Alunos"
          value={stats?.totalStudents}
          icon={<GraduationCap className="h-4 w-4" aria-hidden />}
          to="/students"
        />
        <StatTile
          label="Funcionários"
          value={stats?.totalEmployees}
          icon={<UserCog className="h-4 w-4" aria-hidden />}
          to="/employees"
        />
        <StatTile
          label="Visitantes"
          value={stats?.totalVisitors}
          icon={<UserSquare2 className="h-4 w-4" aria-hidden />}
          to="/visitors"
        />
        <StatTile
          label="Unidades"
          value={stats?.totalUnits}
          icon={<Building2 className="h-4 w-4" aria-hidden />}
          to="/units"
          hint={
            units.data
              ? `${units.data.etec} Etec · ${units.data.fatec} Fatec`
              : undefined
          }
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_20rem]">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Últimas passagens pela catraca</h3>
          <DataTable<BiometricLogRow>
            rows={recentAccess.data ?? []}
            rowKey={(row) => row.id}
            isLoading={recentAccess.isLoading}
            isError={recentAccess.isError}
            error={recentAccess.error}
            onRetry={() => recentAccess.refetch()}
            emptyTitle="Nenhuma passagem registrada"
            emptyDescription="Assim que alguém encostar o dedo no sensor, a passagem aparece aqui."
            columns={RECENT_COLUMNS}
          />
        </div>

        <Panel title="Pessoas por perfil" description="Considerando todas as unidades.">
          {people.isLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-6 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : (
            <PeopleBreakdownList breakdown={people.data} />
          )}
        </Panel>
      </div>
    </>
  )
}

const RECENT_COLUMNS: Column<BiometricLogRow>[] = [
  {
    key: "person",
    header: "Pessoa",
    cell: (row) => <PersonCell name={row.person?.full_name} cpf={row.person?.cpf} />,
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
    key: "unit",
    header: "Unidade",
    hideBelow: "lg",
    cell: (row) => <span className="identifier">{row.unit?.unit_code ?? "—"}</span>,
  },
  {
    key: "time",
    header: "Quando",
    align: "right",
    cell: (row) => (
      <span className="numeric whitespace-nowrap text-muted-foreground">
        {formatDateTime(row.access_time)}
      </span>
    ),
  },
]

/** Barra proporcional por perfil: o número sozinho não mostra o peso relativo. */
function PeopleBreakdownList({ breakdown }: { breakdown?: PeopleBreakdown }) {
  if (!breakdown) {
    return <p className="text-[0.8125rem] text-muted-foreground">Não consegui carregar.</p>
  }

  const entries = Object.entries(breakdown) as [PersonType, number][]
  const total = entries.reduce((sum, [, value]) => sum + value, 0)

  if (!total) {
    return <p className="text-[0.8125rem] text-muted-foreground">Nenhuma pessoa cadastrada.</p>
  }

  return (
    <ul className="space-y-2.5">
      {entries
        .sort(([, a], [, b]) => b - a)
        .map(([type, value]) => {
          const percentage = Math.round((value / total) * 100)

          return (
            <li key={type}>
              <div className="flex items-baseline justify-between gap-2 text-[0.8125rem]">
                <span>{labelOf(PERSON_TYPE_LABELS, type)}</span>
                <span className="numeric text-muted-foreground">
                  {formatNumber(value)}
                  <span className="ml-1.5 text-[0.75rem]">{percentage}%</span>
                </span>
              </div>
              <div
                className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"
                role="presentation"
              >
                <div className="h-full rounded-full bg-primary" style={{ width: percentage + "%" }} />
              </div>
            </li>
          )
        })}
    </ul>
  )
}
