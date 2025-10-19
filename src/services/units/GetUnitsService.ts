/**
 * GetUnitsService.ts - O catálogo de unidades: lista unidades com filtros
 * # Pra que serve?
 * - Listar unidades escolares (FATECs, ETECs, etc)
 * - Filtrar por tipo e se é extensão
 * - Organizar os dados pra ficar fácil de usar
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.1.0
 * Data: 2025-07-13 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-04-02): Listagem básica de unidades
 * - v1.1.0 (2025-07-13): Filtros avançados por tipo e região
 */

import { prisma } from "../../config/prisma";
import { UnitType, Unit } from "@prisma/client";

// Como a gente quer buscar as unidades:
interface GetUnitsRequest {
  type?: UnitType;
  is_extension?: boolean;
}

// Como a gente devolve as unidades encontradas:
interface GetUnitsResult {
  units: {
    // Lista de unidades
    id: number;
    name: string;
    unit_type: UnitType;
    unit_code: string;
    address: string | null;
    phone: string | null;
    is_extension: boolean;
  }[];
  total: number;
}

// Busca unidades com filtros (tipo um catálogo inteligente)

export class GetUnitsService {
  async execute(params: GetUnitsRequest): Promise<GetUnitsResult> {
    // Monta as regras de busca baseado no que veio (tipo "só FATECs extensionistas")
    const where = this.buildWhereClause(params);

    // Pega as unidades do banco usando essas regras
    const units = await this.fetchUnits(where);

    // Como já temos a lista, o total é só contar (pra não fazer outra busca)
    return {
      units,
      total: units.length,
    };
  }

  /**
   * Monta as regras de busca (tipo um filtro personalizado)
   */
  private buildWhereClause(params: GetUnitsRequest) {
    const { type, is_extension } = params;
    // Começa vazio e vai adicionando o que vier
    const where: Record<string, any> = {};

    // Se pediu um tipo específico (ex: FATEC), adiciona no filtro
    if (type) where.unit_type = type;

    // Se perguntou se é extensão (true ou false), filtra também
    if (is_extension !== undefined) where.is_extension = is_extension;

    return where;
  }

  /**
   * Busca as unidades no banco, formatando do jeito que a gente quer
   */
  private async fetchUnits(where: Record<string, any>) {
    // Pega só os campos que importam, na ordem alfabética
    return prisma.unit.findMany({
      where,
      select: {
        id: true,
        name: true,
        unit_type: true,
        unit_code: true,
        address: true,
        phone: true,
        is_extension: true,
      },
      // Ordena por nome (A-Z) pra ficar organizado
      orderBy: { name: "asc" },
    });
  }
}
