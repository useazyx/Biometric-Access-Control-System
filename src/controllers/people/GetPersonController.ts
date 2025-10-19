/**
 * GetPersonController.ts - Busca os dados de uma pessoa no sistema pelo CPF
 * # Pra que serve?
 * - Pega as informações de alguém (aluno, professor, etc.) usando o CPF
 * - Gerencia as respostas (encontrou ou não) e trata erros
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.3.0
 * Data: 2025-07-17 (Atualizado)
 * Alterações:
 * - v1.0.0 (2025-05-15): Implementação inicial de busca
 * - v1.1.0 (2025-05-20): Suporte a dados relacionados (estudante/funcionário)
 * - v1.2.0 (2025-05-28): Cache de consultas frequentes
 * - v1.3.0 (2025-07-17): Alteração para receber CPF via JSON body
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { GetPersonService } from "../../services/people/GetPersonService";

// Cuida da parte de buscar dados de pessoas (tipo quando você quer ver o perfil de alguém)
export class GetPersonController {
  //  Processa o pedido de busca (rota que o sistema chama pra consultar alguém)

  async handle(request: FastifyRequest, reply: FastifyReply) {
    // Pega o CPF do corpo da requisição (agora via JSON)
    const { cpf } = request.body as { cpf: string };

    // Se não veio CPF, nem tenta! (afinal, precisa saber quem procurar)
    if (!cpf) {
      return reply.status(400).send({
        error: "MissingCPF",
        message: "Opa, faltou o CPF! Sem ele não sabemos quem buscar",
      });
    }

    try {
      // Manda o serviço buscar a pessoa no banco de dados (ele que faz a pesquisa)
      const service = new GetPersonService();
      const result = await service.execute(cpf);

      // Se achou, manda os dados completos da pessoa
      return reply.status(200).send(result);
    } catch (error: any) {
      // Se deu erro, vê qual foi e manda a resposta certinha
      if (error.message === "Pessoa não encontrada") {
        // CPF não tá cadastrado no sistema
        return reply.status(404).send({
          error: "Pessoa não encontrada",
          tip: "Confere esse CPF aí, não achamos ninguém com ele",
        });
      }

      // Se foi outro erro (banco, rede, etc.), loga e manda resposta genérica
      console.error("Deu ruim na busca:", error);
      return reply.status(400).send({
        error: "Opa, não consegui buscar!",
        solution: "Tenta de novo ou fala com o suporte técnico",
      });
    }
  }
}