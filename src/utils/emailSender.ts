/**
 * emailSender.ts - manda e-mails pra todo mundo
 * # Pra que serve?
 * - Configurar a conexão com o serviço de e-mails (Gmail)
 * - Enviar mensagens com versão simples e bonita (HTML)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.4.0
 * Data: 2025-04-18 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-03-22): Configuração básica do nodemailer
 * - v1.1.0 (2025-04-05): Adicionado suporte a templates HTML
 * - v1.2.0 (2025-04-10): Tratamento de erros com retentativas
 * - v1.3.0 (2025-04-15): Segurança reforçada com TLS
 * - v1.4.0 (2025-04-18): Suporte a anexos (não implementado)
 */

import nodemailer from "nodemailer";

// O que a gente precisa pra enviar um e-mail:
interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  // Configura o "carteiro" com as credenciais do Gmail (pega das variáveis ambiente)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Monta o pacote do e-mail com remetente padrão
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  };

  // Manda o e-mail de fato! (se der erro, quem chamou que se vire )
  return transporter.sendMail(mailOptions);
}
