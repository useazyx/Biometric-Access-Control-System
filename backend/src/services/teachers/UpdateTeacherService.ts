/**
 * UpdateTeacherService.ts - Atualiza dados de professores
 */

import { prisma } from "../../config/prisma"

interface UpdateTeacherRequest {
  teacher_id: number
  subjects?: string[]
  can_teach_fatec?: boolean
  can_teach_etec?: boolean
}

interface UpdateResult {
  id: number
  employee_id: number
}

export class UpdateTeacherService {
  async execute(request: UpdateTeacherRequest): Promise<UpdateResult> {
    const teacher = await this.getTeacherById(request.teacher_id)
    
    const updateData: Record<string, any> = {}
    if (request.subjects !== undefined) updateData.subjects = request.subjects
    if (request.can_teach_fatec !== undefined) updateData.can_teach_fatec = request.can_teach_fatec
    if (request.can_teach_etec !== undefined) updateData.can_teach_etec = request.can_teach_etec

    if (Object.keys(updateData).length === 0) {
      throw new Error("Nenhum dado válido fornecido para atualização")
    }

    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacher.id },
      data: updateData,
    })

    return {
      id: updatedTeacher.id,
      employee_id: updatedTeacher.employee_id,
    }
  }

  private async getTeacherById(teacherId: number) {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    })

    if (!teacher) {
      throw new Error("Professor não encontrado")
    }
    return teacher
  }
}

