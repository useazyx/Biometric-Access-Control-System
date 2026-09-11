/**
 * AppLayout.tsx - A moldura de toda tela que exige login
 * # Pra que serve?
 * - Barrar quem não está logado e mandar pra tela de login
 * - Montar o menu lateral, a barra do topo e a área de conteúdo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-08-12): Layout com sidebar, header e verificação de sessão
 * - v2.0.0 (2026-09-09): Enquanto verificava a sessão, a tela mostrava a digital em tela
 *                        cheia com tempo fixo de 1,8s; agora é um esqueleto que some assim
 *                        que a verificação termina. O ActionSuccess saiu (escutava um evento
 *                        que ninguém disparava) e a barra de progresso subiu pro nível do
 *                        layout, pra também aparecer durante a verificação inicial.
 *                        A área de conteúdo virou div: o SidebarInset já é o <main>,
 *                        e tinha um segundo <main> aninhado dentro dele.
 */

import { useEffect } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { Fingerprint } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { AppSidebar } from "./AppSidebar"
import { Header } from "./Header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import GlobalLoadingIndicator from "@/components/visual/GlobalLoadingIndicator"

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signed, loading } = useAuth()

  useEffect(() => {
    // Só manda pro login depois de terminar de verificar, senão a pessoa
    // é expulsa no meio da checagem e perde a sessão que era válida
    if (!loading && !signed) {
      navigate("/login", { replace: true })
    }
  }, [signed, loading, navigate])

  // Verificando a sessão: mostra a marca e para de mostrar assim que resolver
  if (loading) {
    return <SessionCheck />
  }

  // Já vai redirecionar pro login; não pisca o layout no caminho
  if (!signed) return null

  return (
    <SidebarProvider>
      <GlobalLoadingIndicator />

      <AppSidebar />

      {/* SidebarInset já é o <main> da página, então aqui dentro vai div:
          dois <main> aninhados é HTML inválido e confunde leitor de tela */}
      <SidebarInset>
        <Header />

        <div className="flex-1 overflow-x-hidden p-4 sm:p-6">
          {/* A key faz a animação de entrada rodar de novo em cada troca de tela */}
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

/**
 * Tela de espera enquanto o app confere se a sessão salva ainda vale.
 * Costuma durar uma fração de segundo, então é de propósito bem simples:
 * nada de animação longa que faça a espera parecer maior do que é.
 */
function SessionCheck() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-animated"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 fp-glow">
        <Fingerprint className="h-7 w-7 text-primary" />
      </span>
      <p className="text-sm text-muted-foreground">Verificando sua sessão...</p>
    </div>
  )
}
