/**
 * AppShell.tsx - A casca do painel: lateral + topo + área de conteúdo
 * # Pra que serve?
 * - Montar a moldura fixa em volta de toda tela autenticada
 * - Barrar quem não está logado antes de qualquer tela tentar carregar dado
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Primeira versão, junto com o painel novo
 */

import { useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

/** O título do topo sai da rota: um mapa simples evita prop-drilling em toda tela. */
const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Painel",
  "/people": "Pessoas",
  "/people/create": "Cadastrar pessoa",
  "/students": "Alunos",
  "/students/create": "Cadastrar aluno",
  "/teachers": "Professores",
  "/teachers/create": "Cadastrar professor",
  "/employees": "Funcionários",
  "/employees/create": "Cadastrar funcionário",
  "/visitors": "Visitantes",
  "/visitors/create": "Cadastrar visitante",
  "/biometrics": "Digitais",
  "/biometrics/register": "Registrar digital",
  "/logs/biometric": "Acessos da catraca",
  "/logs/web": "Acessos ao sistema",
  "/units": "Unidades",
  "/units/create": "Cadastrar unidade",
  "/profile": "Minha conta",
}

const COLLAPSE_KEY = "sidebar_collapsed"

export function AppShell() {
  const { user, loading } = useAuth()
  const location = useLocation()

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1")
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0")
  }, [collapsed])

  // Trocar de tela fecha a gaveta do celular, senão ela cobre o conteúdo que abriu
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // A sessão salva ainda está sendo conferida: mostrar o painel agora seria mentira
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Carregando sua sessão...
        </span>
      </div>
    )
  }

  if (!user) {
    // Guarda de onde a pessoa veio, pra devolver ela ali depois do login
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const title = ROUTE_TITLES[location.pathname] ?? "BioAccess"

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Lateral fixa, a partir do desktop */}
      <aside className="hidden shrink-0 lg:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      </aside>

      {/* Lateral como gaveta, no celular e no tablet */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setDrawerOpen(false)}
            aria-label="Fechar a navegação"
          />
          <div className="absolute inset-y-0 left-0 shadow-lg">
            <Sidebar collapsed={false} onToggle={() => setDrawerOpen(false)} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} onOpenSidebar={() => setDrawerOpen(true)} />

        {/* A rolagem é daqui pra dentro: a moldura não sai do lugar */}
        <main className={cn("flex-1 overflow-y-auto", "px-3 py-4 sm:px-4 lg:px-6")}>
          <div className="mx-auto w-full max-w-[110rem]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
