/**
 * UpdateVisitorController.ts - Cuida da atualização dos dados de um visitante
 * # Pra que serve?
 * - Receber o ID do visitante e os campos que mudaram
 * - Mandar pro serviço atualizar e traduzir o erro dele pra resposta HTTP
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.1.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-10-21): Implementação inicial
 * - v1.1.0 (2026-09-09): Cabeçalho e formato de erro no padrão dos outros controllers
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { UpdateVisitorService } from "../../services/visitors/UpdateVisitorService"

// O ID vem na URL (ex: PATCH /visitors/7) e é o ID do Visitor, não o da Person
interface UpdateVisitorParams {
  id: string
}

// Só o que a pessoa quer mudar precisa vir no corpo
interface UpdateVisitorBody {
  company?: string
  visit_reason?: string
  registration_date?: string
  visit_expiry_date?: string | null
  responsible_employee_id?: number | null
}

export class UpdateVisitorController {
  // Processa o pedido de atualização de um visitante
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as UpdateVisitorParams
    const body = request.body as UpdateVisitorBody

    // Confere se o ID da URL é um número de verdade
    const visitor_id = Number.parseInt(id)
    if (!visitor_id || Number.isNaN(visitor_id)) {
      return reply.status(400).send({
        error: "InvalidVisitorId",
        message: "ID do visitante inválido",
      })
    }

    try {
      const service = new UpdateVisitorService()
      const updatedVisitor = await service.execute({ visitor_id, ...body })

      return reply.status(200).send({
        message: "Visitante atualizado com sucesso",
        updated_visitor: updatedVisitor,
      })
    } catch (error: any) {
      return this.handleServiceError(error, reply)
    }
  }

  // Traduz o erro que veio do serviço pra uma resposta que o front entende
  private handleServiceError(error: any, reply: FastifyReply) {
    console.error("Deu ruim na atualização do visitante:", error)

    switch (error.message) {
      case "Visitante não encontrado":
        return reply.status(404).send({
          error: "VisitorNotFound",
          message: "Visitante não encontrado",
        })
      case "Nenhum dado válido fornecido para atualização":
        return reply.status(400).send({
          error: "NothingToUpdate",
          message: "Você não mandou nenhum campo pra atualizar",
        })
      default:
        return reply.status(400).send({
          error: "UpdateVisitorError",
          message: "Erro ao atualizar visitante",
        })
    }
  }
}
