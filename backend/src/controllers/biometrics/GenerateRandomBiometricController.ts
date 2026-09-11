/**
 * GenerateRandomBiometricController.ts - Controlador para geração de templates biométricos aleatórios
 * # Pra que serve?
 * - Lida com requisições para gerar templates biométricos aleatórios
 * - Útil para testes e desenvolvimento
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2025-11-26
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { GenerateRandomBiometricService } from "../../services/biometrics/GenerateRandomBiometricService";
import { Finger } from "@prisma/client";

export class GenerateRandomBiometricController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Pega o dedo dos parâmetros da rota
      const { finger } = request.params as { finger: Finger };
      
      // Valida se o dedo é válido
      if (!Object.values(Finger).includes(finger)) {
        return reply.status(400).send({ 
          error: "Dedo inválido",
          validFingers: Object.values(Finger)
        });
      }

      // Gera o template biométrico aleatório
      const service = new GenerateRandomBiometricService();
      const { template, quality } = await service.execute(finger);

      // Retorna o template gerado
      return reply.status(200).send({
        success: true,
        message: "Template biométrico gerado com sucesso",
        data: {
          template,
          finger,
          quality,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error("Erro ao gerar template biométrico:", error);
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Ocorreu um erro ao gerar o template biométrico"
      });
    }
  }
}
