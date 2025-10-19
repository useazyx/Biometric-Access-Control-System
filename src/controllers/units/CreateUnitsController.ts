/**
 * CreateUnitsController.ts - Cuida dos dados para criar unidades (etec/fatec)
 * # Pra que serve?
 * - Receber os dados da nova unidade e mandar pro serviço
 * - Lidar com o resultado (sucesso ou erro) e responder pro cliente
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.2.0
 * Data: 2025-05-15 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-04-20): Implementação inicial
 * - v1.1.0 (2025-05-05): Validação de códigos únicos
 * - v1.2.0 (2025-05-15): Suporte a unidades de extensão
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { CreateUnitService } from "../../services/units/CreateUnitsService";
import { UnitType } from "@prisma/client";
// Define como devem vir os dados na requisição:

interface CreateUnitBody {
  name: string;
  unit_type: UnitType;
  address?: string;
  phone?: string;
  unit_code: string;
  is_extension: boolean;
}

// Gerencia a criação de unidades: faz a ponte entre a requisição e o serviço que salva no banco, tratando as respostas.

export class CreateUnitsController {
  // Lida com a requisição de criar uma unidade

  async handle(request: FastifyRequest, reply: FastifyReply) {
    // Pega os dados do corpo da requisição (o que o usuário enviou)
    const body = request.body as CreateUnitBody;

    try {
      // Chama o serviço que faz a mágica de criar no banco
      const service = new CreateUnitService();
      const unit = await service.execute({
        name: body.name,
        unitType: body.unit_type,
        unitCode: body.unit_code,
        isExtension: body.is_extension,
        address: body.address,
        phone: body.phone,
      });

      // Se deu tudo certo, monta a resposta de sucesso (código 201 - criado)
      return reply.status(201).send({
        id: unit.id,
        message: "Unidade criada com sucesso",
        unit: {
          id: unit.id,
          name: unit.name,
          unit_code: unit.unit_code,
          unit_type: unit.unit_type,
        },
      });
    } catch (error: any) {
      // Se o código da unidade já existe (conflito)
      if (error.message === "Código de unidade já está em uso") {
        return reply.status(409).send({ error: error.message });
      }

      // Se for outro erro, loga no console e manda resposta genérica
      console.error("CreateUnitError:", error);
      return reply.status(400).send({ error: "Erro ao criar unidade" });
    }
  }
}
