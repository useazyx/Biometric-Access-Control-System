/**
 * ChangePasswordService.ts - Troca senha quando o usuário está logado
 * # Pra que serve?
 * - Permitir troca de senha para usuários autenticados
 * - Validar senha atual antes de trocar
 * - Limpar senhas temporárias após troca
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2025-07-25 (Criado)
 * Alterações:
 * - v1.0.0 (2025-07-25): Implementação inicial do serviço
 */

import { prisma } from "../../config/prisma";
import bcrypt from "bcrypt";

// O que precisamos pra trocar senha:
interface ChangePasswordProps {
  userId: number;
  currentPassword: string;
  newPassword: string;
}

// Serviço que cuida da troca de senha para usuários logados

export class ChangePasswordService {
  // Processa a troca de senha

  async execute({ userId, currentPassword, newPassword }: ChangePasswordProps) {
    // 1. Busca o usuário e verifica se ele existe
    const person = await this.getValidPerson(userId);
    // 2. Valida a senha atual (pode ser temporária ou principal)
    await this.validateCurrentPassword(currentPassword, person.system_access_hash, person.temporary_password);
    // 3. Testa se a senha nova é forte o suficiente
    this.validatePasswordStrength(newPassword);
    // 4. Atualiza a senha e limpa a temporária
    await this.updatePassword(userId, newPassword);

    return {
      message: "Senha alterada com sucesso!",
    };
  }

  // Pega o usuário do banco

  private async getValidPerson(userId: number) {
    const person = await prisma.person.findUnique({
      where: { id: userId },
    });

    // Se não achou, não tem usuário com esse ID
    if (!person) {
      throw new Error("Usuário não encontrado");
    }
    return person;
  }

  // Valida a senha atual (pode ser temporária ou principal)

  private async validateCurrentPassword(
    currentPassword: string,
    passwordHash: string | null,
    temporaryPassword: string | null
  ) {
    // Se não tem senha definida no sistema, não pode trocar
    if (!passwordHash && !temporaryPassword) {
      throw new Error("Usuário não possui senha definida");
    }

    // Primeiro tenta validar com a senha temporária (se existir)
    if (temporaryPassword && currentPassword === temporaryPassword) {
      return; // Senha temporária válida
    }

    // Se não bateu com a temporária, tenta com a senha principal
    if (passwordHash) {
      const passwordMatch = await bcrypt.compare(currentPassword, passwordHash);
      if (passwordMatch) {
        return; // Senha principal válida
      }
    }

    // Se não bateu com nenhuma, senha atual incorreta
    throw new Error("Senha atual incorreta");
  }

  // Testa se a senha nova é forte o bastante

  private validatePasswordStrength(password: string) {
    const minLength = 8;
    // Lista de exigências pra senha ser considerada forte
    const requirements = [
      {
        test: password.length >= minLength,
        message: `A senha deve ter pelo menos ${minLength} caracteres`,
      },
      {
        test: /[A-Z]/.test(password),
        message: "A senha deve conter pelo menos uma letra maiúscula",
      },
      {
        test: /[a-z]/.test(password),
        message: "A senha deve conter pelo menos uma letra minúscula",
      },
      {
        test: /[0-9]/.test(password),
        message: "A senha deve conter pelo menos um número",
      },
      {
        test: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        message: "A senha deve conter pelo menos um caractere especial",
      },
    ];

    // Encontra a primeira regra que a senha não cumpriu
    const failedRequirement = requirements.find((req) => !req.test);
    if (failedRequirement) throw new Error(failedRequirement.message);
  }

  // Atualiza a senha no banco

  private async updatePassword(userId: number, newPassword: string) {
    // Transforma a senha num hash seguro (com bcrypt, 10 rodadas de sal)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualiza a senha e limpa a temporária
    await prisma.person.update({
      where: { id: userId },
      data: {
        system_access_hash: hashedPassword,
        temporary_password: null, // Remove a senha temporária
        password_reset_at: new Date(),
      },
    });
  }
}

