import { prisma } from "../config/prisma"
import { UnitType } from "@prisma/client"

export interface UnitBreakdown {
  fatec: number
  etec: number
  fatec_extension: number
  etec_extension: number
}

export class GetUnitBreakdownService {
  async execute(): Promise<UnitBreakdown> {
    const [fatec, etec, fatec_extension, etec_extension] = await Promise.all([
      prisma.unit.count({ where: { unit_type: UnitType.Fatec, is_extension: false } }),
      prisma.unit.count({ where: { unit_type: UnitType.Etec, is_extension: false } }),
      prisma.unit.count({ where: { unit_type: UnitType.Fatec, is_extension: true } }),
      prisma.unit.count({ where: { unit_type: UnitType.Etec, is_extension: true } }),
    ])

    return { fatec, etec, fatec_extension, etec_extension }
  }
}