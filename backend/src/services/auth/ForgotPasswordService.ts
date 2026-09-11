/**
 * ForgotPasswordService.ts - Gera tokens de reset de senha e envia por email
 * # Pra que serve?
 * - Criar tokens temporários para reset de senha
 * - Enviar email com instruções de reset
 * - Validar se o usuário pode solicitar reset
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2025-07-25 (Criado)
 * Alterações:
 * - v1.0.0 (2025-07-25): Implementação inicial do serviço
 */

import { prisma } from "../../config/prisma";
import { sendEmail } from "../../utils/emailSender";
import { PersonType } from "@prisma/client";
import { generateTemporaryPassword } from "../../utils/passwordGenerator";

// O que precisamos pra solicitar reset de senha:
interface ForgotPasswordProps {
  email: string;
}

// Serviço que cuida do "esqueci minha senha" - gera token e manda email

export class ForgotPasswordService {
  // Processa a solicitação de reset de senha

  async execute({ email }: ForgotPasswordProps) {
    const person = await this.getValidPerson(email);
    this.validatePersonType(person.type);

    const temporaryPassword = generateTemporaryPassword();

    await prisma.person.update({
      where: { id: person.id },
      data: {
        system_access_hash: null,
        temporary_password: temporaryPassword,
        password_reset_at: null,
      },
    });

    await this.sendTemporaryPasswordEmail(
      person.email,
      person.full_name,
      temporaryPassword
    );

    return {
      message: "Senha temporária enviada para seu email",
      email: person.email,
    };
  }

  // Pega o usuário do banco e verifica se existe

  private async getValidPerson(email: string) {
    const person = await prisma.person.findUnique({
      where: { email },
    });

    // Se não achou, não tem usuário com esse email
    if (!person) {
      throw new Error("Usuário não encontrado");
    }
    return person;
  }

  // Verifica se o tipo de usuário pode solicitar reset de senha

  private validatePersonType(personType: PersonType) {
    // Quem pode solicitar reset: funcionários, coordenadores e inspetores
    const allowedTypes: PersonType[] = [
      PersonType.employee,
      PersonType.coordinator,
      PersonType.inspector,
    ];

    // Se o tipo não tiver na lista, barra na hora
    if (!allowedTypes.includes(personType)) {
      throw new Error("Seu tipo de usuário não permite reset de senha");
    }
  }

  private async sendTemporaryPasswordEmail(
    email: string,
    fullName: string,
    temporaryPassword: string
  ) {
    try {
      const htmlContent = this.generateTemporaryPasswordEmailHtml(
        fullName,
        temporaryPassword
      );
      await sendEmail({
        to: email,
        subject: "Senha Temporária - Sistema Biométrico",
        text: `Olá ${fullName},\n\nSua nova senha temporária é: ${temporaryPassword}\n\nUse-a para entrar e depois troque em Configurações (Trocar Senha).`,
        html: htmlContent,
      });
    } catch (error) {
      console.error("Erro ao enviar email de senha temporária:", error);
      throw new Error("Erro ao enviar email de senha temporária");
    }
  }

  // Monta o HTML do email de reset

  private generateTemporaryPasswordEmailHtml(
    fullName: string,
    temporaryPassword: string
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #1f2937;">Senha Temporária</h2>
        <p>Olá ${fullName},</p>
        <p>Você solicitou recuperação de acesso. Geramos uma <strong>senha temporária</strong> para você entrar no sistema.</p>
        
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1f2937;">
          <p style="margin: 0; font-size: 18px;"><strong>Senha Temporária:</strong></p>
          <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #111827;">${temporaryPassword}</p>
        </div>
        
        <p><strong>Instruções:</strong></p>
        <ol>
          <li>Use esta senha para fazer login em <code>http://localhost:8081</code></li>
          <li>Após entrar, acesse <strong>Configurações</strong> e use <strong>Trocar Senha</strong> para definir sua senha definitiva</li>
          <li>Se não foi você quem solicitou, ignore este email</li>
        </ol>
        
        <p style="color: #6b7280; font-size: 14px;">
          Se você não solicitou esta recuperação, sua conta permanece segura. 
          Você pode ignorar este email.
        </p>
        
        <p>Atenciosamente,<br>Equipe de Controle de Acesso Biométrico</p>
      </div>
    `;
  }
}

