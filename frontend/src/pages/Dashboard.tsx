/**
 * Dashboard.tsx - A tela inicial com os números da unidade
 * # Pra que serve?
 * - Mostrar os totais do sistema (pessoas, alunos, funcionários, unidades, visitantes)
 * - Comparar a distribuição de pessoas por perfil e de unidades por tipo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-08-18): Cartões de total e dois gráficos de barra
 * - v2.0.0 (2026-09-09): Os gráficos estavam ilegíveis: as seis barras usavam tokens de
 *                        superfície (--accent, --secondary, --muted), que são quase o mesmo
 *                        cinza claro, e duas categorias repetiam a mesma cor. Além disso as
 *                        seis barras ficavam num único grupo com o eixo X escondido, sem
 *                        nome nenhum. Agora é barra horizontal, uma cor só (o comprimento
 *                        já mostra a magnitude), ordenada da maior pra menor e com o nome
 *                        e o valor de cada categoria escritos. O total de visitantes, que
 *                        a API já mandava e ninguém mostrava, também entrou.
 */

import { useCallback, useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts"
import {
  Briefcase,
  Building2,
  GraduationCap,
  RefreshCw,
  UserPlus,
  Users,
} from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { StatCard } from "@/components/dashboard/StatCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"

// De quanto em quanto tempo a tela busca os números de novo
const REFRESH_INTERVAL_MS = 30_000

// Nome que a pessoa lê pra cada tipo do banco
const PERSON_TYPE_LABELS: Record<string, string> = {
  student: "Alunos",
  teacher: "Professores",
  employee: "Funcionários",
  coordinator: "Coordenadores",
  inspector: "Inspetores",
  visitor: "Visitantes",
}

const UNIT_TYPE_LABELS: Record<string, string> = {
  etec: "Etec",
  fatec: "Fatec",
  etec_extension: "Etec (extensão)",
  fatec_extension: "Fatec (extensão)",
}

interface Statistics {
  totalPeople: number
  totalStudents: number
  totalEmployees: number
  totalUnits: number
  totalVisitors?: number
}

// Uma barra do gráfico: o nome que aparece e quanto ela vale
interface ChartRow {
  label: string
  value: number
}

const EMPTY_STATS: Statistics = {
  totalPeople: 0,
  totalStudents: 0,
  totalEmployees: 0,
  totalUnits: 0,
  totalVisitors: 0,
}

export default function Dashboard() {
  const [stats, setStats] = useState<Statistics>(EMPTY_STATS)
  const [peopleRows, setPeopleRows] = useState<ChartRow[]>([])
  const [unitRows, setUnitRows] = useState<ChartRow[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const { user } = useAuth()

  // Transforma o objeto que a API manda ({student: 3, teacher: 1}) na lista de
  // barras, já ordenada da maior pra menor: comparação fica muito mais fácil.
  const toSortedRows = (breakdown: Record<string, number>, labels: Record<string, string>): ChartRow[] =>
    Object.entries(breakdown)
      .map(([key, value]) => ({ label: labels[key] ?? key, value: Number(value) || 0 }))
      .sort((a, b) => b.value - a.value)

  const loadDashboard = useCallback(async () => {
    try {
      // As três chamadas são independentes, então vão juntas
      const [statisticsRes, peopleRes, unitRes] = await Promise.all([
        api.get("/dashboard/statistics"),
        api.get("/dashboard/people-breakdown"),
        api.get("/dashboard/unit-breakdown"),
      ])

      setStats({ ...EMPTY_STATS, ...(statisticsRes.data?.statistics ?? {}) })
      setPeopleRows(toSortedRows(peopleRes.data?.breakdown ?? {}, PERSON_TYPE_LABELS))
      setUnitRows(toSortedRows(unitRes.data?.breakdown ?? {}, UNIT_TYPE_LABELS))
      setLastUpdate(new Date())
    } catch (error) {
      // O interceptor do axios já mostrou o toast; aqui só registra pra debug
      console.error("Não deu pra carregar o dashboard:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()

    // Atualiza sozinho enquanto a tela estiver aberta
    const timer = setInterval(loadDashboard, REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [loadDashboard])

  return (
    <div className="space-y-6">
      {/* ---------------- Cabeçalho da página ---------------- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="heading-xl">Dashboard</h1>
          <p className="section-description">
            Visão geral
            {user?.unit_name ? (
              <>
                {" da unidade "}
                <span className="font-medium text-foreground">{user.unit_name}</span>
              </>
            ) : (
              " do sistema de controle de acesso"
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Atualizado às{" "}
              {lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={loadDashboard} disabled={loading}>
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* ---------------- Os totais ----------------
       * Número único não vira gráfico de uma barra: vira cartão.
       * Cada um leva pra tela onde a pessoa consegue mexer naquilo.
       */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Pessoas"
          value={stats.totalPeople}
          icon={Users}
          loading={loading}
          hint="Todos os perfis"
          to="/people"
        />
        <StatCard title="Alunos" value={stats.totalStudents} icon={GraduationCap} loading={loading} to="/students" />
        <StatCard
          title="Funcionários"
          value={stats.totalEmployees}
          icon={Briefcase}
          loading={loading}
          to="/employees"
        />
        <StatCard title="Visitantes" value={stats.totalVisitors ?? 0} icon={UserPlus} loading={loading} to="/visitors" />
        <StatCard title="Unidades" value={stats.totalUnits} icon={Building2} loading={loading} to="/units" />
      </div>

      {/* ---------------- Os dois gráficos ---------------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownChart
          title="Pessoas por perfil"
          description="Quantas pessoas de cada tipo estão cadastradas"
          rows={peopleRows}
          loading={loading}
        />
        <BreakdownChart
          title="Unidades por tipo"
          description="Distribuição entre Etecs, Fatecs e suas extensões"
          rows={unitRows}
          loading={loading}
        />
      </div>
    </div>
  )
}

/**
 * Gráfico de barras horizontais para comparar categorias.
 *
 * Escolhas de leitura:
 * - Barra HORIZONTAL porque os nomes são longos ("Coordenadores", "Fatec (extensão)")
 *   e na vertical eles ficariam inclinados ou cortados.
 * - UMA cor só: o que a pessoa compara aqui é tamanho, não identidade. Pintar cada
 *   barra de uma cor sugere que a cor significa algo, e não significa.
 * - Valor escrito na ponta de cada barra, então não precisa de eixo numérico nem
 *   de ficar medindo a barra contra a linha de grade.
 */
function BreakdownChart({
  title,
  description,
  rows,
  loading,
}: {
  title: string
  description: string
  rows: ChartRow[]
  loading: boolean
}) {
  // Nada cadastrado ainda: lista vazia não é erro, então diz isso com palavras
  const isEmpty = !loading && rows.every((row) => row.value === 0)

  // Espaço extra à direita pro número da ponta não encostar na borda
  const maxValue = Math.max(...rows.map((row) => row.value), 1)

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-7 w-full" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="empty-state">
            <p className="text-sm font-medium">Nada cadastrado ainda</p>
            <p className="text-xs text-muted-foreground">
              Assim que os cadastros começarem, os números aparecem aqui.
            </p>
          </div>
        ) : (
          <ChartContainer
            config={{ value: { label: "Quantidade", color: "hsl(var(--primary))" } }}
            className="h-[260px] w-full"
          >
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
              barCategoryGap="28%"
            >
              {/* Grade só na horizontal do valor, discreta: serve de apoio, não de assunto */}
              <CartesianGrid horizontal={false} strokeDasharray="0" className="stroke-border/60" />

              <XAxis type="number" domain={[0, maxValue]} hide />
              <YAxis
                type="category"
                dataKey="label"
                width={116}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />

              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel={false} />} />

              {/* maxBarSize limita a espessura: barra gorda demais come o ar entre as linhas */}
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22} fill="hsl(var(--primary))">
                {/* Categoria sem ninguém fica bem apagada, pra não competir com quem tem gente */}
                {rows.map((row) => (
                  <Cell key={row.label} opacity={row.value === 0 ? 0.25 : 1} />
                ))}

                <LabelList
                  dataKey="value"
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  style={{ fontSize: 12, fontWeight: 500 }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
