/**
 * UpdateUnitsService.ts - Atualiza dados de unidades
 */

import { prisma } from "../../config/prisma"
import { UnitType } from "@prisma/client"

interface UpdateUnitRequest {
  unit_id: number
  name?: string
  unit_type?: UnitType
  address?: string
  phone?: string
  is_extension?: boolean
}

interface UpdateResult {
  id: number
  name: string
  unit_code: string
}

export class UpdateUnitsService {
  async execute(request: UpdateUnitRequest): Promise<UpdateResult> {
    const unit = await this.getUnitById(request.unit_id)
    
    const updateData: Record<string, any> = {}
    if (request.name !== undefined) updateData.name = request.name
    if (request.unit_type !== undefined) updateData.unit_type = request.unit_type
    if (request.address !== undefined) updateData.address = request.address
    if (request.phone !== undefined) updateData.phone = request.phone
    if (request.is_extension !== undefined) updateData.is_extension = request.is_extension

    if (Object.keys(updateData).length === 0) {
      throw new Error("Nenhum dado válido fornecido para atualização")
    }

    const updatedUnit = await prisma.unit.update({
      where: { id: unit.id },
      data: updateData,
    })

    return {
      id: updatedUnit.id,
      name: updatedUnit.name,
      unit_code: updatedUnit.unit_code,
    }
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

