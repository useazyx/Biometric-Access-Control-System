/**
 * ResetPasswordService.ts - O socorro pra quem esqueceu a senha
 * # Pra que serve?
 * - Validar o pedido de redefinição de senha
 * - Trocar a senha do usuário com segurança
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.3.0
 * Data: 2025-06-30 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-06-10): Fluxo básico de redefinição
 * - v1.1.0 (2025-06-18): Validação de força de senha
 * - v1.2.0 (2025-06-25): Implementação de transações atômicas
 * - v1.3.0 (2025-06-30): Restrição por tipo de usuário
 */

import { prisma } from "../../config/prisma";
import bcrypt from "bcrypt";
import { PersonType, Token } from "@prisma/client";

// Serviço que salva você quando esquece a senha

export class ResetPasswordService {
  // Faz toda a lógica de trocar a senha

  async execute(email: string, token: string, newPassword: string) {
    // 1. Busca o usuário e verifica se ele existe
    const person = await this.getValidPerson(email);
    // 2. Checa se ele pode mesmo trocar a senha (depende do tipo de conta)
    this.validatePersonType(person.type);
    // 3. Valida se o código de segurança tá certo e ainda vale
    const validToken = this.findValidToken(person.tokens, token);
    // 4. Testa se a senha nova é forte o suficiente
    this.validatePasswordStrength(newPassword);
    // 5. Atualiza a senha e invalida o código (pra não usar de novo)
    await this.updatePassword(person.id, validToken.id, newPassword);

    return {
      message:
        "Senha redefinida com sucesso! Você já pode fazer login com sua nova senha",
    };
  }

  // Pega o usuário do banco (com os códigos de segurança dele)

  private async getValidPerson(email: string) {
    // Busca a pessoa no banco, trazendo os códigos de segurança junto
    const person = await prisma.person.findUnique({
      where: { email },
      include: { tokens: true },
    });

    // Se não achou, não tem usuário com esse email
    if (!person) throw new Error("Usuário não encontrado");
    return person;
  }

  // Verifica se o tipo de usuário pode trocar a senha

  private validatePersonType(personType: PersonType) {
    // Quem pode trocar senha: funcionários, coordenadores e inspetores
    const allowedTypes: PersonType[] = [
      PersonType.employee,
      PersonType.coordinator,
      PersonType.inspector,
    ];

    // Se o tipo não tiver na lista, barra na hora
    if (!allowedTypes.includes(personType)) {
      throw new Error("Seu tipo de usuário não permite redefinição de senha");
    }
  }

  // Encontra o código de segurança válido (que não foi usado e não expirou)

  private findValidToken(tokens: Token[], token: string) {
    // Procura um código que: bate com o enviado, não foi usado e ainda vale
    const validToken = tokens.find(
      (t) => t.token === token && !t.used && t.expiration > new Date()
    );

    // Se não achou, o código tá inválido (já usou, expirou ou é fake)
    if (!validToken) {
      throw new Error("Token inválido, expirado ou já utilizado");
    }
    return validToken;
  }

  // Testa se a senha nova é forte o bastante (não deixa colocar "123456")

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

  // Troca a senha de verdade e invalida o código usado

  private async updatePassword(
    personId: number,
    tokenId: number,
    newPassword: string
  ) {
    // Transforma a senha num hash seguro (com bcrypt, 10 rodadas de sal)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Faz duas operações no banco ao mesmo tempo (se uma falhar, cancela tudo)
    await prisma.$transaction([
      // 1. Atualiza a senha do usuário, limpa a senha temporária e marca quando foi trocada
      prisma.person.update({
        where: { id: personId },
        data: {
          system_access_hash: hashedPassword,
          temporary_password: null, // Remove a senha temporária
          password_reset_at: new Date(),
        },
      }),
      // 2. Marca o código como usado (pra não dar pra usar de novo)
      prisma.token.update({
        where: { id: tokenId },
        data: { used: true },
      }),
    ]);
  }
}
