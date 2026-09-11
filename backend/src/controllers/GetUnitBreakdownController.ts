import type { FastifyReply, FastifyRequest } from "fastify"
import { GetUnitBreakdownService } from "../services/GetUnitBreakdownService"

export class GetUnitBreakdownController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const service = new GetUnitBreakdownService()
      const breakdown = await service.execute()
      return reply.status(200).send({ breakdown })
    } catch (error: any) {
      return reply.status(500).send({ error: "Erro ao carregar estatísticas de unidades" })
    }
  }
}