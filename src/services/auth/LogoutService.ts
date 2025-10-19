/**
 * LogoutService.ts - O porteiro da saída: cuida do logout do usuário com segurança
 * # Pra que serve?
 * - Finalizar a sessão do usuário de forma organizada
 * - Registrar quanto tempo ele ficou logado
 * - Criar um registro de saída pra documentar
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.1.0
 * Data: 2025-06-28 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-06-15): Implementação inicial do serviço
 * - v1.1.0 (2025-06-28): Adicionado cálculo de duração de sessão
 */

import { prisma } from "../../config/prisma";
import { EventType } from "@prisma/client";

// O que precisamos pra fazer logout:
interface LogoutProps {
  user_id: number;
  unit_id: number;
  access_log_id: number;
}

export class LogoutService {
  async execute({ user_id, unit_id, access_log_id }: LogoutProps) {
    try {
      // Se tivermos o ID do log de entrada, calcula quanto tempo durou a sessão
      if (access_log_id) {
        // Pega o registro de entrada do banco (quando o usuário logou)
        const loginLog = await prisma.webAccessLog.findUnique({
          where: { id: access_log_id, event_type: EventType.entry },
        });

        // Se achou o registro de entrada, calcula o tempo de sessão
        if (loginLog && loginLog.event_type === EventType.entry) {
          // Calcula minutos desde o login até agora
          const sessionDuration = Math.floor(
            (Date.now() - loginLog.login_time.getTime()) / 60000
          );

          // Atualiza o log de entrada com o tempo que o usuário ficou logado
          await prisma.webAccessLog.update({
            where: { id: access_log_id },
            data: { 
              logout_time: new Date(),
              session_duration_minutes: sessionDuration 
            },
          });
        }
      }

      // Retorna confirmação de que deu tudo certo
      return {
        message: "Logout realizado com sucesso",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Se der problema, mostra no console pra gente investigar
      console.error("LogoutServiceError:", error);
      // Joga o erro pra cima pro controller resolver
      throw new Error("Erro durante o processo de logout");
    }
  }
}
