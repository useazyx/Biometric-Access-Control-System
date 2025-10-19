import { prisma } from "../../config/prisma";
import { EventType } from "@prisma/client";

export interface WebFilters {
  unit_id?: number;
  cpf?: string;
  start_date?: Date;
  end_date?: Date;
  event_type?: EventType;
  page?: number;
  page_size?: number;
}

export class GetWebAccessLogsService {
  async execute(filters: WebFilters) {
    const { unit_id, cpf, start_date, end_date, event_type, page = 1, page_size = 10 } = filters;

    const skip = (page - 1) * page_size;

    const where: any = {};

    if (unit_id) {
      where.unit_id = unit_id;
    }

    if (cpf) {
      where.person = {
        cpf: cpf,
      };
    }

    if (start_date && end_date) {
      where.login_time = {
        gte: start_date,
        lte: end_date,
      };
    } else if (start_date) {
      where.login_time = {
        gte: start_date,
      };
    } else if (end_date) {
      where.login_time = {
        lte: end_date,
      };
    }

    if (event_type) {
      where.event_type = event_type;
    }

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
    });

    const total_items = await prisma.webAccessLog.count({
      where,
    });

    const total_pages = Math.ceil(total_items / page_size);

    return {
      logs,
      total_items,
      total_pages,
      current_page: page,
      page_size,
    };
  }
}

