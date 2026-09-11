/**
 * DeleteUnitsService.ts - Remove unidades
 */

import { prisma } from "../../config/prisma"

interface DeleteResult {
  message: string
}

export class DeleteUnitsService {
  async execute(unitId: number): Promise<DeleteResult> {
    const unit = await this.getUnitById(unitId)
    
    // Verificar se há pessoas associadas
    const peopleCount = await prisma.person.count({
      where: { registration_unit_id: unitId },
    })

    if (peopleCount > 0) {
      throw new Error("Não é possível excluir unidade com pessoas cadastradas")
    }

    await prisma.unit.delete({
      where: { id: unit.id },
    })

    return { message: "Unidade excluída com sucesso" }
  }

  private async getUnitById(unitId: number) {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
    })

    if (!unit) {
      throw new Error("Unidade não encontrada")
    }
    return unit
  }
}

