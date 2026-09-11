/**
 * AppSidebar.tsx - O menu lateral de navegação
 * # Pra que serve?
 * - Levar pra cada tela do sistema, agrupada por assunto
 * - Mostrar a marca e em qual unidade a pessoa está trabalhando
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-08-12): Menu com os grupos e links do sistema
 * - v2.0.0 (2026-09-09): Cada item ganhou um ícone que significa alguma coisa (antes o
 *                        FileText aparecia em quatro itens diferentes e o Users em três),
 *                        os links pra Contato e Blog saíram junto com as páginas, e
 *                        "Cadastrar Biometria" saiu do menu porque é ação da tela de
 *                        biometrias, não um lugar do sistema. O item ativo agora também
 *                        acerta nas sub-rotas, e não só no caminho exato.
 */

import {
  Building2,
  Fingerprint,
  GraduationCap,
  HelpCircle,
  Info,
  LayoutDashboard,
  ListChecks,
  Presentation,
  Settings,
  Sparkles,
  UserCircle,
  UserCog,
  Users,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"

// Um ícone distinto por item: ícone repetido não ajuda a encontrar nada
const MENU_GROUPS = [
  {
    title: "Principal",
    items: [{ title: "Dashboard", icon: LayoutDashboard, url: "/dashboard" }],
  },
  {
    title: "Cadastros",
    items: [
      { title: "Pessoas", icon: Users, url: "/people" },
      { title: "Alunos", icon: GraduationCap, url: "/students" },
      { title: "Professores", icon: Presentation, url: "/teachers" },
      { title: "Funcionários", icon: UserCog, url: "/employees" },
      { title: "Visitantes", icon: UserCircle, url: "/visitors" },
      { title: "Unidades", icon: Building2, url: "/units" },
    ],
  },
  {
    title: "Acesso",
    items: [
      { title: "Biometrias", icon: Fingerprint, url: "/biometrics" },
      { title: "Acessos biométricos", icon: ListChecks, url: "/logs/biometric" },
      { title: "Logins no sistema", icon: Sparkles, url: "/logs/web" },
    ],
  },
  {
    title: "Sobre o projeto",
    items: [
      { title: "Sobre", icon: Info, url: "/about" },
      { title: "Recursos", icon: Sparkles, url: "/features" },
      { title: "Perguntas frequentes", icon: HelpCircle, url: "/faq" },
    ],
  },
]

export function AppSidebar() {
  const location = useLocation()
  const { user } = useAuth()

  // O Dashboard só fica ativo no caminho exato; os outros também acendem nas
  // sub-rotas (ex: /people/create mantém "Pessoas" destacado)
  const isActive = (url: string) => {
    if (url === "/dashboard") return location.pathname === url
    return location.pathname === url || location.pathname.startsWith(`${url}/`)
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/15 ring-1 ring-sidebar-primary/30">
            <Fingerprint className="h-5 w-5 text-sidebar-primary" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold leading-tight">BioAccess</span>
            <span className="block truncate text-xs text-sidebar-foreground/65">
              {/* Mostra a unidade real de quem está logado, quando o perfil já carregou */}
              {user?.unit_code ? `Unidade ${user.unit_code}` : "Controle de acesso"}
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {MENU_GROUPS.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.url)

                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        {/* aria-current avisa o leitor de tela qual é a página atual */}
                        <Link to={item.url} aria-current={active ? "page" : undefined}>
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/profile")} tooltip="Meu perfil">
              <Link to="/profile">
                <UserCircle className="h-4 w-4" />
                <span className="truncate">{user?.full_name ?? "Meu perfil"}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/settings")} tooltip="Configurações">
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
