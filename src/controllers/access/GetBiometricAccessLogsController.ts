import { FastifyReply, FastifyRequest } from "fastify";
import { GetBiometricAccessLogsService, BiometricFilters } from "../../services/access/GetBiometricAccessLogsService";
import { EventType } from "@prisma/client";

export class GetBiometricAccessLogsController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    try {
      const service = new GetBiometricAccessLogsService();
      const body = req.body as any;

      const parseDate = (dateStr: string | undefined): Date | undefined => {
        if (!dateStr) return undefined;
        if (dateStr.includes("T")) return new Date(dateStr);
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return new Date(`${dateStr}T00:00:00.000Z`);
        }
        return new Date(dateStr);
      };

      const filters: BiometricFilters = {
        unit_id: body.unit_id,
        cpf: body.cpf,
        start_date: body.start_date ? parseDate(body.start_date) : undefined,
        end_date: body.end_date ? parseDate(body.end_date) : undefined,
        event_type: body.event_type as EventType,
        page: body.page,
        page_size: body.page_size,
      };

      const result = await service.execute(filters);
      return rep.send(result);
    } catch (error) {
      console.error("GetBiometricAccessLogsServiceError:", error);
      return rep.status(500).send({
        error: "ServiceError",
        message:
          "Opa, deu ruim na busca dos logs biométricos! Tenta de novo ou fala com o suporte",
      });
    }
  }
}

