/**
 * CreatePersonService.ts - Serviço que cadastra pessoas (etapa 1 do fluxo multi-etapas)
 * # Pra que serve?
 * - Criar a pessoa na tabela Person apenas com dados básicos
 * - Validar CPF e e-mail únicos antes de criar
 * - Gerar e mandar por e-mail a senha temporária de quem vai usar o sistema web
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 3.1.0
 * Data: 2026-09-09
 * Alterações:
 * - v3.0.0 (2025-01-22): Fluxo de cadastro em etapas (Person primeiro, o resto depois)
 * - v3.1.0 (2026-09-09): Corrigida a lista de quem recebe acesso, que estava em MAIÚSCULO
 *                        e por isso nunca batia com o enum PersonType (ninguém recebia senha).
 *                        O link do e-mail também deixou de ser fixo em localhost.
 */

import { prisma } from "../../config/prisma"
import { PersonType, type Prisma, type UnitType } from "@prisma/client"
import { generateTemporaryPassword } from "../../utils/passwordGenerator"
import { sendEmail } from "../../utils/emailSender"
import config from "../../config/app"

// O que a gente precisa pra cadastrar uma pessoa:
interface CreatePersonRequest {
  full_name: string
  birth_date: Date | null
  cpf: string
  email: string
  phone?: string
  type: PersonType
  main_unit_type: UnitType
  registration_unit_id: number
}

// Quem faz parte da equipe e por isso ganha acesso ao sistema web.
// Atenção: têm que ser exatamente os valores do enum PersonType (minúsculo),
// senão o includes() nunca casa e ninguém recebe senha temporária.
const TYPES_WITH_SYSTEM_ACCESS: PersonType[] = [
  PersonType.employee,
  PersonType.coordinator,
  PersonType.inspector,
]

export class CreatePersonService {
  async execute(data: CreatePersonRequest) {
    // Faz tudo dentro de uma transação: ou cadastra a pessoa inteira, ou não cadastra nada
    const person = await prisma.$transaction(async (tx) => {
      // Confere se já tem alguém com esse CPF ou esse e-mail
      await this.ensureCpfIsFree(tx, data.cpf)
      await this.ensureEmailIsFree(tx, data.email)

      // Se a pessoa é da equipe, já nasce com uma senha temporária pra poder entrar
      const temporaryPassword = this.shouldReceiveSystemAccess(data.type) ? generateTemporaryPassword() : null

      return tx.person.create({
        data: {
          full_name: data.full_name,
          birth_date: data.birth_date,
          cpf: data.cpf,
          email: data.email,
          phone: data.phone,
          type: data.type,
          main_unit_type: data.main_unit_type,
          registration_unit_id: data.registration_unit_id,
          temporary_password: temporaryPassword,
        },
      })
    })

    // O e-mail sai fora da transação de propósito: se o Gmail estiver fora do ar,
    // a pessoa continua cadastrada e a gente só perde o aviso
    if (person.temporary_password) {
      await this.sendWelcomeEmail(person.full_name, person.email, person.temporary_password)
    }

    return {
      id: person.id,
      message: "Pessoa cadastrada com sucesso",
      created_at: new Date().toISOString(),
      email: person.email,
      full_name: person.full_name,
      temporary_password_sent: !!person.temporary_password,
    }
  }

  // Diz se esse tipo de pessoa usa o sistema web (aluno e visitante não usam)
  private shouldReceiveSystemAccess(type: PersonType): boolean {
    return TYPES_WITH_SYSTEM_ACCESS.includes(type)
  }

  // Barra CPF repetido (o banco também barra, mas aqui a mensagem sai amigável)
  private async ensureCpfIsFree(tx: Prisma.TransactionClient, cpf: string) {
    const existingPerson = await tx.person.findUnique({
      where: { cpf },
    })

    if (existingPerson) {
      throw new Error("CPF já cadastrado! Não pode ter duas pessoas com o mesmo CPF")
    }
  }

  // Barra e-mail repetido (é por ele que a pessoa faz login, então tem que ser único)
  private async ensureEmailIsFree(tx: Prisma.TransactionClient, email: string) {
    if (!email) return

    const existingEmail = await tx.person.findUnique({
      where: { email },
    })

    if (existingEmail) {
      throw new Error("E-mail já cadastrado! Use outro email")
    }
  }

  // Manda o e-mail de boas-vindas com a senha temporária e o caminho pra trocar ela
  private async sendWelcomeEmail(fullName: string, email: string, temporaryPassword: string) {
    // Pega o endereço do front do .env, pra não ficar chumbado em localhost
    const settingsUrl = `${config.FRONTEND_URL}/settings`

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #1f2937;">Bem-vindo ao Sistema Biométrico</h2>
        <p>Olá ${fullName},</p>
        <p>Seu acesso inicial foi criado. Use a senha temporária abaixo para entrar no sistema.</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1f2937;">
          <p style="margin: 0; font-size: 18px;"><strong>Senha Temporária:</strong></p>
          <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #111827;">${temporaryPassword}</p>
        </div>
        <p>Depois de entrar, vá em <strong>Configurações</strong> em <a href="${settingsUrl}">${settingsUrl}</a> e escolha <strong>Redefinir Senha</strong> informando este código no campo <em>token</em> para definir sua senha definitiva.</p>
        <p>Se você perder esta senha, utilize a opção <strong>Esqueci minha senha</strong> para receber um novo código temporário.</p>
        <p>Atenciosamente,<br>Equipe de Controle de Acesso Biométrico</p>
      </div>
    `

    await sendEmail({
      to: email,
      subject: "Acesso inicial - Senha temporária",
      text: `Olá ${fullName},\n\nSua senha temporária é: ${temporaryPassword}.\nApós entrar, acesse Configurações em ${settingsUrl} para redefinir sua senha usando este código no campo token.`,
      html,
    })
  }
}
