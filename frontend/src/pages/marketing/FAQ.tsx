/**
 * FAQ.tsx - Responde as dúvidas que aparecem de verdade no uso do sistema
 * # Pra que serve?
 * - Explicar o fluxo de cadastro em etapas, que é o que mais confunde quem começa
 * - Documentar as regras do sistema (quem entra, o que é obrigatório, o que não dá pra apagar)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-08-20): Três perguntas genéricas, uma delas sobre o seletor de tema
 * - v2.0.0 (2026-09-09): Reescrita com as dúvidas reais de operação do sistema
 */

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"

// Perguntas agrupadas por assunto, pra pessoa achar a dela sem ler tudo
const SECTIONS = [
  {
    title: "Cadastro",
    items: [
      {
        question: "Por que o cadastro é feito em duas etapas?",
        answer:
          "Porque tudo no sistema é uma Pessoa antes de ser qualquer outra coisa. Primeiro você cadastra a pessoa (nome, CPF, e-mail, unidade) em Pessoas → Cadastrar. Depois, em Alunos, Funcionários, Professores ou Visitantes, você complementa com os dados daquele perfil buscando pelo CPF que já existe. Assim ninguém aparece duplicado quando é aluno e depois vira funcionário.",
      },
      {
        question: "Cadastrei a pessoa e o aluno não aparece na lista de alunos. Por quê?",
        answer:
          "A pessoa existe, mas ainda não tem o registro de aluno. Vá em Alunos → Cadastrar e informe o CPF dela junto com o RM, o período e o curso. A listagem de alunos mostra só quem já passou por essa segunda etapa.",
      },
      {
        question: "Um visitante precisa de funcionário responsável?",
        answer:
          "Sim, é obrigatório. Todo visitante fica vinculado ao funcionário que responde por ele durante a visita, e é o CPF desse funcionário que você informa no cadastro.",
      },
    ],
  },
  {
    title: "Biometria",
    items: [
      {
        question: "Preciso do sensor R307 pra testar o sistema?",
        answer:
          "Não. Pra desenvolvimento existe um gerador de template biométrico: o backend expõe uma rota que devolve uma digital aleatória válida, e o módulo Python tem um modo de simulação. Pra uso real, aí sim o sensor precisa estar conectado.",
      },
      {
        question: "Quantas digitais uma pessoa pode ter?",
        answer:
          "Uma por dedo, até dez. Cadastrar mais de um dedo é recomendado: se a pessoa se machucar num dedo, ela continua conseguindo entrar.",
      },
      {
        question: "A digital fica salva como imagem?",
        answer:
          "Não. O sensor não guarda foto do dedo: ele gera um template, que é um conjunto de medidas dos pontos característicos da digital. É esse template que o sistema armazena e compara, e não dá pra reconstruir a imagem original a partir dele.",
      },
    ],
  },
  {
    title: "Acesso ao sistema",
    items: [
      {
        question: "Quem consegue entrar no sistema web?",
        answer:
          "Só coordenadores, funcionários e inspetores. Aluno e visitante são cadastrados no sistema e passam pela catraca, mas não têm login: eles não precisam administrar nada. Funcionário com a conta desativada também não entra.",
      },
      {
        question: "Recebi uma senha temporária por e-mail. E agora?",
        answer:
          "Entre com o seu e-mail e essa senha, e vá em Configurações → Redefinir senha pra definir a sua senha definitiva. Se você perder a temporária, use o \"Esqueci minha senha\" na tela de login pra receber outra.",
      },
      {
        question: "Por que só vejo as pessoas de uma unidade?",
        answer:
          "Porque o sistema filtra tudo pela unidade do seu cadastro. Cada Etec ou Fatec administra o próprio pessoal, então as listagens, o dashboard e o histórico mostram sempre o escopo da sua unidade.",
      },
    ],
  },
  {
    title: "Dados e exclusão",
    items: [
      {
        question: "Não consigo excluir uma unidade. Por quê?",
        answer:
          "O sistema não deixa apagar uma unidade que ainda tem gente cadastrada nela, porque isso deixaria pessoas e digitais órfãs e apagaria o histórico de acesso do lugar. Transfira ou remova as pessoas antes.",
      },
      {
        question: "Apagar uma pessoa apaga o histórico de acesso dela?",
        answer:
          "Sim. As digitais, o registro de perfil (aluno, funcionário, etc.) e os logs de acesso daquela pessoa são removidos junto, em cascata. É uma ação sem volta, então confirme antes.",
      },
      {
        question: "Os números do dashboard atualizam sozinhos?",
        answer:
          "Sim, o dashboard recarrega os totais a cada 30 segundos enquanto a tela estiver aberta. As outras listagens buscam os dados quando você abre a tela ou faz uma alteração.",
      },
    ],
  },
]

export default function FAQ() {
  return (
    <div className="space-y-8">
      {/* Capa da página */}
      <section className="relative overflow-hidden rounded-2xl bg-animated p-8 sm:p-10 noise-overlay">
        <div className="relative z-10 max-w-2xl space-y-3">
          <h1 className="heading-xl">Perguntas frequentes</h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            As dúvidas que mais aparecem no dia a dia do sistema, agrupadas por assunto.
          </p>
        </div>
      </section>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="heading-lg">{section.title}</h2>

            <Card className="shadow-card">
              <CardContent className="pt-2">
                {/* collapsible: dá pra fechar a resposta aberta, sem ter que abrir outra */}
                <Accordion type="single" collapsible>
                  {section.items.map((item, index) => (
                    <AccordionItem
                      key={item.question}
                      value={`${section.title}-${index}`}
                      // A última pergunta do bloco não precisa de linha embaixo
                      className={index === section.items.length - 1 ? "border-b-0" : undefined}
                    >
                      <AccordionTrigger className="text-left text-sm font-medium">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </section>
        ))}
      </div>
    </div>
  )
}
