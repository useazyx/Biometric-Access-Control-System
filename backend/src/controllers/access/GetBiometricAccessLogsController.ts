import type { FastifyReply, FastifyRequest } from "fastify"
import {
  GetBiometricAccessLogsService,
  type BiometricFilters,
} from "../../services/access/GetBiometricAccessLogsService"
import type { EventType } from "@prisma/client"

export class GetBiometricAccessLogsController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    try {
      const service = new GetBiometricAccessLogsService()
      const query = req.query as any

      const parseDate = (dateStr: string | undefined): Date | undefined => {
        if (!dateStr) return undefined
        if (dateStr.includes("T")) return new Date(dateStr)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return new Date(`${dateStr}T00:00:00.000Z`)
        }
        return new Date(dateStr)
      }

      const filters: BiometricFilters = {
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
        ...log,
        access_time: log.access_time instanceof Date ? log.access_time.toISOString() : log.access_time,
      }))

      return rep.send({
        logs: logsFormatted,
        total_items: result.total_items,
        total_pages: result.total_pages,
        current_page: result.current_page,
        page_size: result.page_size,
      })
    } catch (error) {
      console.error("GetBiometricAccessLogsServiceError:", error)
      return rep.status(500).send({
        error: "ServiceError",
        message: "Opa, deu ruim na busca dos logs biométricos! Tenta de novo ou fala com o suporte",
      })
    }
  }
}
