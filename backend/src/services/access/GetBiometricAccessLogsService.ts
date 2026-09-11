import { prisma } from "../../config/prisma"
import type { EventType } from "@prisma/client"

export interface BiometricFilters {
  unit_id?: number
  cpf?: string
  start_date?: Date
  end_date?: Date
  event_type?: EventType
  page?: number
  page_size?: number
}

export class GetBiometricAccessLogsService {
  async execute(filters: BiometricFilters) {
    const { unit_id, cpf, start_date, end_date, event_type, page = 1, page_size = 10 } = filters

    const skip = (page - 1) * page_size

    const where: any = {}

    if (unit_id) {
      where.unit_id = unit_id
    } else {
      const firstUnit = await prisma.unit.findFirst()
      if (firstUnit) {
        where.unit_id = firstUnit.id
      } else {
        return {
          logs: [],
          total_items: 0,
          total_pages: 0,
          current_page: page,
          page_size,
        }
      }
    }

    if (cpf) {
      where.person = {
        cpf: cpf,
      }
    }

    if (start_date && end_date) {
      where.access_time = {
        gte: start_date,
        lte: end_date,
      }
    } else if (start_date) {
      where.access_time = {
        gte: start_date,
      }
    } else if (end_date) {
      where.access_time = {
        lte: end_date,
      }
    }

    if (event_type) {
      where.event_type = event_type
    }

    const logs = await prisma.biometricLog.findMany({
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
        access_time: "desc",
      },
    })

    const formattedLogs = logs.map((log: any) => ({
      id: log.id,
      access_time: log.access_time instanceof Date ? log.access_time.toISOString() : String(log.access_time),
      event_type: log.event_type,
      biometric_device: log.biometric_device,
      is_authorized: log.is_authorized,
      person_id: log.person_id,
      person: log.person,
      unit_id: log.unit_id,
      unit: log.unit
        ? {
            name: log.unit.name,
            unit_code: log.unit.unit_code,
          }
        : null,
    }))

    const total_items = await prisma.biometricLog.count({
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
