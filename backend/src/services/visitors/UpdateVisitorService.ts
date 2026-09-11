/**
 * UpdateVisitorService.ts - Atualiza dados de visitantes
 * # Pra que serve?
 * - Alterar só os campos que realmente vieram no pedido
 * - Permitir limpar a data de validade da visita (mandando null)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.1.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-10-21): Implementação inicial
 * - v1.1.0 (2026-09-09): visit_expiry_date aceita null, pra dar pra apagar a data
 */

import { prisma } from "../../config/prisma"

interface UpdateVisitorRequest {
  visitor_id: number
  company?: string
  visit_reason?: string
  registration_date?: string
  // Aceita null pra quem quiser apagar a data de validade da visita
  visit_expiry_date?: string | null
  responsible_employee_id?: number | null
}

interface UpdateResult {
  id: number
  person_id: number
}

export class UpdateVisitorService {
  async execute(request: UpdateVisitorRequest): Promise<UpdateResult> {
    const visitor = await this.getVisitorById(request.visitor_id)
    
    const updateData: Record<string, any> = {}
    if (request.company !== undefined) updateData.company = request.company || null
    if (request.visit_reason !== undefined) updateData.visit_reason = request.visit_reason || null
    if (request.registration_date !== undefined && request.registration_date) {
      updateData.registration_date = new Date(request.registration_date)
    }
    if (request.visit_expiry_date !== undefined) {
      updateData.visit_expiry_date = request.visit_expiry_date && request.visit_expiry_date.trim() 
        ? new Date(request.visit_expiry_date) 
        : null
    }
    if (request.responsible_employee_id !== undefined) {
      updateData.responsible_employee_id = request.responsible_employee_id || null
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("Nenhum dado válido fornecido para atualização")
    }

    const updatedVisitor = await prisma.visitor.update({
      where: { id: visitor.id },
      data: updateData,
    })

    return {
      id: updatedVisitor.id,
      person_id: updatedVisitor.person_id,
    }
  }

  private async getVisitorById(visitorId: number) {
    const visitor = await prisma.visitor.findUnique({
      where: { id: visitorId },
    })

    if (!visitor) {
      throw new Error("Visitante não encontrado")
    }
    return visitor
  }
}

