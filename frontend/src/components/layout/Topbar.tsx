/**
 * Topbar.tsx - A faixa do topo: onde você está, em que unidade, e quem é você
 * # Pra que serve?
 * - Deixar sempre à vista a unidade cujo cadastro está sendo administrado
 * - Dar acesso ao tema, à conta e à saída sem ocupar espaço da tabela
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Primeira versão, junto com o painel novo
 */

import { Link, useNavigate } from "react-router-dom"
import { Building2, LogOut, Menu, Moon, Sun, User } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { initials } from "@/lib/format"
import { labelOf, PERSON_TYPE_LABELS } from "@/lib/labels"
import { useTheme } from "@/hooks/useTheme"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TopbarProps {
  title: string
  /** Abre a lateral como gaveta no celular. */
  onOpenSidebar: () => void
}

export function Topbar({ title, onOpenSidebar }: TopbarProps) {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate("/login", { replace: true })
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-3 sm:px-4">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onOpenSidebar}
        aria-label="Abrir a navegação"
      >
        <Menu className="h-[1.125rem] w-[1.125rem]" aria-hidden />
      </Button>

      <h1 className="min-w-0 flex-1 truncate text-[0.9375rem] font-semibold">{title}</h1>

      {/* A unidade define o que a pessoa vê em TODA listagem, então fica sempre visível */}
      {user?.unit_code && (
        <span
          className="hidden items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2 py-1 text-[0.75rem] text-muted-foreground sm:flex"
          title={user.unit_name ?? undefined}
        >
          <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="max-w-[14rem] truncate">{user.unit_name ?? "Unidade"}</span>
          <span className="identifier text-foreground/70">{user.unit_code}</span>
        </span>
      )}

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
      >
        {theme === "dark" ? (
          <Sun className="h-[1.0625rem] w-[1.0625rem]" aria-hidden />
        ) : (
          <Moon className="h-[1.0625rem] w-[1.0625rem]" aria-hidden />
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-8 items-center gap-2 rounded-md pl-1 pr-2 transition-colors hover:bg-muted"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-[0.6875rem] font-semibold text-primary-foreground">
              {initials(user?.full_name)}
            </span>
            <span className="hidden max-w-[10rem] truncate text-[0.8125rem] md:inline">
              {user?.full_name ?? "Conta"}
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate text-sm font-medium">{user?.full_name}</span>
            <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {labelOf(PERSON_TYPE_LABELS, user?.type)}
            </span>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link to="/profile">
              <User className="mr-2 h-4 w-4" aria-hidden />
              Minha conta
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={handleSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" aria-hidden />
            Sair do sistema
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
