/**
 * Header.tsx - A barra do topo, dentro da área logada
 * # Pra que serve?
 * - Abrir e fechar o menu lateral e mostrar onde a pessoa está (breadcrumbs)
 * - Dar acesso ao tema, à paleta, ao perfil e ao "Sair"
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-08-12): Barra com breadcrumbs, tema, notificações e menu do usuário
 * - v2.0.0 (2026-09-09): O sino de notificações saiu: a lista dele era um array vazio
 *                        fixo no código, então dizia "Nenhuma notificação" pra sempre e
 *                        não existe rota de notificação no backend. A barra também virou
 *                        fixa no topo e o menu do usuário passou a mostrar o e-mail.
 */

import { LogOut, Settings, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"
import ThemeSwitcher from "@/components/theme/ThemeSwitcher"
import ColorSchemePicker from "@/components/theme/ColorSchemePicker"

export function Header() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()

  const handleLogout = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  // Iniciais do nome, pra usar no lugar de um ícone genérico de pessoa
  const initials = user?.full_name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

  return (
    // sticky pra barra continuar acessível quando a listagem for longa
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <SidebarTrigger />

        {/* No celular o breadcrumb ocuparia a barra toda, então fica só do sm pra cima */}
        <div className="hidden min-w-0 sm:block">
          <Breadcrumbs />
        </div>

        <div className="flex-1" />

        <ThemeSwitcher />
        <ColorSchemePicker />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu da conta">
              {initials ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                  {initials}
                </span>
              ) : (
                <User className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="space-y-0.5">
              <p className="truncate text-sm font-medium">{user?.full_name || "Minha conta"}</p>
              {user?.email && <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>}
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Meu perfil
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
