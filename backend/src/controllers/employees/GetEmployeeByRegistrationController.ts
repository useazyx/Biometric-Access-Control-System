/**
 * GetEmployeeByRegistrationController.ts - Busca CPF por matrícula
 */

import { FastifyReply, FastifyRequest } from "fastify"
import { GetEmployeeByRegistrationService } from "../../services/employees/GetEmployeeByRegistrationService"

export class GetEmployeeByRegistrationController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as { registration_number: string }

    if (!body.registration_number) {
      return reply.status(400).send({
        error: "Matrícula é obrigatória",
      })
    }

    try {
      const service = new GetEmployeeByRegistrationService()
      const result = await service.execute({
        registration_number: body.registration_number,
      })

      return reply.status(200).send(result)
    } catch (error: any) {
      if (error.message === "Funcionário não encontrado" || error.message === "Pessoa não encontrada para este funcionário") {
        return reply.status(404).send({
          error: error.message,
        })
      }

      return reply.status(400).send({
        error: "Erro ao buscar funcionário",
      })
    }
  }
}

