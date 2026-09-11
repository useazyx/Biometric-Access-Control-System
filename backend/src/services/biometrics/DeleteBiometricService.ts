/**
 * DeleteBiometricService.ts - O apagador de digitais: remove sua biometria do sistema
 * # Pra que serve?
 * - Encontrar e apagar sua digital cadastrada
 * - Limpar os rastros de associação com você
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.1.0
 * Data: 2025-07-10 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-07-05): Implementação inicial da exclusão
 * - v1.1.0 (2025-07-10): Validação de existência da biometria
 */

import { prisma } from "../../config/prisma";
import { Finger, PeopleBiometrics, Biometric } from "@prisma/client";

// O que a gente devolve quando apaga sua digital:
interface DeleteResult {
  message: string;
}

// Serviço que remove sua digital - tipo um botão de "esquecer digital"

export class DeleteBiometricService {
  // Apaga sua digital do sistema

  async execute(cpf: string, finger: Finger): Promise<DeleteResult> {
    // 1. Primeiro acha você pelo CPF
    const person = await this.getPersonByCpf(cpf);
    // 2. Procura o cadastro da digital desse dedo
    const biometricLink = await this.getBiometricLink(person.id, finger);
    // 3. Apaga tudo relacionado a essa digital
    await this.deleteRecords(biometricLink);

    return { message: "Biometria excluída com sucesso" };
  }

  // Te encontra no sistema pelo CPF

  private async getPersonByCpf(cpf: string) {
    // Busca você no banco pelo CPF
    const person = await prisma.person.findUnique({ where: { cpf } });

    // Se não achou, você não tá cadastrado
    if (!person) {
      throw new Error("Pessoa não encontrada");
    }
    return person;
  }

  // Procura o cadastro da sua digital pro dedo específico

  private async getBiometricLink(personId: number, finger: Finger) {
    // Procura o cadastro que liga você à digital desse dedo
    const biometricLink = await prisma.peopleBiometrics.findFirst({
      where: {
        person_id: personId,
        biometric: { finger },
      },
      include: { biometric: true },
    });

    // Se não achou, esse dedo não tá cadastrado
    if (!biometricLink) {
      throw new Error("Biometria não encontrada para este dedo");
    }
    return biometricLink;
  }

  // Apaga tudo relacionado à sua digital

  private async deleteRecords(
    biometricLink: PeopleBiometrics & { biometric: Biometric }
  ) {
    // Separa os IDs que a gente precisa
    const { person_id, biometric_id, biometric } = biometricLink;

    // Faz duas operações juntas (se uma falhar, cancela tudo)
    await prisma.$transaction([
      // 1. Apaga o link entre você e a digital
      prisma.peopleBiometrics.delete({
        where: {
          person_id_biometric_id: {
            person_id,
            biometric_id,
          },
        },
      }),
      // 2. Apaga a digital em si do banco
      prisma.biometric.delete({
        where: { id: biometric.id },
      }),
    ]);
  }
}
