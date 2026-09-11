/**
 * GenerateRandomBiometricService.ts - Gera templates biométricos aleatórios para fins de teste
 * # Pra que serve?
 * - Gera templates biométricos aleatórios para testes
 * - Útil para desenvolvimento e demonstração
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2025-11-26
 */

import { Finger } from "@prisma/client";
import { randomBytes } from "crypto";

export class GenerateRandomBiometricService {
  // Tamanho típico de um template biométrico em bytes
  private static readonly TEMPLATE_SIZE = 512;

  // Gera um template biométrico aleatório em base64
  public async execute(finger: Finger): Promise<{ template: string; quality: number }> {
    // Gera bytes aleatórios para simular um template biométrico
    const randomBuffer = randomBytes(GenerateRandomBiometricService.TEMPLATE_SIZE);
    
    // Converte para base64 para facilitar o envio via API
    const template = randomBuffer.toString('base64');
    
    // Gera uma qualidade aleatória entre 70 e 100
    const quality = Math.floor(Math.random() * 31) + 70;
    
    return { template, quality };
  }
}
