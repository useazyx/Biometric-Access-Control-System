/**
 * Login.tsx - A porta de entrada do sistema web
 * # Pra que serve?
 * - Autenticar quem administra o cadastro (coordenação, funcionários e inspetores)
 * - Explicar direito quando o acesso é negado, em vez de só piscar um erro
 * - Abrir o sistema com a leitura da digital, que é o que o projeto faz
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 3.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-08-10): Primeira versão da tela de login
 * - v2.0.0 (2026-09-10): O erro passou a aparecer na própria tela
 * - v3.0.0 (2026-09-10): Painel de apresentação redesenhado e leitura da digital ao
 *                        entrar. A animação ocupa o tempo que a autenticação já leva,
 *                        em vez de ser um atraso inventado em cima dele.
 */

import { useState, type FormEvent } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { AlertCircle, Eye, EyeOff, Fingerprint, IdCard, ScrollText, ShieldCheck } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiErrorMessage } from "@/lib/api"
import { FingerprintScan, type ScanState } from "@/components/visual/FingerprintScan"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * Quanto tempo a leitura fica na tela, no mínimo. Não é atraso inventado: a chamada
 * de login e a busca do perfil acontecem DENTRO desse tempo. Só se a API responder
 * mais rápido que isso é que a gente espera o resto, pra varredura não piscar.
 */
const MIN_SCAN_MS = 900
const GRANTED_MS = 620

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** O que o sistema entrega, dito em três linhas no painel de apresentação. */
const HIGHLIGHTS = [
  { icon: IdCard, text: "A digital no lugar do crachá: não se perde nem se empresta" },
  { icon: ShieldCheck, text: "A catraca confere o acesso à unidade na hora" },
  { icon: ScrollText, text: "Toda passagem fica registrada, com pessoa e horário" },
]

export default function Login() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scan, setScan] = useState<ScanState | null>(null)

  const submitting = scan !== null

  // Já logado (ou voltando pelo histórico): não faz sentido ver o login de novo.
  // O `!scan` é essencial: sem ele, o redirecionamento dispararia no instante em que
  // o signIn preenche a sessão, e a leitura da digital nunca chegaria a aparecer.
  if (!loading && user && !scan) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? "/dashboard"} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setScan("scanning")

    const startedAt = Date.now()

    try {
      await signIn(email.trim(), password)

      // Completa o tempo mínimo só com o que faltou, sem somar em cima
      await wait(Math.max(0, MIN_SCAN_MS - (Date.now() - startedAt)))

      setScan("granted")
      await wait(GRANTED_MS)

      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? "/dashboard", { replace: true })
    } catch (submitError) {
      setScan(null)
      setError(apiErrorMessage(submitError, "Não consegui entrar. Confere o e-mail e a senha."))
    }
  }

  return (
    <>
      {scan && <FingerprintScan state={scan} personName={user?.full_name} />}

      <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(25rem,34rem)]">
        {/* Painel de apresentação: só a partir do desktop, onde sobra largura */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex">
          {/* Marca d'água: é o mesmo ícone da marca, gigante e quase apagado.
              Fica parada — imagem de fundo animada é exatamente o tipo de enfeite
              que custa quadro e não entrega nada. */}
          <Fingerprint
            className="pointer-events-none absolute -bottom-20 -right-24 h-[32rem] w-[32rem] text-white/[0.035]"
            strokeWidth={0.5}
            aria-hidden
          />

          <div className="relative flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Fingerprint className="h-[1.375rem] w-[1.375rem]" aria-hidden />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-base font-semibold text-white">BioAccess</span>
              <span className="text-[0.75rem] text-sidebar-foreground/55">
                Controle de acesso por biometria
              </span>
            </span>
          </div>

          <div className="relative max-w-lg">
            <h1 className="text-[2rem] font-semibold leading-[1.2] tracking-tight text-white">
              Quem entrou, quando entrou,
              <br />
              e sem depender de crachá.
            </h1>

            <p className="mt-4 text-[0.9375rem] leading-relaxed text-sidebar-foreground/70">
              Crachá se perde, se esquece em casa e é emprestado pra quem não deveria
              entrar. Quando o controle é no papel, saber quem estava na escola numa
              determinada hora vira investigação.
            </p>

            <ul className="mt-8 space-y-3.5">
              {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-sidebar-accent text-sidebar-primary">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="text-[0.875rem] leading-relaxed text-sidebar-foreground/80">
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-[0.75rem] text-sidebar-foreground/45">
            Trabalho de Conclusão de Curso · ETEC Dr. Geraldo José Rodrigues Alckmin ·
            Taubaté/SP
          </p>
        </aside>

        <main className="flex items-center justify-center bg-background px-5 py-12">
          <div className="w-full max-w-sm animate-fade-in">
            {/* No celular a marca some da lateral, então reaparece aqui */}
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Fingerprint className="h-[1.375rem] w-[1.375rem]" aria-hidden />
              </span>
              <span className="text-base font-semibold">BioAccess</span>
            </div>

            <h2 className="text-[1.375rem] font-semibold tracking-tight">Entrar no sistema</h2>
            <p className="mt-1.5 text-[0.8125rem] text-muted-foreground">
              Use o e-mail cadastrado na sua unidade.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {error && (
                <div
                  role="alert"
                  className="flex animate-pop-in items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-[0.8125rem] text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@etec01.com.br"
                  autoComplete="username"
                  required
                  autoFocus
                  disabled={submitting}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={submitting}
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Esconder a senha" : "Mostrar a senha"}
                    className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                <Fingerprint className="mr-2 h-[1.125rem] w-[1.125rem]" aria-hidden />
                {submitting ? "Verificando..." : "Entrar"}
              </Button>
            </form>

            <p className="mt-7 border-t border-border pt-5 text-[0.75rem] leading-relaxed text-muted-foreground">
              Só coordenação, funcionários e inspetores têm login aqui. Alunos e visitantes
              são cadastrados e passam pela catraca, mas não administram o sistema.
            </p>
          </div>
        </main>
      </div>
    </>
  )
}
