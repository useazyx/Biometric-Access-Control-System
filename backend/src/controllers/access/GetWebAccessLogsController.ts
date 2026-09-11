import type { FastifyReply, FastifyRequest } from "fastify"
import { GetWebAccessLogsService, type WebFilters } from "../../services/access/GetWebAccessLogsService"
import type { EventType } from "@prisma/client"

export class GetWebAccessLogsController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    try {
      const service = new GetWebAccessLogsService()
      const query = req.query as any

      console.log("[v0] GetWebAccessLogsController - Query params:", query)

      const parseDate = (dateStr: string | undefined): Date | undefined => {
        if (!dateStr) return undefined
        if (dateStr.includes("T")) return new Date(dateStr)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return new Date(`${dateStr}T00:00:00.000Z`)
        }
        return new Date(dateStr)
      }

      const filters: WebFilters = {
        unit_id: query.unit_id ? Number.parseInt(query.unit_id) : undefined,
        cpf: query.cpf,
        start_date: query.start_date ? parseDate(query.start_date) : undefined,
        end_date: query.end_date ? parseDate(query.end_date) : undefined,
        event_type: query.event_type as EventType,
        page: query.page ? Number.parseInt(query.page) : 1,
        page_size: query.page_size ? Number.parseInt(query.page_size) : 20,
      }

      const result = await service.execute(filters)

      const logsFormatted = result.logs.map((log: any) => ({
        id: log.id,
        login_time: log.login_time instanceof Date ? log.login_time.toISOString() : String(log.login_time),
        logout_time: log.logout_time instanceof Date ? log.logout_time.toISOString() : log.logout_time,
        session_duration_minutes: log.session_duration_minutes,
        event_type: log.event_type,
        person_id: log.person_id,
        person: log.person
          ? {
              full_name: log.person.full_name,
              cpf: log.person.cpf,
              type: log.person.type,
            }
          : null,
        unit_id: log.unit_id,
        unit: log.unit || {
          name: "",
          unit_code: "",
        },
      }))

      return rep.send({
        logs: logsFormatted,
        total_items: result.total_items,
        total_pages: result.total_pages,
        current_page: result.current_page,
        page_size: result.page_size,
      })
    } catch (error: any) {
      console.error("[v0] GetWebAccessLogsController error:", error.message, error.stack)
      return rep.status(500).send({
        error: "ServiceError",
        message: "Opa, deu ruim na busca dos logs de acesso web! Tenta de novo ou fala com o suporte",
      })
    }
  }
}
