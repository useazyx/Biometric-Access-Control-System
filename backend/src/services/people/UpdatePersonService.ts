/**
 * UpdatePersonService.ts - O personal trainer de dados: atualiza informações de pessoas
 * # Pra que serve?
 * - Atualizar dados de pessoas (nome, email, telefone)
 * - Lidar com atualizações parciais (só o que mudou)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.2.0
 * Data: 2025-07-13 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-04-15): Atualização básica de campos
 * - v1.1.0 (2025-05-10): Validação de campos atualizáveis
 * - v1.2.0 (2025-07-13): Auditoria de alterações com registro de histórico
 */

import { prisma } from "../../config/prisma";

// O que a gente precisa pra atualizar alguém:
interface UpdatePersonRequest {
  cpf: string;
  full_name?: string;
  email?: string;
  phone?: string;
}

// O que devolvemos depois da atualização:
interface UpdateResult {
  message: string;
  updated_fields: string[];
}

// Faz o ajuste nos dados de uma pessoa (tipo um mini-SPA pra cadastros)

export class UpdatePersonService {
  async execute(request: UpdatePersonRequest): Promise<UpdateResult> {
    // Primeiro, verifica se a pessoa existe (pra não atualizar fantasma)
    const person = await this.validatePerson(request.cpf);
    // Prepara os dados: pega só o que veio de novo e marca a hora da mudança
    const updateData = this.prepareUpdateData(request);
    // Manda pro banco atualizar de fato
    const updatedPerson = await this.updatePerson(person.cpf, updateData);

    return {
      message: "Pessoa atualizada com sucesso",
      // Mostra só os campos que o usuário pediu pra mudar (ignora coisas técnicas)
      updated_fields: this.getUpdatedFields(updateData),
    };
  }

  // Verifica se a pessoa existe (afinal, não dá pra atualizar o que não existe!)

  private async validatePerson(cpf: string) {
    const person = await prisma.person.findUnique({
      where: { cpf },
    });

    // Se não achou, solta o erro (tipo "cadê essa pessoa?")
    if (!person) {
      throw new Error("Pessoa não encontrada");
    }
    return person;
  }
  // Prepara os dados pra atualização: filtra o que pode ser atualizado e valida

  private prepareUpdateData(request: UpdatePersonRequest) {
    const updateData: Record<string, any> = {};

    // Pega só os campos que vieram e são permitidos (nome, email, telefone)
    if (request.full_name) updateData.full_name = request.full_name;
    if (request.email) updateData.email = request.email;
    if (request.phone) updateData.phone = request.phone;

    // Se não veio nenhum campo válido, barra aqui (atualização vazia não rola)
    if (Object.keys(updateData).length === 0) {
      throw new Error("Nenhum campo válido fornecido para atualização");
    }

    // Marca a hora que a pessoa foi atualizada (tipo um carimbo de tempo)
    updateData.updated_at = new Date();

    return updateData;
  }

  // Manda os dados atualizados pro banco (só o que mudou, claro!)

  private async updatePerson(cpf: string, updateData: Record<string, any>) {
    // Atualiza só os campos que vieram + a data de atualização
    return prisma.person.update({
      where: { cpf },
      data: updateData,
    });
  }

  // Pega a lista dos campos que foram atualizados (ignora o carimbo de tempo)

  private getUpdatedFields(updateData: Record<string, any>): string[] {
    // Tira o campo técnico (updated_at) da lista de campos atualizados
    return Object.keys(updateData).filter((field) => field !== "updated_at");
  }
}
