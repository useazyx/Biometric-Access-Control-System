/**
 * DeleteBiometricController.ts - Cuida da remoção de digitais do sistema
 * # Pra que serve?
 * - Processa os pedidos pra apagar uma digital cadastrada
 * - Gerencia as respostas (sucesso ou erro) do processo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.4.0
 * Data: 2025-06-18 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-06-15): Remoção básica de digitais
 * - v1.1.0 (2025-06-16): Validação de permissões
 * - v1.2.0 (2025-06-17): Registro de atividades
 * - v1.3.0 (2025-06-18): Confirmação em duas etapas
 * - v1.4.0 (2025-07-20): Recebe parâmetros via JSON body
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { DeleteBiometricService } from "../../services/biometrics/DeleteBiometricService";
import { Finger } from "@prisma/client";

// Cuida da parte de remover digitais (quando o usuário precisa deletar um cadastro)
export class DeleteBiometricController {
  // Processa o pedido de exclusão de uma digital (rota que o sistema chama quando precisa remover)

  async handle(request: FastifyRequest, reply: FastifyReply) {
    // Pega os parâmetros do corpo da requisição (JSON body):
    const body = request.body as {
      cpf: string;
      finger: Finger;
    };

    const cpf = body?.cpf;
    const finger = body?.finger;

    // Primeiro: verifica se veio CPF e dedo (se faltar, nem tenta)
    if (!cpf || !finger) {
      return reply.status(400).send({
        error: "MissingParameters",
        message: "Faltou coisa! Precisa do CPF e do dedo pra remover",
      });
    }

    try {
      // Manda o serviço apagar a digital
      const service = new DeleteBiometricService();
      const result = await service.execute(cpf, finger);

      // Se deu certo, avisa que removeu
      return reply.status(200).send(result);
    } catch (error: any) {
      // Se deu erro, vê qual foi e manda a resposta certa
      switch (error.message) {
        case "Pessoa não encontrada":
          // CPF não tá cadastrado no sistema
          return reply.status(404).send({
            error: "Pessoa não encontrada",
            tip: "Confere esse CPF aí, não achamos ninguém",
          });
        case "Biometria não encontrada para este dedo":
          // A digital desse dedo específico não existe
          return reply.status(404).send({
            error: "Digital não encontrada",
            tip: "Esse dedo já foi removido ou nunca foi cadastrado?",
          });
        default:
          // Qualquer outro erro inesperado
          return reply.status(400).send({
            error: "Opa, deu ruim na remoção!",
            details: "Tenta de novo ou fala com o suporte",
          });
      }
    }
  }
}