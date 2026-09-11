/**
 * ListRolesController.ts - Lista todos os cargos disponíveis
 * # Pra que serve?
 * - Buscar todos os cargos cadastrados no sistema
 * - Retornar a lista pro front usar em selects
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2025-01-22 (Criado)
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { prisma } from "../../config/prisma"

export class ListRolesController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Busca todos os cargos ordenados por nível de permissão, excluindo Administrador e Diretor
      const roles = await prisma.role.findMany({
        where: {
          name: {
            notIn: ["Administrador", "Diretor"],
          },
        },
        select: {
          id: true,
          name: true,
          permission_level: true,
          description: true,
        },
        orderBy: {
          permission_level: "desc",
        },
      })

      return reply.status(200).send({
        roles,
        total: roles.length,
      })
    } catch (error: any) {
      console.error("ListRolesError:", error)
      return reply.status(500).send({
        error: "InternalServerError",
        message: "Erro ao buscar cargos",
      })
    }
  }
}
