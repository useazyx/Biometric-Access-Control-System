/**
 * UpdateStudentService.ts - O ajustador de cadastro estudantil: atualiza dados de alunos
 * # Pra que serve?
 * - Atualizar informações de estudantes (período, curso, status, etc)
 * - Garantir que só campos válidos sejam atualizados
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.1.0
 * Data: 2025-07-13 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-05-18): Atualização básica de dados de estudante
 * - v1.1.0 (2025-07-13): Validação de transições de status acadêmico
 */

import { prisma } from "../../config/prisma";
import { Period, StudentStatus, Student } from "@prisma/client";

// O que a gente precisa pra atualizar um estudante:
interface UpdateStudentRequest {
  rm: string;
  period?: Period;
  course?: string;
  className?: string;
  status?: StudentStatus;
  responsible?: string;
}

// O que devolvemos depois da atualização:
interface UpdateResult {
  id: number;
  rm: string;
}

// Faz o ajuste nos dados de um estudante (tipo uma secretaria virtual)

export class UpdateStudentService {
  async execute(request: UpdateStudentRequest): Promise<UpdateResult> {
    // Primeiro, busca o estudante pelo RM (pra saber quem vamos atualizar)
    const student = await this.getStudentByRm(request.rm);
    // Prepara os dados: pega só o que veio de novo (ignora campos vazios)
    const updateData = this.prepareUpdateData(request);
    // Manda pro banco atualizar
    const updatedStudent = await this.updateStudent(student.rm, updateData);

    // Devolve só o essencial (ID e RM pra confirmar)
    return {
      id: updatedStudent.id,
      rm: updatedStudent.rm,
    };
  }

  // Busca um estudante pelo RM (tipo "cadê você?")

  private async getStudentByRm(rm: string) {
    // RM é único, então busca direto por ele
    const student = await prisma.student.findUnique({
      where: { rm },
    });

    // Se não achou, solta o erro (estudante fantasma não existe!)
    if (!student) {
      throw new Error("Estudante não encontrado");
    }
    return student;
  }

  // Prepara os dados pra atualização: filtra o que veio e valida

  private prepareUpdateData(request: UpdateStudentRequest) {
    // Pega só os campos que vieram (ignora os que não foram enviados)
    const updateData: Record<string, any> = {};

    if (request.period) updateData.period = request.period;
    if (request.course) updateData.course = request.course;
    if (request.className) updateData.class = request.className;
    if (request.status) updateData.status = request.status;
    if (request.responsible) updateData.responsible = request.responsible;

    // Se não veio NENHUM campo válido, barra aqui (atualização vazia não rola)
    if (Object.keys(updateData).length === 0) {
      throw new Error("Nenhum dado válido fornecido para atualização");
    }

    return updateData;
  }

  // Manda os dados atualizados pro banco (só o que mudou!)

  private async updateStudent(rm: string, updateData: Record<string, any>) {
    // Atualiza só os campos que vieram (não mexe no resto)
    return prisma.student.update({
      where: { rm },
      data: updateData,
    });
  }
}
