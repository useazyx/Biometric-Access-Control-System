/**
 * DeleteUnitsController.ts - Cuida da exclusão de uma unidade
 * # Pra que serve?
 * - Receber o ID da unidade que vai ser apagada
 * - Barrar a exclusão quando ainda tem gente cadastrada na unidade
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.1.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-10-21): Implementação inicial
 * - v1.1.0 (2026-09-09): Cabeçalho e formato de erro no padrão dos outros controllers
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { DeleteUnitsService } from "../../services/units/DeleteUnitsService"

// O ID vem na URL (ex: DELETE /units/3)
interface DeleteUnitsParams {
  id: string
}

export class DeleteUnitsController {
  // Processa o pedido de exclusão de uma unidade
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as DeleteUnitsParams

    // Confere se o ID da URL é um número de verdade
    const unit_id = Number.parseInt(id)
    if (!unit_id || Number.isNaN(unit_id)) {
      return reply.status(400).send({
        error: "InvalidUnitId",
        message: "ID da unidade inválido",
      })
    }

    try {
      const service = new DeleteUnitsService()
      const result = await service.execute(unit_id)

      return reply.status(200).send(result)
    } catch (error: any) {
      return this.handleServiceError(error, reply)
    }
  }

  // Traduz o erro que veio do serviço pra uma resposta que o front entende
  private handleServiceError(error: any, reply: FastifyReply) {
    console.error("Deu ruim na exclusão da unidade:", error)

    switch (error.message) {
      case "Unidade não encontrada":
        return reply.status(404).send({
          error: "UnitNotFound",
          message: "Unidade não encontrada",
        })
      // 409 (conflito) porque não é erro de quem pediu: a unidade só não pode sair ainda
      case "Não é possível excluir unidade com pessoas cadastradas":
        return reply.status(409).send({
          error: "UnitNotEmpty",
          message: "Não é possível excluir unidade com pessoas cadastradas",
        })
      default:
        return reply.status(400).send({
          error: "DeleteUnitError",
          message: "Erro ao excluir unidade",
        })
    }
  }
}
