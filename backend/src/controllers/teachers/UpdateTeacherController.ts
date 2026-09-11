/**
 * UpdateTeacherController.ts - Cuida da atualização dos dados de um professor
 * # Pra que serve?
 * - Receber o ID do professor e os campos que mudaram (matérias, onde pode dar aula)
 * - Mandar pro serviço atualizar e traduzir o erro dele pra resposta HTTP
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.1.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-10-21): Implementação inicial
 * - v1.1.0 (2026-09-09): Cabeçalho e formato de erro no padrão dos outros controllers
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { UpdateTeacherService } from "../../services/teachers/UpdateTeacherService"

// O ID vem na URL (ex: PATCH /teachers/4) e é o ID do Teacher, não o do Employee
interface UpdateTeacherParams {
  id: string
}

// Só o que a pessoa quer mudar precisa vir no corpo
interface UpdateTeacherBody {
  subjects?: string[]
  can_teach_fatec?: boolean
  can_teach_etec?: boolean
}

export class UpdateTeacherController {
  // Processa o pedido de atualização de um professor
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as UpdateTeacherParams
    const body = request.body as UpdateTeacherBody

    // Confere se o ID da URL é um número de verdade
    const teacher_id = Number.parseInt(id)
    if (!teacher_id || Number.isNaN(teacher_id)) {
      return reply.status(400).send({
        error: "InvalidTeacherId",
        message: "ID do professor inválido",
      })
    }

    try {
      const service = new UpdateTeacherService()
      const updatedTeacher = await service.execute({ teacher_id, ...body })

      return reply.status(200).send({
        message: "Professor atualizado com sucesso",
        updated_teacher: updatedTeacher,
      })
    } catch (error: any) {
      return this.handleServiceError(error, reply)
    }
  }

  // Traduz o erro que veio do serviço pra uma resposta que o front entende
  private handleServiceError(error: any, reply: FastifyReply) {
    console.error("Deu ruim na atualização do professor:", error)

    switch (error.message) {
      case "Professor não encontrado":
        return reply.status(404).send({
          error: "TeacherNotFound",
          message: "Professor não encontrado",
        })
      case "Nenhum dado válido fornecido para atualização":
        return reply.status(400).send({
          error: "NothingToUpdate",
          message: "Você não mandou nenhum campo pra atualizar",
        })
      default:
        return reply.status(400).send({
          error: "UpdateTeacherError",
          message: "Erro ao atualizar professor",
        })
    }
  }
}
