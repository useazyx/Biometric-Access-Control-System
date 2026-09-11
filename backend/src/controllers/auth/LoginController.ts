/**
 * LoginController.ts - Cuida da parte de login do sistema
 * # Pra que serve?
 * - Recebe as tentativas de login e verifica se tão certas
 * - Manda pro front o token de acesso e os dados do usuário quando dá certo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.4.0
 * Data: 2025-05-18 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-04-05): Autenticação básica
 * - v1.1.0 (2025-04-12): Adicionado JWT
 * - v1.2.0 (2025-04-18): Controle de sessões ativas
 * - v1.3.0 (2025-05-05): Suporte a senhas temporárias
 * - v1.4.0 (2025-05-18): Proteção contra brute-force
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { LoginService } from "../../services/auth/LoginService";
import { PersonType } from "@prisma/client";

// Como a resposta de login deve ser? (o que a gente manda de volta pro front)
interface LoginResponse {
  token: string;
  person: {
    id: number;
    full_name: string;
    type: PersonType;
    email: string;
    unit_id: number;
  };
  requires_password_change: boolean;
  access_log_id: number;
}

// Cuida de todo o processo de login (desde receber a requisição até responder)
export class LoginController {
  // Processa a tentativa de login (rota que o front chama quando o usuário tenta entrar)

  async handle(req: FastifyRequest, rep: FastifyReply) {
    // Pega o email e senha que o usuário digitou
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    // Tenta descobrir de qual dispositivo tá tentando entrar (pelo cabeçalho)
    const deviceInfo = req.headers["user-agent"] || "Dispositivo Desconhecido";

    try {
      // Manda autenticar o usuário (vai no banco ver se as credenciais tão certas)
      const result = await this.authenticateUser(email, password, deviceInfo);

      // Se deu tudo certo, manda a resposta de sucesso
      return this.sendSuccessResponse(rep, result);
    } catch (error: any) {
      // Se deu erro, trata de um jeito que o front entenda
      this.handleLoginError(error, rep);
    }
  }

  // Chama o serviço de login pra fazer a autenticação pesada (ele que fala com o banco)
  private async authenticateUser(
    email: string,
    password: string,
    deviceInfo: string
  ) {
    const loginService = new LoginService();
    return await loginService.execute({ email, password, deviceInfo });
  }

  // Monta a resposta de sucesso no formato que o front espera
  private sendSuccessResponse(rep: FastifyReply, result: any) {
    return rep.send({
      token: result.token,
      person: {
        id: result.person.id,
        full_name: result.person.full_name,
        type: result.person.type,
        email: result.person.email,
        unit_id: result.person.registration_unit_id,
      },
      requires_password_change: result.requires_password_change,
      access_log_id: result.access_log_id,
    } as LoginResponse);
  }

  // Trata os erros que podem acontecer no login (e manda a resposta adequada)
  private handleLoginError(error: any, rep: FastifyReply) {
    console.error("Deu ruim no login:", error);

    // Lista de erros que a gente conhece e sabe como tratar (com respostas amigáveis)
    const errorMappings = [
      {
        message: "Credenciais inválidas",
        handler: () =>
          rep.status(401).send({
            error: "Unauthorized",
            message: "E-mail ou senha incorretos",
          }),
      },
      {
        message: "Acesso restrito à coordenação e funcionários",
        handler: () =>
          rep.status(403).send({
            error: "Forbidden",
            message: "Seu tipo de usuário não tem acesso ao sistema",
          }),
      },
      {
        message: "Conta de funcionário desativada",
        handler: () =>
          rep.status(403).send({
            error: "AccountDisabled",
            message: "Sua conta está desativada",
          }),
      },
      {
        message: "Usuário não possui senha definida",
        handler: () =>
          rep.status(403).send({
            error: "NoPasswordSet",
            message: "Conta não configurada para acesso ao sistema",
          }),
      },
    ];

    // Procura se o erro é um desses que a gente conhece
    for (const mapping of errorMappings) {
      if (error.message === mapping.message) {
        return mapping.handler();
      }
    }

    // Se é um erro que a gente não conhece, manda um genérico (500)
    return rep.status(500).send({
      error: "InternalServerError",
      message:
        "Opa, deu um erro inesperado no login! Tenta de novo mais tarde!",
    });
  }
}
