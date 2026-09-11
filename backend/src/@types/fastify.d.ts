/**
 * fastify.d.ts - Aumenta os tipos do Fastify com nossas extensões
 * # Pra que serve?
 * - Colocar o usuário logado dentro do Request, com tipo de verdade
 * - Ser o ÚNICO lugar que declara esse formato, pra não ter duas versões brigando
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-03-12): Definição inicial dos tipos extendidos
 * - v1.1.0 (2025-04-05): Adicionado tokenId e unitId ao user object
 * - v2.0.0 (2026-09-09): O authMiddleware declarava esse mesmo tipo com outro formato,
 *                        e o daqui estava desatualizado (mentia sobre os campos).
 *                        Agora existe uma declaração só, e ela bate com o que o
 *                        middleware realmente coloca no request. Os métodos
 *                        reply.success/reply.error saíram: nunca foram implementados.
 */

import type { PersonType } from "@prisma/client"

declare module "fastify" {
  // A gente coloca o usuário logado dentro do Request, pra ter sempre à mão as info
  // de quem tá fazendo a requisição. Quem preenche isso é o authMiddleware.
  interface FastifyRequest {
    user?: {
      id: number
      full_name: string
      email: string
      type: PersonType
      unit_id: number
      // Vem do cargo (Role) do funcionário; quem não é funcionário fica com 0
      permission_level: number
    }
  }
}
