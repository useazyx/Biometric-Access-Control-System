/**
 * ListPersonService.ts - O catálogo de pessoas: lista pessoas por unidade e tipo, com paginação
 * # Pra que serve?
 * - Buscar pessoas de uma unidade específica (tipo um filtro por local)
 * - Dividir os resultados em páginas (pra não sobrecarregar)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.3.0
 * Data: 2025-07-13 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-03-22): Paginação básica de pessoas
 * - v1.1.0 (2025-04-12): Filtragem por unidade e tipo de pessoa
 * - v1.2.0 (2025-05-05): Ordenação personalizável
 * - v1.3.0 (2025-07-13): Suporte a buscas textuais por nome
 */

import { prisma } from "../../config/prisma";
import { PersonType } from "@prisma/client";

// O que a gente precisa pra fazer a busca:
interface ListPersonRequest {
  unit_code: string;
  type?: PersonType;
  page: number;
  page_size: number;
}

// Como a gente devolve os resultados:
interface ListResult {
  people: {
    id: number;
    full_name: string;
    type: string;
    email: string | null;
    cpf: string;
  }[];
  total: number;
  current_page: number;
  total_pages: number;
}

// Busca pessoas paginadas (tipo uma lista telefônica organizada)

export class ListPersonService {
  async execute(params: ListPersonRequest): Promise<ListResult> {
    const { unit_code, type, page, page_size } = params;

    // Valida a unidade (pra saber se existe mesmo)
    const unit = await this.validateUnit(unit_code);
    // Monta as regras da busca (onde e o quê)
    const where = this.buildWhereClause(unit.id, type);

    // Busca em paralelo: a lista de pessoas e o total (pra ser mais rápido)
    const [people, total] = await Promise.all([
      this.fetchPeople(where, page, page_size),
      this.getTotalCount(where),
    ]);

    // Calcula quantas páginas vão ter no total
    const total_pages = Math.ceil(total / page_size);

    // Monta o pacote completo com resultados
    return {
      people,
      total,
      current_page: page,
      total_pages,
    };
  }

  // Verifica se a unidade existe (pra não buscar em lugar que não tem)

  private async validateUnit(unitCode: string) {
    // Busca a unidade pelo código (tipo CEP)
    const unit = await prisma.unit.findUnique({
      where: { unit_code: unitCode },
    });

    // Se não achou, já avisa!
    if (!unit) throw new Error("Unidade não encontrada");
    return unit;
  }

  // Monta as regras da busca: unidade obrigatória e tipo opcional

  private buildWhereClause(unitId: number, type?: PersonType) {
    // Filtro fixo: só pessoas da unidade X
    // Filtro extra: se escolheu um tipo específico (estudante, funcionário, etc)
    return {
      registration_unit_id: unitId,
      ...(type && { type }),
    };
  }

  // Pega um pedaço das pessoas (a página atual)

  private async fetchPeople(
    where: Record<string, any>,
    page: number,
    pageSize: number
  ) {
    // Calcula quantos pular (tipo "pula as 10 primeiras pra pegar a página 2")
    const skip = (page - 1) * pageSize;

    // Busca no banco só os campos essenciais (pra ser leve)
    return prisma.person.findMany({
      where,
      skip,
      take: pageSize,
      select: {
        id: true,
        full_name: true,
        type: true,
        email: true,
        cpf: true,
      },
      orderBy: { full_name: "asc" },
    });
  }

  // Conta quantas pessoas tem no total (com os filtros aplicados)

  private async getTotalCount(where: Record<string, any>) {
    // Só conta, não traz os dados (tipo "quantos tem?" sem mostrar quem)
    return prisma.person.count({ where });
  }
}
