import type { FastifyReply, FastifyRequest } from "fastify"
import { ListBiometricsService } from "../../services/biometrics/ListBiometricsService"

export class ListBiometricsController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as {
        unit_code: string
        page?: string
        page_size?: string
      }

      const unit_code = query?.unit_code
      const page = Number.parseInt(query?.page || "1")
      const page_size = Number.parseInt(query?.page_size || "20")

      console.log("[v0] ListBiometricsController - Query params:", { unit_code, page, page_size })

      if (!unit_code) {
        return reply.status(400).send({
          error: "unit_code é obrigatório",
          tip: "Inclua unit_code como parâmetro de query",
        })
      }

      const service = new ListBiometricsService()
      const result = await service.execute({
        unit_code,
        page,
        page_size,
      })

      return reply.status(200).send({
        biometrics: result.biometrics,
        total: result.total,
        current_page: result.current_page,
        total_pages: result.total_pages,
      })
    } catch (error: any) {
      if (error.message === "Unidade não encontrada") {
        return reply.status(404).send({
          error: "Unidade não encontrada",
          tip: "Confere o código da unidade, tá certo?",
        })
      }

      console.error("[v0] ListBiometricsController error:", error.message, error.stack)
      return reply.status(500).send({
        error: "Opa, não consegui listar as biometrias!",
        solution: "Verifica os filtros ou tenta de novo mais tarde",
      })
    }
  }
}
