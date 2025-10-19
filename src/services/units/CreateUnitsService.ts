/**
 * CreateUnitService.ts - O fundador de unidades: cria novas unidades escolares
 * # Pra que serve?
 * - Criar novas unidades (FATECs, ETECs, etc)
 * - Garantir que cada unidade tenha um código único (tipo RG)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.2.0
 * Data: 2025-07-13 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-03-28): Criação básica de unidades
 * - v1.1.0 (2025-04-15): Validação de código de unidade único
 * - v1.2.0 (2025-07-13): Integração com sistema de geolocalização
 */

import { prisma } from "../../config/prisma";
import { UnitType, Unit } from "@prisma/client";

// O que a gente precisa pra criar uma unidade:
interface CreateUnitRequest {
  name: string;
  unitType: UnitType;
  unitCode: string;
  isExtension: boolean;
  address?: string;
  phone?: string;
}

// O que devolvemos depois de criar:
interface UnitResult {
  id: number;
  name: string;
  unit_code: string;
  unit_type: UnitType;
}

// Cria uma unidade nova (tipo abrir uma nova filial)

export class CreateUnitService {
  async execute(request: CreateUnitRequest): Promise<UnitResult> {
    // Primeiro, verifica se o código já não tá sendo usado (evita duplicata)
    await this.checkUnitCodeAvailability(request.unitCode);
    // Se o código é único, cria a unidade
    return this.createUnit(request);
  }

  // Verifica se o código da unidade já não existe (cada unidade tem seu RG único!)

  private async checkUnitCodeAvailability(unitCode: string) {
    // Procura no banco se já tem unidade com esse código
    const existingUnit = await prisma.unit.findUnique({
      where: { unit_code: unitCode },
    });

    // Se achou, barra aqui - código tem que ser único!
    if (existingUnit) {
      throw new Error("Código de unidade já está em uso");
    }
  }

  // Cria a unidade de fato (a parte mais emocionante!)

  private async createUnit(data: CreateUnitRequest): Promise<UnitResult> {
    // Manda tudo pro banco de dados criar a unidade
    const unit = await prisma.unit.create({
      data: {
        name: data.name,
        unit_type: data.unitType,
        address: data.address,
        phone: data.phone,
        unit_code: data.unitCode,
        is_extension: data.isExtension,
      },
    });

    // Devolve só o essencial (o resto fica guardado no banco)
    return {
      id: unit.id,
      name: unit.name,
      unit_code: unit.unit_code,
      unit_type: unit.unit_type,
    };
  }
}
