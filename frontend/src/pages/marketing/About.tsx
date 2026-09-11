/**
 * About.tsx - Explica o que é o projeto e quem fez
 * # Pra que serve?
 * - Contar de onde veio o sistema e qual problema ele resolve
 * - Dar crédito a cada integrante da equipe pelo módulo que desenvolveu
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-08-20): Página gerada com texto e números de exemplo
 * - v2.0.0 (2026-09-09): Reescrita com o conteúdo real do TCC. A versão anterior anunciava
 *                        "10+ anos de experiência" e "50k+ usuários atendidos", números que
 *                        nunca existiram: num trabalho de conclusão isso só desmente o resto.
 */

import { Cpu, Database, Fingerprint, Monitor } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Os quatro módulos do sistema e quem fez cada um
const MODULES = [
  {
    icon: Database,
    name: "Backend",
    stack: "TypeScript · Fastify · Prisma · PostgreSQL",
    author: "Arthur Roberto Weege Pontes",
    description:
      "A API REST que guarda tudo: pessoas, digitais, unidades e o histórico de acesso. Valida cada entrada com Zod e protege as rotas com JWT.",
  },
  {
    icon: Monitor,
    name: "Frontend",
    stack: "React · Vite · Tailwind CSS",
    author: "Arthur Roberto Weege Pontes",
    description:
      "Esta interface. É por aqui que a coordenação cadastra pessoas, registra digitais e consulta quem entrou e saiu da unidade.",
  },
  {
    icon: Fingerprint,
    name: "Sistema Python",
    stack: "Python · psycopg2 · pyserial",
    author: "Douglas Henrique Santos Xavier e Guilherme Moreira da Rocha",
    description:
      "Fica junto da catraca: lê a digital no sensor, compara com o que está no banco e registra o acesso. Tem modo de simulação pra testar sem o sensor.",
  },
  {
    icon: Cpu,
    name: "Interface C++",
    stack: "C++ · Comunicação serial",
    author: "Guilherme Silveira Fernandes",
    description:
      "A camada de baixo nível que conversa com o sensor R307 pela porta serial e faz a ponte entre o hardware e os outros módulos.",
  },
]

export default function About() {
  return (
    <div className="space-y-8">
      {/* Capa da página */}
      <section className="relative overflow-hidden rounded-2xl bg-animated p-8 sm:p-10 noise-overlay">
        <div className="relative z-10 max-w-2xl space-y-3">
          <Badge variant="secondary" className="mb-1">
            Trabalho de Conclusão de Curso
          </Badge>
          <h1 className="heading-xl">Sobre o projeto</h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            O BioAccess é um sistema de controle de acesso por biometria feito para Etecs e Fatecs.
            Ele substitui o crachá pela digital e registra cada entrada e saída, ligando o sensor de
            hardware ao cadastro da instituição.
          </p>
        </div>
      </section>

      {/* O problema e a proposta */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">O problema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Crachá se perde, se esquece em casa e é emprestado pra quem não deveria entrar. E
              quando o controle é feito em papel ou planilha, saber quem estava na escola numa
              determinada hora vira uma investigação.
            </p>
            <p>
              Sem um registro confiável de entrada e saída, a instituição não consegue responder
              perguntas simples de segurança nem acompanhar a frequência de quem circula ali.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">A proposta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              A digital não se perde nem se empresta. O sensor R307 identifica a pessoa na catraca,
              o sistema confere se ela tem acesso àquela unidade e grava o evento na hora.
            </p>
            <p>
              A coordenação administra tudo por esta interface web: cadastra alunos, professores,
              funcionários e visitantes, registra as digitais e consulta o histórico completo,
              sempre no escopo da própria unidade.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Como o sistema é dividido */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="heading-lg">Como o sistema é dividido</h2>
          <p className="section-description">
            Quatro módulos independentes, cada um numa tecnologia diferente, desenvolvidos em
            paralelo pela equipe.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {MODULES.map((module) => {
            const Icon = module.icon

            return (
              <Card key={module.name} className="shadow-card tilt-hover">
                <CardHeader className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-base">{module.name}</CardTitle>
                      <CardDescription className="identifier text-xs">{module.stack}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-sm leading-relaxed text-muted-foreground">{module.description}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Desenvolvido por:</span> {module.author}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Onde o trabalho foi feito */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">A instituição</CardTitle>
          <CardDescription>
            ETEC Dr. Geraldo José Rodrigues Alckmin · Taubaté, São Paulo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Este sistema foi desenvolvido como Trabalho de Conclusão de Curso do curso técnico, com
            hardware real: o sensor biométrico R307 conectado ao módulo de leitura. O projeto é aberto
            e o código está disponível no repositório.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
