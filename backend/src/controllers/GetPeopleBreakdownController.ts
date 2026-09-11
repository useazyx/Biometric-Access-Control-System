import type { FastifyReply, FastifyRequest } from "fastify"
import { GetPeopleBreakdownService } from "../services/GetPeopleBreakdownService"

export class GetPeopleBreakdownController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const service = new GetPeopleBreakdownService()
      const breakdown = await service.execute()
      return reply.status(200).send({ breakdown })
    } catch (error: any) {
      return reply.status(500).send({ error: "Erro ao carregar distribuição de pessoas" })
    }
  }
}