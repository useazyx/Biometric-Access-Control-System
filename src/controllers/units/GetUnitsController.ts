/**
 * GetUnitsController.ts - Cuida dos dados para buscar unidades (fatec/etec)
 * # Pra que serve?
 * - Lidar com a listagem de unidades, podendo filtrar
 * - Converter os parâmetros da URL pra formatos úteis
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.4.0
 * Data: 2025-05-25 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-05-10): Listagem básica
 * - v1.1.0 (2025-05-15): Filtros por tipo e extensão
 * - v1.2.0 (2025-05-20): Paginação de resultados
 * - v1.3.0 (2025-05-25): Cache de consultas
 * - v1.4.0 (2025-07-20): Recebe parâmetros via JSON body
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { GetUnitsService } from "../../services/units/GetUnitsService";
import { UnitType } from "@prisma/client";

// Gerencia a busca de unidades: pega a lista com opção de filtros

export class GetUnitsController {
  // Lida com a requisição de listar unidades

  async handle(request: FastifyRequest, reply: FastifyReply) {
    // Pega os filtros do corpo da requisição
    const body = request.body as {
      type?: string;
      is_extension?: string;
    };

    const type = body?.type;
    const is_extension = body?.is_extension;

    // Converte o parâmetro is_extension de string pra booleano (se existir)
    const isExtension = this.parseBoolean(is_extension);

    // Se o usuário mandou is_extension mas não é true/false, barra aqui
    if (is_extension && isExtension === undefined) {
      return reply.status(400).send({
        error: "InvalidParameter",
        message: "is_extension deve ser 'true' ou 'false'",
      });
    }

    try {
      // Chama o serviço que busca as unidades no banco com os filtros
      const service = new GetUnitsService();
      const result = await service.execute({
        type: type as UnitType,
        is_extension: isExtension,
      });

      // Se tudo der certo, manda a lista de unidades encontradas
      return reply.status(200).send(result);
    } catch (error) {
      // Se der problema, loga o erro e manda uma resposta genérica (sem assustar o usuário)
      console.error("GetUnitsError:", error);
      return reply.status(400).send({ error: "Erro ao listar unidades" });
    }
  }

  // Transforma string em booleano (pra 'true' vira true, 'false' vira false) Se não for nenhum dos dois, retorna undefined (tipo quando não veio nada)

  private parseBoolean(value?: string): boolean | undefined {
    if (value === undefined) return undefined;
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
    return undefined;
  }
}