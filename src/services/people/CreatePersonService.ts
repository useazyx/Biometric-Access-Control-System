/**
 * CreatePersonService.ts - O cadastrador de pessoas: cria novos registros de pessoas
 * # Pra que serve?
 * - Cadastrar novas pessoas no sistema
 * - Preparar credenciais de acesso pra quem precisa
 * - Mandar um email de boas-vindas com as instruções
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.3.0
 * Data: 2025-07-13 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-03-12): Implementação básica do cadastro de pessoas
 * - v1.1.0 (2025-03-25): Adicionada geração de senha temporária
 * - v1.2.0 (2025-04-08): Validação de tipos de pessoa com acesso ao sistema
 * - v1.3.0 (2025-04-22): Integração com serviço de e-mail
 * - v2.0.0 (2025-05-15): Refatoração completa com transações atômicas
 * - v2.1.0 (2025-06-05): Templates de e-mail personalizados por tipo de pessoa
 * - v2.2.0 (2025-06-20): Validação de força de senha temporária
 * - v2.3.0 (2025-07-13): Suporte a múltiplas unidades de registro
 */

import { prisma } from "../../config/prisma";
import bcrypt from "bcrypt";
import { generateTemporaryPassword } from "../../utils/passwordGenerator";
import { sendEmail } from "../../utils/emailSender";
import { PersonType, UnitType } from "@prisma/client";

// O que a gente precisa pra cadastrar uma pessoa:
interface CreatePersonProps {
  full_name: string;
  birth_date: Date | null;
  cpf: string;
  email: string;
  phone?: string;
  type: PersonType;
  main_unit_type: UnitType;
  registration_unit_id: number;
}

// Faz o cadastro completo de uma pessoa, tipo um maestro organizando a banda

export class CreatePersonService {
  async execute(data: CreatePersonProps) {
    // Prepara as credenciais (senha) pra quem vai ter acesso ao sistema
    const accessData = this.prepareSystemAccess(data.type);
    // Cria a pessoa no banco de dados
    const person = await this.createPersonRecord(data, accessData.passwordHash);
    // Se gerou senha temporária, manda o email de boas-vindas
    const emailSent = accessData.temporaryPassword
      ? await this.sendWelcomeEmail(data, accessData.temporaryPassword)
      : false;

    // Monta a resposta bonitinha pro front
    return this.buildResponse(person, emailSent);
  }

  // Prepara o acesso ao sistema: gera senha temporária e faz o hash seguro

  private prepareSystemAccess(type: PersonType) {
    // Quais tipos de pessoa vão ter acesso? Coordenadores, funcionários, inspetores...
    const systemAccessTypes: PersonType[] = [
      PersonType.coordinator,
      PersonType.employee,
      PersonType.inspector,
    ];

    // Se for um tipo que não tem acesso (tipo visitante), retorna nulo
    if (!systemAccessTypes.includes(type)) {
      return { passwordHash: null, temporaryPassword: null };
    }

    // Gera uma senha temporária (tipo "123456" mas segura)
    const temporaryPassword = generateTemporaryPassword();
    // Cria um hash (senha embaralhada) pra salvar no banco, com 10 rodadas de sal (seguro)
    const passwordHash = bcrypt.hashSync(temporaryPassword, 10);

    return { passwordHash, temporaryPassword };
  }

  // Salva os dados da pessoa no banco de dados, com o hash da senha (se tiver)

  private async createPersonRecord(
    data: CreatePersonProps,
    passwordHash: string | null
  ) {
    try {
      return await prisma.person.create({
        data: {
          full_name: data.full_name,
          birth_date: data.birth_date,
          cpf: data.cpf,
          email: data.email,
          phone: data.phone,
          type: data.type,
          main_unit_type: data.main_unit_type,
          registration_unit_id: data.registration_unit_id,
          system_access_hash: passwordHash,
        },
      });
    } catch (error: any) {
      // Tenta criar a pessoa no banco...
      // Se der erro, verifica se foi por duplicação (CPF ou email já existem)
      if (error.code === "P2002") {
        // Se o erro for de CPF repetido, avisa
        if (error.meta?.target?.includes("cpf")) {
          throw new Error("CPF já cadastrado no sistema");
        }
        // Se for de email repetido, avisa também
        if (error.meta?.target?.includes("email")) {
          throw new Error("E-mail já cadastrado no sistema");
        }
      }

      // Se for outro erro qualquer, manda uma mensagem genérica
      throw new Error("Erro ao criar registro no banco de dados");
    }
  }

  // Manda um email de boas-vindas com a senha temporária pro novo usuário

  private async sendWelcomeEmail(
    data: CreatePersonProps,
    temporaryPassword: string
  ) {
    try {
      // Pega o nome bonito do cargo (ex: "Coordenador(a)")
      const position = this.getPositionTitle(data.type);
      // Monta o HTML do email (com estilos básicos)
      const htmlContent = this.generateEmailHtml(
        data.full_name,
        position,
        data.email,
        temporaryPassword
      );

      // Manda o email de fato (assincrono, então não espera)
      await sendEmail({
        to: data.email,
        subject: `Credenciais de Acesso - ${position}`,
        text: `Olá ${data.full_name},\n\nSua senha temporária é: ${temporaryPassword}`,
        html: htmlContent,
      });

      return true;
    } catch (error) {
      // Se der erro no envio, só loga e continua (não quebra o cadastro)
      console.error("EmailSendingError:", error);
      return false;
    }
  }

  // Traduz o tipo técnico do cargo pra um nome bonito que a gente entende

  private getPositionTitle(type: PersonType): string {
    // Usamos Partial<Record<...>> para dizer que o mapa pode não ter todas as chaves
    const positionMap: Partial<Record<PersonType, string>> = {
      [PersonType.coordinator]: "Coordenador(a)",
      [PersonType.employee]: "Funcionário(a)",
      [PersonType.inspector]: "Inspetor(a)",
    };

    // Verificamos se o tipo está no mapa
    if (type in positionMap) {
      // Fazemos uma asserção de tipo para string (pois sabemos que existe)
      return positionMap[type] as string;
    }

    return "Usuário";
  }

  // Monta o HTML do email de boas-vindas, com as credenciais

  private generateEmailHtml(
    fullName: string,
    position: string,
    email: string,
    tempPassword: string
  ): string {
    // HTML do email, com estilos inline pra funcionar na maioria dos clientes
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #2563eb;">Credenciais de Acesso</h2>
        <p>Olá ${fullName},</p>
        <p>Seu cadastro como <strong>${position}</strong> foi realizado com sucesso.</p>
        
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>E-mail:</strong> ${email}</p>
          <p style="margin: 5px 0 0;"><strong>Senha Temporária:</strong> ${tempPassword}</p>
        </div>
        
        <p><strong>Instruções:</strong></p>
        <ol>
          <li>Acesse o sistema usando estas credenciais</li>
          <li>Altere sua senha imediatamente após o primeiro login</li>
          <li>Mantenha suas credenciais em local seguro</li>
        </ol>
        
        <p>Atenciosamente,<br>Equipe de Controle de Acesso Biométrico</p>
      </div>
    `;
  }

  // Monta a resposta que vai voltar pro front, com os dados da pessoa e se o email foi enviado

  private buildResponse(person: any, emailSent: boolean) {
    // Monta a mensagem: se enviou email, avisa; se não, só o cadastro
    return {
      id: person.id,
      full_name: person.full_name,
      email: person.email,
      type: person.type,
      created_at: person.created_at.toISOString(),
      temporary_password_sent: emailSent,
      message:
        "Pessoa cadastrada com sucesso" + (emailSent ? " e email enviado" : ""),
    };
  }
}
