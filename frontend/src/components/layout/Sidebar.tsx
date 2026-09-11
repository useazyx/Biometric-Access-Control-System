/**
 * Sidebar.tsx - A navegação principal do painel
 * # Pra que serve?
 * - Agrupar as telas por assunto, pra achar sem precisar decorar onde fica
 * - Recolher pra faixa de ícones, devolvendo largura pra tabela quando precisa
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Primeira versão, junto com o painel novo
 */

import { NavLink } from "react-router-dom"
import {
  Building2,
  Fingerprint,
  GraduationCap,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  UserCog,
  Users,
  UserSquare2,
  Presentation,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface NavItem {
  to: string
  label: string
  icon: typeof Users
}

interface NavGroup {
  title: string
  items: NavItem[]
}

/** A navegação inteira mora aqui: uma lista de dados, não uma árvore de JSX. */
const NAV_GROUPS: NavGroup[] = [
  {
    title: "Visão geral",
    items: [{ to: "/dashboard", label: "Painel", icon: LayoutDashboard }],
  },
  {
    title: "Cadastro",
    items: [
      { to: "/people", label: "Pessoas", icon: Users },
      { to: "/students", label: "Alunos", icon: GraduationCap },
      { to: "/teachers", label: "Professores", icon: Presentation },
      { to: "/employees", label: "Funcionários", icon: UserCog },
      { to: "/visitors", label: "Visitantes", icon: UserSquare2 },
    ],
  },
  {
    title: "Biometria",
    items: [{ to: "/biometrics", label: "Digitais", icon: Fingerprint }],
  },
  {
    title: "Registros",
    items: [
      { to: "/logs/biometric", label: "Acessos da catraca", icon: ShieldCheck },
      { to: "/logs/web", label: "Acessos ao sistema", icon: ScrollText },
    ],
  },
  {
    title: "Administração",
    items: [{ to: "/units", label: "Unidades", icon: Building2 }],
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  /** No celular a lateral vira gaveta: fechar ao navegar evita cobrir o conteúdo. */
  onNavigate?: () => void
}

export function Sidebar({ collapsed, onToggle, onNavigate }: SidebarProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-[3.75rem]" : "w-60",
      )}
    >
      <BrandHeader collapsed={collapsed} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-4 last:mb-0">
            {/* Recolhida, a lateral vira faixa de ícones: o rótulo do grupo viraria
                ruído ilegível, então some e a separação fica por conta do espaço. */}
            {collapsed ? (
              <div className="mx-2 mb-2 h-px bg-sidebar-border" />
            ) : (
              <p className="mb-1 px-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
                {group.title}
              </p>
            )}

            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <SidebarLink item={item} collapsed={collapsed} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "m-2 flex h-8 items-center gap-2 rounded-md px-2 text-[0.8125rem]",
          "text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          collapsed && "justify-center",
        )}
        aria-label={collapsed ? "Expandir a navegação" : "Recolher a navegação"}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <>
            <PanelLeftClose className="h-4 w-4 shrink-0" aria-hidden />
            <span>Recolher</span>
          </>
        )}
      </button>
    </nav>
  )
}

function BrandHeader({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <Fingerprint className="h-[1.125rem] w-[1.125rem]" aria-hidden />
      </span>

      {!collapsed && (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold text-white">BioAccess</span>
          <span className="truncate text-[0.6875rem] text-sidebar-foreground/55">
            Controle de acesso
          </span>
        </span>
      )}
    </div>
  )
}

function SidebarLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon

  const link = (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex h-9 items-center gap-2.5 rounded-md px-2 text-[0.8125rem] transition-colors",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Marca a tela atual com um traço na borda: some junto com o texto quando
              recolhida, então o ícone ativo também muda de cor. */}
          <Icon
            className={cn("h-[1.0625rem] w-[1.0625rem] shrink-0", isActive && "text-sidebar-primary")}
            aria-hidden
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  )

  // Recolhida, o nome da tela só existe no tooltip
  if (!collapsed) return link

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}
