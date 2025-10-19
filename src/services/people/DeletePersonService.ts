/**
 * DeletePersonService.ts - O faxineiro de pessoas: remove registros e tudo que tá ligado a eles
 * # Pra que serve?
 * - Apagar pessoas do sistema
 * - Limpar os rastros (dados relacionados) pra não deixar bagunça
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.4.0
 * Data: 2025-07-13 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-04-05): Implementação inicial da exclusão
 * - v1.1.0 (2025-04-18): Exclusão em cascata de registros relacionados
 * - v1.2.0 (2025-05-03): Validação de dependências antes da exclusão
 * - v1.3.0 (2025-05-28): Transações atômicas para segurança de dados
 * - v1.4.0 (2025-07-13): Otimização de desempenho com operações em lote
 */

import { Prisma } from '@prisma/client';
import { prisma } from "../../config/prisma";

interface DeleteResult {
  message: string;
  deletedPersonId: number;
}

export class DeletePersonService {
  async execute(cpf: string): Promise<DeleteResult> {
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Encontra a pessoa com relacionamentos críticos
        const person = await tx.person.findUnique({
          where: { cpf },
          include: {
            employee: {
              select: { id: true }
            }
          }
        });

        if (!person) {
          throw new Error("Pessoa não encontrada");
        }

        // 2. Remove dependências críticas manualmente
        if (person.employee) {
          // Libera visitantes vinculados ao funcionário
          await tx.visitor.updateMany({
            where: { responsible_employee_id: person.employee.id },
            data: { responsible_employee_id: null }
          });
        }

        // 3. Exclui a pessoa e registros filhos via cascata
        const deletedPerson = await tx.person.delete({
          where: { id: person.id }
        });

        return { 
          message: "✅ Pessoa e registros vinculados excluídos",
          deletedPersonId: deletedPerson.id
        };
      });
    } catch (error: any) {
      console.error("ERRO DETALHADO:", error);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2025':
            throw new Error("Pessoa não encontrada");
          case 'P2003':
            const field = error.meta?.field_name || 'campo desconhecido';
            throw new Error(`Restrição de chave estrangeira: ${field}`);
          default:
            throw new Error(`Erro do banco: ${error.code}`);
        }
      }
      
      throw new Error(`Falha na exclusão: ${error.message}`);
    }
  }
}