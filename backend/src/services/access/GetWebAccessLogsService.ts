import { prisma } from "../../config/prisma"
import type { EventType } from "@prisma/client"

export interface WebFilters {
  unit_id?: number
  cpf?: string
  start_date?: Date
  end_date?: Date
  event_type?: EventType
  page?: number
  page_size?: number
}

export class GetWebAccessLogsService {
  async execute(filters: WebFilters) {
    const { unit_id, cpf, start_date, end_date, event_type, page = 1, page_size = 1000 } = filters

    const skip = (page - 1) * page_size

    const where: any = {}

    // Se unit_id for fornecido, filtra por ele. Caso contrário, mostra logs de todas as unidades
    if (unit_id) {
      where.unit_id = unit_id
    }
    // Se não for fornecido, não adiciona filtro de unit_id, mostrando todos os logs

    if (cpf) {
      where.person = {
        cpf,
      }
    }

    if (start_date && end_date) {
      where.login_time = {
        gte: start_date,
        lte: end_date,
      }
    } else if (start_date) {
      where.login_time = {
        gte: start_date,
      }
    } else if (end_date) {
      where.login_time = {
        lte: end_date,
      }
    }

    // Se event_type não for fornecido, mostra TODOS os registros (entry e exit)
    // Se for fornecido, filtra apenas pelo tipo especificado
    if (event_type) {
      where.event_type = event_type
    }
    // Se não for fornecido, não adiciona filtro de event_type, mostrando todos

    // Busca todos os registros que correspondem aos filtros (incluindo exit se não houver filtro de event_type)
    const logs = await prisma.webAccessLog.findMany({
      where,
      include: {
        person: {
          select: {
            full_name: true,
            cpf: true,
            type: true,
          },
        },
        unit: {
          select: {
            name: true,
            unit_code: true,
          },
        },
      },
      skip,
      take: page_size,
      orderBy: {
        login_time: "desc",
      },
    })

    const formattedLogs = logs.map((log: any) => ({
      id: log.id,
      login_time:
        typeof log.login_time === "string"
          ? log.login_time
          : log.login_time instanceof Date
            ? log.login_time.toISOString()
            : String(log.login_time),
      logout_time: log.logout_time
        ? typeof log.logout_time === "string"
          ? log.logout_time
          : log.logout_time instanceof Date
            ? log.logout_time.toISOString()
            : String(log.logout_time)
        : null,
      session_duration_minutes: log.session_duration_minutes || null,
      event_type: log.event_type,
      person: log.person || null,
      person_id: log.person_id || null,
      unit: log.unit || { name: "", unit_code: "" },
      unit_id: log.unit_id,
    }))

    const total_items = await prisma.webAccessLog.count({
      where,
    })

    const total_pages = Math.ceil(total_items / page_size)

    return {
      logs: formattedLogs,
      total_items,
      total_pages,
      current_page: page,
      page_size,
    }
  }
}
