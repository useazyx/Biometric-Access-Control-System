/**
 * Breadcrumbs.tsx - O caminho de onde a pessoa está, no topo da tela
 * # Pra que serve?
 * - Mostrar em que tela a pessoa está e como voltar pra tela anterior
 * - Traduzir o pedaço da URL num nome que dá pra ler
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-08-14): Caminho montado direto a partir dos pedaços da URL
 * - v2.0.0 (2026-09-09): Os pedaços da URL passaram por um dicionário de nomes: antes
 *                        aparecia "Logs / Biometric" e "People / Create" na tela. Os
 *                        pedaços que não são rota de verdade (como /logs) deixaram de
 *                        virar link, porque levavam pra lugar nenhum.
 */

import { Link, useLocation } from "react-router-dom"
import { ChevronRight } from "lucide-react"

// Como cada pedaço de URL deve aparecer pra pessoa
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  people: "Pessoas",
  students: "Alunos",
  teachers: "Professores",
  employees: "Funcionários",
  visitors: "Visitantes",
  units: "Unidades",
  biometrics: "Biometrias",
  register: "Cadastrar",
  create: "Cadastrar",
  logs: "Histórico",
  web: "Logins no sistema",
  biometric: "Acessos biométricos",
  settings: "Configurações",
  profile: "Meu perfil",
  about: "Sobre",
  features: "Recursos",
  faq: "Perguntas frequentes",
}

// Pedaços que só existem pra agrupar a URL: não tem tela nesse endereço,
// então eles aparecem como texto, nunca como link quebrado.
const NON_NAVIGABLE = new Set(["logs"])

export function Breadcrumbs() {
  const location = useLocation()

  const segments = location.pathname.split("/").filter(Boolean)

  // Na raiz não tem caminho pra mostrar
  if (segments.length === 0) return null

  const crumbs = segments.map((segment, index) => ({
    segment,
    label: SEGMENT_LABELS[segment] ?? segment,
    path: `/${segments.slice(0, index + 1).join("/")}`,
    isLast: index === segments.length - 1,
  }))

  return (
    <nav aria-label="Caminho de navegação" className="flex min-w-0 items-center gap-1.5 text-sm">
      <Link to="/dashboard" className="shrink-0 text-muted-foreground transition-colors hover:text-foreground">
        Início
      </Link>

      {crumbs.map((crumb) => (
        <span key={crumb.path} className="flex min-w-0 items-center gap-1.5">
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />

          {crumb.isLast ? (
            // A tela atual não é link pra ela mesma
            <span aria-current="page" className="truncate font-medium text-foreground">
              {crumb.label}
            </span>
          ) : NON_NAVIGABLE.has(crumb.segment) ? (
            <span className="truncate text-muted-foreground">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className="truncate text-muted-foreground transition-colors hover:text-foreground"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
