/**
 * Login.tsx - A porta de entrada do sistema
 * # Pra que serve?
 * - Receber e-mail e senha, autenticar e levar pro dashboard
 * - Oferecer o "esqueci minha senha", que manda uma senha temporária por e-mail
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-08-10): Formulário de login com dialog de recuperação de senha
 * - v2.0.0 (2026-09-09): Tela redesenhada em duas colunas com a identidade do sistema.
 *                        Também tiraram daqui o e-mail e a senha reais que estavam
 *                        chumbados como valor inicial dos campos.
 */

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, Fingerprint, Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/services/api"

// Os três argumentos de venda que ficam na coluna da esquerda
const HIGHLIGHTS = [
  {
    title: "Digital em vez de crachá",
    description: "O sensor R307 identifica a pessoa na catraca, sem cartão pra esquecer ou emprestar.",
  },
  {
    title: "Histórico de tudo",
    description: "Cada entrada e saída fica registrada, com pessoa, horário e unidade.",
  },
  {
    title: "Uma unidade por vez",
    description: "Cada Etec ou Fatec vê e administra só o cadastro da própria unidade.",
  },
]

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)

  const navigate = useNavigate()
  const { toast } = useToast()
  const { signIn, signed } = useAuth()

  // Se já estiver logado, não faz sentido ficar na tela de login
  useEffect(() => {
    if (signed) {
      navigate("/dashboard", { replace: true })
    }
  }, [signed, navigate])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password)

      toast({
        title: "Bem-vindo de volta!",
        description: "Login realizado com sucesso.",
      })

      navigate("/dashboard", { replace: true })
    } catch (error: any) {
      toast({
        title: "Não consegui entrar",
        description: error.message || "Confere o e-mail e a senha.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!forgotEmail) {
      toast({ title: "Informe o e-mail", variant: "destructive" })
      return
    }

    setForgotLoading(true)

    try {
      await api.post("/forgot-password", { email: forgotEmail })

      toast({
        title: "Senha temporária enviada",
        description: "Confere a caixa de entrada do e-mail informado.",
      })

      setForgotEmail("")
      setForgotOpen(false)
    } catch (error: any) {
      toast({
        title: "Não consegui enviar",
        description: error?.response?.data?.message || "Tenta de novo em alguns instantes.",
        variant: "destructive",
      })
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ---------------------------------------------------------------
       * Coluna da esquerda: a marca e o que o sistema faz.
       * Só aparece em tela grande; no celular o formulário ocupa tudo.
       * --------------------------------------------------------------- */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex noise-overlay">
        {/* Brilho suave atrás do conteúdo, na cor da marca */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sidebar-primary/20 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sidebar-primary/15 ring-1 ring-sidebar-primary/30">
            <Fingerprint className="h-6 w-6 text-sidebar-primary" />
          </span>
          <div>
            <p className="text-base font-semibold leading-tight">BioAccess</p>
            <p className="text-xs text-sidebar-foreground/70">Controle de Acesso Biométrico</p>
          </div>
        </div>

        <div className="relative max-w-md space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight">
              Quem entra na escola, registrado pela digital.
            </h1>
            <p className="text-sm leading-relaxed text-sidebar-foreground/75">
              Cadastro de alunos, professores, funcionários e visitantes, com a biometria ligada ao
              controle de acesso de cada unidade.
            </p>
          </div>

          <ul className="space-y-5">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sidebar-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs leading-relaxed text-sidebar-foreground/70">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-sidebar-foreground/50">
          Trabalho de Conclusão de Curso · ETEC Dr. Geraldo José Rodrigues Alckmin
        </p>
      </aside>

      {/* ---------------------------------------------------------------
       * Coluna da direita: o formulário
       * --------------------------------------------------------------- */}
      <main className="flex items-center justify-center bg-animated px-4 py-12">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Em tela pequena a marca aparece aqui, já que a coluna da esquerda fica oculta */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Fingerprint className="h-5 w-5 text-primary" />
            </span>
            <div>
              <p className="font-semibold leading-tight">BioAccess</p>
              <p className="text-xs text-muted-foreground">Controle de Acesso Biométrico</p>
            </div>
          </div>

          <Card className="border-border/70 shadow-lg">
            <CardHeader className="space-y-1.5">
              <CardTitle className="text-xl">Entrar no sistema</CardTitle>
              <CardDescription>
                Acesso restrito à coordenação, funcionários e inspetores da unidade.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail institucional</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seu.nome@etec001.com.br"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>

                    {/* Dialog de recuperação: fica junto do campo de senha, que é onde
                        a pessoa percebe que esqueceu */}
                    <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                        >
                          Esqueci minha senha
                        </button>
                      </DialogTrigger>

                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Esqueci minha senha</DialogTitle>
                          <DialogDescription>
                            A gente manda uma senha temporária pro seu e-mail. Depois de entrar, você
                            define a definitiva em Configurações.
                          </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleForgotPassword} className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <Label htmlFor="forgot_email">E-mail cadastrado</Label>
                            <Input
                              id="forgot_email"
                              type="email"
                              value={forgotEmail}
                              onChange={(event) => setForgotEmail(event.target.value)}
                              placeholder="seu.nome@etec001.com.br"
                              required
                            />
                          </div>

                          <Button type="submit" className="w-full" disabled={forgotLoading}>
                            {forgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {forgotLoading ? "Enviando..." : "Enviar senha temporária"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pr-10"
                      required
                    />
                    {/* Mostrar a senha ajuda a acertar senha temporária, que é grande e embaralhada */}
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                      className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            Recebeu uma senha temporária por e-mail? Entre com ela e troque em{" "}
            <span className="font-medium text-foreground">Configurações → Redefinir senha</span>.
          </p>
        </div>
      </main>
    </div>
  )
}
