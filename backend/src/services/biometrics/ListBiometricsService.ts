/**
 * ListBiometricsService.ts - Lista de biometrias por unidade
 */

import { prisma } from "../../config/prisma"

interface ListBiometricsRequest {
  unit_code: string
  page: number
  page_size: number
}

interface ListBiometricsResult {
  biometrics: {
    id: number
    person_id: number
    finger: string
    device: string
    registration_date: string
    unit_id: number
    unit: {
      name: string
      unit_code: string
    }
    person: {
      full_name: string
      cpf: string
    }
  }[]
  total: number
  current_page: number
  total_pages: number
}

export class ListBiometricsService {
  async execute(params: ListBiometricsRequest): Promise<ListBiometricsResult> {
    const { unit_code, page, page_size } = params

    const unit = await this.validateUnit(unit_code)

    const [biometrics, total] = await Promise.all([
      this.fetchBiometrics(unit.id, page, page_size),
      this.getTotalCount(unit.id),
    ])

    const total_pages = Math.ceil(total / page_size)

    return {
      biometrics,
      total,
      current_page: page,
      total_pages,
    }
  }

  private async validateUnit(unitCode: string) {
    const unit = await prisma.unit.findUnique({
      where: { unit_code: unitCode },
    })

    if (!unit) throw new Error("Unidade não encontrada")
    return unit
  }

  private async fetchBiometrics(unitId: number, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize

    const biometrics = await prisma.biometric.findMany({
      where: {
        registration_unit_id: unitId,
      },
      skip,
      take: pageSize,
      include: {
        registration_unit: {
          select: {
            id: true,
            name: true,
            unit_code: true,
          },
        },
        people: {
          include: {
            person: true,
          },
        },
      },
      orderBy: {
        registration_date: "desc",
      },
    })

    const results: any[] = []
    for (const bio of biometrics) {
      if (bio.people && bio.people.length > 0) {
        for (const pb of bio.people) {
          if (pb.person) {
            results.push({
              id: bio.id,
              person_id: pb.person.id,
              finger: bio.finger || "unknown",
              device: bio.device || "R307",
              registration_date:
                bio.registration_date instanceof Date
                  ? bio.registration_date.toISOString()
                  : String(bio.registration_date),
              unit_id: bio.registration_unit.id,
              unit: {
                name: bio.registration_unit.name,
                unit_code: bio.registration_unit.unit_code,
              },
              person: {
                full_name: pb.person.full_name || "Desconhecido",
                cpf: pb.person.cpf || "000.000.000-00",
              },
            })
          }
        }
      }
    }
    return results
  }

  private async getTotalCount(unitId: number) {
    return prisma.biometric.count({
      where: {
        registration_unit_id: unitId,
      },
    })
  }
}
