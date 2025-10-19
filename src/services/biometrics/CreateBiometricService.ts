/**
 * CreateBiometricService.ts - O cadastrador de digitais: registra sua biometria no sistema
 * # Pra que serve?
 * - Validar seus dados antes de cadastrar a digital
 * - Guardar sua biometria de forma segura e associar a você
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.2.0
 * Data: 2025-07-05 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-06-25): Implementação inicial do cadastro
 * - v1.1.0 (2025-07-01): Validação de dedo único por pessoa
 * - v1.2.0 (2025-07-05): Melhoria na conversão de templates
 */

import { prisma } from "../../config/prisma";
import { Finger, Biometric, Person, Unit } from "@prisma/client";
import { Buffer } from "buffer";

// Como a gente devolve os dados do cadastro biométrico:
interface BiometricResult {
  id: number;
  person_id: number;
  finger: Finger;
  created_at: Date;
}

// Serviço que cadastra sua biometria - tipo o leitor de digital inteligente

export class CreateBiometricService {
  // Faz todo o processo de cadastrar uma digital

  async execute(
    cpf: string,
    template: string,
    finger: Finger,
    unitCode: string
  ): Promise<BiometricResult> {
    // 1. Verifica se você tá cadastrado no sistema
    const person = await this.validatePerson(cpf);
    // 2. Checa se a unidade existe
    const unit = await this.validateUnit(unitCode);
    // 3. Converte a digital de texto (base64) pra formato binário
    const templateBuffer = this.convertTemplate(template);
    // 4. Verifica se você já não cadastrou esse dedo antes
    await this.checkExistingBiometric(person.id, finger);
    // 5. Cria o registro da sua digital no banco
    return this.createBiometricRecord(
      person.id,
      templateBuffer,
      finger,
      unit.id
    );
  }

  // Confere se você tá cadastrado no sistema pelo CPF

  private async validatePerson(cpf: string): Promise<Person> {
    // Busca você no banco pelo CPF
    const person = await prisma.person.findUnique({ where: { cpf } });
    // Se não achou, você não tá cadastrado ainda
    if (!person) throw new Error("Pessoa não encontrada");
    return person;
  }

  // Confere se a unidade existe (onde você tá cadastrando a digital)

  private async validateUnit(unitCode: string): Promise<Unit> {
    // Busca a unidade no banco pelo código
    const unit = await prisma.unit.findUnique({
      where: { unit_code: unitCode },
    });
    // Se não achou, a unidade não existe
    if (!unit) throw new Error("Unidade não encontrada");
    return unit;
  }

  // Transforma a digital de texto (base64) em dados binários

  private convertTemplate(template: string): Buffer {
    // Traduz o base64 pra binário (tipo decodificar uma mensagem)
    return Buffer.from(template, "base64");
  }

  // Verifica se você já cadastrou esse dedo antes (pra não duplicar)

  private async checkExistingBiometric(personId: number, finger: Finger) {
    // Procura se já tem cadastro desse dedo seu
    const existing = await prisma.peopleBiometrics.findFirst({
      where: {
        person_id: personId,
        biometric: { finger },
      },
    });

    // Se já tiver cadastrado, barra aqui pra não ter duas digitais do mesmo dedo
    if (existing) {
      throw new Error("Já existe biometria cadastrada para este dedo");
    }
  }

  // Cria o registro da sua digital no banco de dados

  private async createBiometricRecord(
    personId: number,
    template: Buffer,
    finger: Finger,
    unitId: number
  ): Promise<BiometricResult> {
    // Primeiro cria o registro da digital em si
    const newBiometric = await prisma.biometric.create({
      data: {
        template,
        finger,
        registration_unit: {
          connect: { id: unitId },
        },
      },
    });

    // Depois liga essa digital a você (associação pessoa-biometria)
    await prisma.peopleBiometrics.create({
      data: {
        person_id: personId,
        biometric_id: newBiometric.id,
      },
    });

    // Retorna só as informações essenciais (sem o template por segurança)
    return {
      id: newBiometric.id,
      person_id: personId,
      finger: newBiometric.finger,
      created_at: newBiometric.registration_date,
    };
  }
}

