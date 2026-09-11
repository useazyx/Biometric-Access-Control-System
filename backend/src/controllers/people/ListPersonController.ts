/**
 * ListPersonController.ts - Busca listas de pessoas com filtros e paginação
 * # Pra que serve?
 * - Lista alunos, professores e outros cadastrados com opções de busca
 * - Gerencia paginação pra não sobrecarregar o sistema com muitos dados
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.4.0
 * Data: 2025-07-05 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-06-20): Paginação básica
 * - v1.1.0 (2025-06-25): Filtros avançados por tipo e unidade
 * - v1.2.0 (2025-07-01): Ordenação personalizável
 * - v1.3.0 (2025-07-05): Otimização de desempenho
 * - v1.4.0 (2025-07-20): Recebe parâmetros via JSON body
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { ListPersonService } from "../../services/people/ListPersonService"
import type { PersonType } from "@prisma/client"

// Cuida da parte de listar pessoas (tipo quando você quer ver todos de uma turma ou unidade)
export class ListPersonController {
  // Processa o pedido de listagem (rota que o front chama pra buscar várias pessoas)

  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as {
        unit_code: string
        type?: PersonType
        search?: string
        page?: string
        page_size?: string
      }

      const unit_code = query?.unit_code
      const type = query?.type
      // Vem vazio quando a pessoa limpa o campo: nesse caso é "sem busca"
      const search = query?.search?.trim() || undefined
      const page = Number.parseInt(query?.page || "1")
      const page_size = Number.parseInt(query?.page_size || "20")

      // Manda o serviço buscar as pessoas com esses filtros
      const service = new ListPersonService()
      const result = await service.execute({
        unit_code,
        type,
        search,
        page,
        page_size,
      })

      // Retorna a lista paginada pro front
      return reply.status(200).send({
        ...result,
        message: `Encontramos ${result.total} pessoas! 📋`,
      })
    } catch (error: any) {
      // Se a unidade não foi encontrada (código errado ou não existe)
      if (error.message === "Unidade não encontrada") {
        return reply.status(404).send({
          error: "Unidade não encontrada",
          tip: "Confere o código da unidade, tá certo?",
        })
      }

      // Qualquer outro erro (validação, banco, etc.)
      console.error("Deu ruim na listagem:", error)
      return reply.status(400).send({
        error: "Opa, não consegui listar as pessoas!",
        solution: "Verifica os filtros ou tenta de novo mais tarde",
      })
    }
  }
}
