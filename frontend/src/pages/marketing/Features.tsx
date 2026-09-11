/**
 * Features.tsx - Lista o que o sistema faz de verdade
 * # Pra que serve?
 * - Mostrar cada recurso que existe no sistema, com a tela onde ele fica
 * - Servir de guia rápido pra quem está usando o sistema pela primeira vez
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-08-20): Quatro cartões genéricos ("UX Premium", "Dashboards ricos")
 * - v2.0.0 (2026-09-09): Reescrita descrevendo os recursos que realmente existem, cada um
 *                        com link pra tela correspondente. A versão anterior vendia
 *                        "microinterações elegantes" e não dizia o que o sistema faz.
 */

import { Link } from "react-router-dom"
import {
  ArrowRight,
  Building2,
  Fingerprint,
  KeyRound,
  ListChecks,
  ShieldCheck,
  Users,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Cada recurso aponta pra tela onde ele acontece, pra página servir de índice também
const FEATURES = [
  {
    icon: Users,
    title: "Cadastro por perfil",
    to: "/people",
    description:
      "Aluno, professor, funcionário, coordenador, inspetor e visitante. O cadastro é em etapas: primeiro a pessoa, depois os dados específicos do perfil dela.",
    details: ["CPF validado pelos dígitos verificadores", "E-mail único por pessoa", "Aluno tem RM, curso, turma e período"],
  },
  {
    icon: Fingerprint,
    title: "Registro de digitais",
    to: "/biometrics",
    description:
      "Cada pessoa pode ter várias digitais cadastradas, uma por dedo. O template vem do sensor R307 e fica guardado ligado à unidade onde foi registrado.",
    details: ["Dez dedos disponíveis", "Gerador de template pra testar sem o sensor", "Indicador de qualidade da leitura"],
  },
  {
    icon: ListChecks,
    title: "Histórico de acessos",
    to: "/logs/biometric",
    description:
      "Toda passagem pela catraca fica registrada com pessoa, horário, dispositivo e se o acesso foi autorizado ou negado.",
    details: ["Filtro por período e por pessoa", "Entrada e saída separadas", "Histórico separado dos logins na web"],
  },
  {
    icon: ShieldCheck,
    title: "Auditoria de login",
    to: "/logs/web",
    description:
      "Quem entrou no sistema web, quando entrou, quando saiu e quanto tempo ficou. A duração da sessão é calculada no logout.",
    details: ["Registro de entrada e de saída", "Duração da sessão em minutos", "Vinculado à unidade do usuário"],
  },
  {
    icon: Building2,
    title: "Várias unidades",
    to: "/units",
    description:
      "Cada Etec ou Fatec é uma unidade com código próprio, e pode ser sede ou extensão. O usuário vê e administra só o cadastro da unidade dele.",
    details: ["Código no formato ETE001 ou FAT001", "Marcação de extensão", "Pessoas e digitais pertencem à unidade"],
  },
  {
    icon: KeyRound,
    title: "Acesso e senha",
    to: "/settings",
    description:
      "Quem faz parte da equipe recebe uma senha temporária por e-mail no cadastro e define a definitiva no primeiro acesso.",
    details: ["Senha temporária gerada com crypto", "Recuperação por e-mail", "Senha forte exigida na troca"],
  },
]

export default function Features() {
  return (
    <div className="space-y-8">
      {/* Capa da página */}
      <section className="relative overflow-hidden rounded-2xl bg-animated p-8 sm:p-10 noise-overlay">
        <div className="relative z-10 max-w-2xl space-y-3">
          <h1 className="heading-xl">Recursos do sistema</h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            O que dá pra fazer no BioAccess hoje. Cada cartão leva direto pra tela onde o recurso
            fica.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon

          return (
            <Card key={feature.title} className="flex flex-col shadow-card tilt-hover">
              <CardHeader className="space-y-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="space-y-1.5">
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{feature.description}</CardDescription>
                </div>
              </CardHeader>

              <CardContent className="mt-auto space-y-4">
                <ul className="space-y-1.5">
                  {feature.details.map((detail) => (
                    <li key={detail} className="flex gap-2 text-xs text-muted-foreground">
                      <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {detail}
                    </li>
                  ))}
                </ul>

                <Link
                  to={feature.to}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Abrir tela
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
