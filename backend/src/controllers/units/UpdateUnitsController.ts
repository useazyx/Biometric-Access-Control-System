/**
 * UpdateUnitsController.ts - Cuida da atualização dos dados de uma unidade
 * # Pra que serve?
 * - Receber o ID da unidade e os campos que mudaram
 * - Mandar pro serviço atualizar e traduzir o erro dele pra resposta HTTP
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.1.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-10-21): Implementação inicial
 * - v1.1.0 (2026-09-09): Tipagem do unit_type corrigida (era string solta e não compilava),
 *                        e o cabeçalho ficou no padrão dos outros controllers
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import type { UnitType } from "@prisma/client"
import { UpdateUnitsService } from "../../services/units/UpdateUnitsService"

// O ID vem na URL (ex: PATCH /units/3)
interface UpdateUnitsParams {
  id: string
}

// Só o que a pessoa quer mudar precisa vir no corpo
interface UpdateUnitsBody {
  name?: string
  unit_type?: UnitType
  address?: string
  phone?: string
  is_extension?: boolean
}

export class UpdateUnitsController {
  // Processa o pedido de atualização de uma unidade
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as UpdateUnitsParams
    const body = request.body as UpdateUnitsBody

    // Confere se o ID da URL é um número de verdade
    const unit_id = Number.parseInt(id)
    if (!unit_id || Number.isNaN(unit_id)) {
      return reply.status(400).send({
        error: "InvalidUnitId",
        message: "ID da unidade inválido",
      })
    }

    try {
      // Manda o serviço atualizar (ele que decide quais campos realmente mudaram)
      const service = new UpdateUnitsService()
      const updatedUnit = await service.execute({ unit_id, ...body })

      return reply.status(200).send({
        message: "Unidade atualizada com sucesso",
        updated_unit: updatedUnit,
      })
    } catch (error: any) {
      return this.handleServiceError(error, reply)
    }
  }

  // Traduz o erro que veio do serviço pra uma resposta que o front entende
  private handleServiceError(error: any, reply: FastifyReply) {
    console.error("Deu ruim na atualização da unidade:", error)

    switch (error.message) {
      case "Unidade não encontrada":
        return reply.status(404).send({
          error: "UnitNotFound",
          message: "Unidade não encontrada",
        })
      case "Nenhum dado válido fornecido para atualização":
        return reply.status(400).send({
          error: "NothingToUpdate",
          message: "Você não mandou nenhum campo pra atualizar",
        })
      default:
        return reply.status(400).send({
          error: "UpdateUnitError",
          message: "Erro ao atualizar unidade",
        })
    }
  }
}
