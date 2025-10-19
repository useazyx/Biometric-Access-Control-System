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
import crypto from "crypto";

// O que precisamos pra solicitar reset de senha:
interface ForgotPasswordProps {
  email: string;
}

// Serviço que cuida do "esqueci minha senha" - gera token e manda email

export class ForgotPasswordService {
  // Processa a solicitação de reset de senha

  async execute({ email }: ForgotPasswordProps) {
    // 1. Busca o usuário e verifica se ele existe
    const person = await this.getValidPerson(email);
    // 2. Checa se ele pode mesmo solicitar reset (depende do tipo de conta)
    this.validatePersonType(person.type);
    // 3. Gera um token único de 6 dígitos
    const resetToken = this.generateResetToken();
    // 4. Salva o token no banco com prazo de validade
    await this.saveResetToken(person.id, resetToken);
    // 5. Manda o email com o token
    await this.sendResetEmail(person.email, person.full_name, resetToken);

    return {
      message: "Token de reset enviado para seu email",
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

  // Gera um token de 6 dígitos aleatório

  private generateResetToken(): string {
    // Gera um número aleatório de 6 dígitos (100000 a 999999)
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Salva o token no banco com prazo de validade de 30 minutos

  private async saveResetToken(personId: number, token: string) {
    // Calcula quando o token vai expirar (30 minutos a partir de agora)
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 30);

    // Salva o token no banco
    await prisma.token.create({
      data: {
        token,
        expiration,
        person_id: personId,
        used: false,
      },
    });
  }

  // Manda o email com o token de reset

  private async sendResetEmail(
    email: string,
    fullName: string,
    resetToken: string
  ) {
    try {
      // Monta o HTML do email
      const htmlContent = this.generateResetEmailHtml(fullName, resetToken);

      // Manda o email
      await sendEmail({
        to: email,
        subject: "Reset de Senha - Sistema Biométrico",
        text: `Olá ${fullName},\n\nSeu código de reset é: ${resetToken}\n\nEste código expira em 30 minutos.`,
        html: htmlContent,
      });
    } catch (error) {
      console.error("Erro ao enviar email de reset:", error);
      throw new Error("Erro ao enviar email de reset");
    }
  }

  // Monta o HTML do email de reset

  private generateResetEmailHtml(fullName: string, resetToken: string): string {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #dc2626;">Reset de Senha</h2>
        <p>Olá ${fullName},</p>
        <p>Você solicitou um reset de senha para sua conta no sistema biométrico.</p>
        
        <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 0; font-size: 18px;"><strong>Código de Reset:</strong></p>
          <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #dc2626;">${resetToken}</p>
        </div>
        
        <p><strong>Instruções:</strong></p>
        <ol>
          <li>Use este código na tela de reset de senha</li>
          <li>O código expira em <strong>30 minutos</strong></li>
          <li>Se não foi você quem solicitou, ignore este email</li>
        </ol>
        
        <p style="color: #6b7280; font-size: 14px;">
          Se você não solicitou este reset, sua conta permanece segura. 
          Você pode ignorar este email.
        </p>
        
        <p>Atenciosamente,<br>Equipe de Controle de Acesso Biométrico</p>
      </div>
    `;
  }
}

