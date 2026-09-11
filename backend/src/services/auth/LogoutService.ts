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

import { prisma } from "../../config/prisma"
import { EventType } from "@prisma/client"

// O que precisamos pra fazer logout:
interface LogoutProps {
  user_id: number
  unit_id: number
  access_log_id: number
}

export class LogoutService {
  async execute({ user_id, unit_id, access_log_id }: LogoutProps) {
    try {
      let logToUpdate = null

      // Se tivermos o ID do log de entrada, tenta usar ele
      if (access_log_id) {
        logToUpdate = await prisma.webAccessLog.findUnique({
          where: { id: access_log_id },
        })
      }

      // Se não encontrou pelo ID ou não foi fornecido, busca o último log de entrada do usuário
      if (!logToUpdate || logToUpdate.event_type !== EventType.entry) {
        logToUpdate = await prisma.webAccessLog.findFirst({
          where: {
            person_id: user_id,
            unit_id: unit_id,
            event_type: EventType.entry,
          },
          orderBy: {
            login_time: "desc",
          },
        })
      }

      // Se achou um log de entrada, atualiza com logout
      if (logToUpdate && logToUpdate.event_type === EventType.entry) {
        const logoutTime = new Date()
        // Calcula minutos desde o login até agora
        const sessionDuration = Math.floor((logoutTime.getTime() - logToUpdate.login_time.getTime()) / 60000)

        // Atualiza o log de entrada com o tempo que o usuário ficou logado e muda o event_type para exit
        await prisma.webAccessLog.update({
          where: { id: logToUpdate.id },
          data: {
            logout_time: logoutTime,
            session_duration_minutes: sessionDuration,
            event_type: EventType.exit, // Mudar de entry para exit
          },
        })
        
        console.log(`[v0] LogoutService: Updated log ${logToUpdate.id} with logout_time and session_duration: ${sessionDuration} minutes`)
      } else {
        console.log(`[v0] LogoutService: No entry log found for user ${user_id}`)
      }

      // Retorna confirmação de que deu tudo certo
      return {
        message: "Logout realizado com sucesso",
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      // Se der problema, mostra no console pra gente investigar
      console.error("LogoutServiceError:", error)
      // Joga o erro pra cima pro controller resolver
      throw new Error("Erro durante o processo de logout")
    }
  }
}
