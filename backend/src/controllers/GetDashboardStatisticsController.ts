/**
 * GetDashboardStatisticsController.ts - Retorna estatísticas para o dashboard
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { GetDashboardStatisticsService } from "../services/GetDashboardStatisticsService"

export class GetDashboardStatisticsController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const service = new GetDashboardStatisticsService()
      const statistics = await service.execute()

      return reply.status(200).send({
        statistics,
        message: "Estatísticas carregadas com sucesso",
      })
    } catch (error: any) {
      console.error("[v0] Dashboard controller error:", error.message)
      return reply.status(500).send({
        error: "Erro ao carregar estatísticas",
        message: error.message,
      })
    }
  }
}
