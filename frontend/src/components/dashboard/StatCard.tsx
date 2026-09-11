/**
 * StatCard.tsx - O cartão de número do dashboard
 * # Pra que serve?
 * - Mostrar um total do sistema (pessoas, alunos, unidades...) de forma legível
 * - Mostrar um esqueleto no lugar do número enquanto os dados não chegaram
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-08-18): Cartão com título, ícone e valor
 * - v2.0.0 (2026-09-09): O brilho de hover usava um indigo chumbado, que não combinava com
 *                        o tema; agora sai do token da marca. O "..." de carregamento virou
 *                        esqueleto, que não pula de tamanho quando o número entra. Ganhou
 *                        legenda opcional e virou link quando faz sentido navegar.
 */

import { Link } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  loading?: boolean
  /** Linha pequena embaixo do número, pra explicar o que ele conta */
  hint?: string
  /** Se vier, o cartão inteiro leva pra essa tela */
  to?: string
}

export function StatCard({ title, value, icon: Icon, loading, hint, to }: StatCardProps) {
  const content = (
    <Card className="relative h-full overflow-hidden shadow-card tilt-hover">
      {/* Brilho suave no hover, na cor da marca (antes era um indigo fixo) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(140px_80px_at_85%_15%,hsl(var(--primary)/0.1),transparent)] opacity-0 transition-opacity duration-200 hover:opacity-100"
      />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </CardHeader>

      <CardContent className="space-y-1">
        {loading ? (
          // Esqueleto do tamanho do número, pra o cartão não mudar de altura depois
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-3xl font-semibold tabular-nums tracking-tight">
            {value.toLocaleString("pt-BR")}
          </p>
        )}

        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )

  // Cartão clicável só quando existe uma tela pra abrir
  if (!to) return content

  return (
    <Link to={to} className="block rounded-lg focus-visible:ring-2 focus-visible:ring-ring">
      {content}
    </Link>
  )
}
