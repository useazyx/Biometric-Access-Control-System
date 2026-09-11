/**
 * CreateEmployeeService.ts - O cadastrador de funcionários: registra novos colaboradores
 * # Pra que serve?
 * - Validar os dados antes de cadastrar
 * - Garantir que tudo tá certo antes de salvar no banco
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.2.0
 * Data: 2025-07-15 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-07-05): Cadastro básico de funcionários
 * - v1.1.0 (2025-07-10): Validação de pessoa existente
 * - v1.2.0 (2025-07-15): Verificação de duplicidade de funcionário
 */

import { prisma } from "../../config/prisma"
import config from "../../config/app"
import { sendEmail } from "../../utils/emailSender"
import { generateTemporaryPassword } from "../../utils/passwordGenerator"

// O que a gente precisa pra cadastrar um funcionário:
interface CreateEmployeeRequest {
  cpf: string
  role_id: number
  registration_number: string
  admission_date?: Date
  active?: boolean
}

// O que a gente devolve quando cadastra:
interface EmployeeResult {
  id: number
  registration_number: string
  person_id: number
}

// Serviço que cadastra funcionários - tipo o RH digital

export class CreateEmployeeService {
  // Faz todo o processo de cadastrar um funcionário

  async execute(data: CreateEmployeeRequest): Promise<EmployeeResult> {
    return await prisma.$transaction(async (tx) => {
      // Passo a passo das validações:
      // 1. Confere se a pessoa já existe no sistema
      const person = await this.validatePerson(data.cpf, tx)
      // 2. Verifica se ela já não tá cadastrada como funcionária
      await this.checkExistingEmployee(person.id, tx)
      // 3. Checa se o cargo existe
      await this.validateRole(data.role_id, tx)

      // Se passou nas validações, cria o registro
      return this.createEmployee(
        {
          personId: person.id,
          roleId: data.role_id,
          registrationNumber: data.registration_number,
          admissionDate: data.admission_date,
          active: data.active !== undefined ? data.active : true,
        },
        tx,
      )
    })
  }

  // Confere se a pessoa existe no banco de dados

  private async validatePerson(cpf: string, tx: any) {
    // Busca a pessoa pelo CPF (que é único)
    const person = await tx.person.findUnique({ where: { cpf } })
    // Se não achou, não tem como cadastrar como funcionário
    if (!person) throw new Error("Pessoa não encontrada")
    return person
  }

  // Verifica se a pessoa já não é funcionária

  private async checkExistingEmployee(personId: number, tx: any) {
    // Procura se já existe cadastro dela como funcionária
    const existingEmployee = await tx.employee.findFirst({
      where: { person_id: personId },
    })

    // Se já tiver cadastrada, barra aqui pra não duplicar
    if (existingEmployee) {
      throw new Error("Esta pessoa já está cadastrada como funcionário")
    }
  }

  // Confere se o cargo existe (pra não vincular a cargo fantasma)

  private async validateRole(roleId: number, tx: any) {
    // Busca o cargo no banco pelo ID
    const role = await tx.role.findUnique({ where: { id: roleId } })
    // Se não achou, o cargo não existe
    if (!role) throw new Error("Cargo não encontrado")
  }

  // Cria o registro do funcionário no banco (a parte importante!)

  private async createEmployee(
    params: {
      personId: number
      roleId: number
      registrationNumber: string
      admissionDate?: Date
      active?: boolean
    },
    tx: any,
  ): Promise<EmployeeResult> {
    // Cria de fato o registro no banco
    const employee = await tx.employee.create({
      data: {
        registration_number: params.registrationNumber,
        admission_date: params.admissionDate,
        person_id: params.personId,
        role_id: params.roleId,
        active: params.active !== undefined ? params.active : true,
      },
      include: {
        person: true,
        role: true
      }
    })

    // Se o funcionário for ativo, gera e envia a senha temporária
    if (employee.active) {
      const temporaryPassword = generateTemporaryPassword()
      
      // Atualiza a pessoa com a senha temporária
      await tx.person.update({
        where: { id: params.personId },
        data: { temporary_password: temporaryPassword }
      })

      // Envia o email com a senha temporária
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #1f2937;">Bem-vindo ao Sistema Biométrico</h2>
          <p>Olá ${employee.person.full_name},</p>
          <p>Seu cadastro como ${employee.role.name} foi realizado com sucesso!</p>
          <p>Use a senha temporária abaixo para acessar o sistema:</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1f2937;">
            <p style="margin: 0; font-size: 18px;"><strong>Senha Temporária:</strong></p>
            <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #111827;">${temporaryPassword}</p>
          </div>
          <p>Para acessar o sistema, utilize seu CPF e a senha temporária fornecida.</p>
          <p>Após o primeiro acesso, você será solicitado a alterar sua senha.</p>
          <p>Atenciosamente,<br>Equipe de Controle de Acesso Biométrico</p>
        </div>
      `

      try {
        await sendEmail({
          to: employee.person.email,
          subject: `[${employee.role.name}] Acesso ao Sistema Biométrico`,
          text: `Olá ${employee.person.full_name},\n\nSeu cadastro como ${employee.role.name} foi realizado com sucesso!\n\nSua senha temporária é: ${temporaryPassword}\n\nAcesse o sistema em: ${config.FRONTEND_URL}/login\n\nAtenciosamente,\nEquipe de Controle de Acesso Biométrico`,
          html,
        })
      } catch (emailError) {
        console.error("Erro ao enviar email:", emailError)
        // Não interrompe o fluxo se o email falhar
      }
    }

    // Devolve só o necessário pro front (sem dados sensíveis)
    return {
      id: employee.id,
      registration_number: employee.registration_number,
      person_id: employee.person_id,
    }
  }
}
