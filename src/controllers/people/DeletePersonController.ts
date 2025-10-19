/**
 * DeletePersonController.ts - Cuida da remoção de pessoas do sistema
 * # Pra que serve?
 * - Processa os pedidos pra remover alguém do sistema (aluno, professor, etc.)
 * - Gerencia as respostas e possíveis erros desse processo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.4.0
 * Data: 2025-07-19 (Recebe CPF via JSON body)
 * Alterações:
 * - v1.4.0 (2025-07-19): Agora recebe CPF via JSON body
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { DeletePersonService } from "../../services/people/DeletePersonService";

export class DeletePersonController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as { cpf: string };
    const cpf = body?.cpf;

    if (!cpf) {
      return reply.status(400).send({
        error: "MissingCPF",
        message: "Opa, faltou o CPF! Sem ele não sabemos quem remover",
      });
    }

    try {
      const service = new DeletePersonService();
      const result = await service.execute(cpf);

      return reply.status(200).send({
        message: "✅ Pessoa removida com sucesso",
        details: result,
      });
    } catch (error: any) {
      console.error("ERRO FINAL:", error);
      
      if (error.message.includes("Pessoa não encontrada")) {
        return reply.status(404).send({
          error: "Pessoa não encontrada",
          tip: `Confira o CPF: ${cpf}`,
        });
      }
      
      if (error.message.includes("Restrição de chave estrangeira")) {
        return reply.status(409).send({
          error: "Registro vinculado bloqueando exclusão",
          message: error.message,
          solution: "Verifique os registros relacionados"
        });
      }
      
      // Log mais detalhado para o desenvolvedor
      console.error("ERRO TÉCNICO:", error);
      
      return reply.status(500).send({
        error: "Opa, não consegui remover!",
        solution: "Tente novamente ou contate o suporte",
        technicalDetails: process.env.NODE_ENV === "development" 
          ? error.message 
          : "Ative o modo desenvolvimento para detalhes"
      });
    }
  }
}