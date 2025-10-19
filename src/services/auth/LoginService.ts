/**
 * loginService.ts - O porteiro digital: verifica credenciais e dá acesso
 * # Pra que serve?
 * - Checar se o email e senha estão corretos
 * - Criar o token de acesso (JWT) pra sessão
 * - Registrar que o usuário entrou no sistema
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2025-06-20 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-05-15): Validação básica de email/senha
 * - v1.1.0 (2025-05-25): Implementação JWT e registro de acesso
 * - v1.2.0 (2025-06-05): Adicionada verificação de tipo de usuário
 * - v1.3.0 (2025-06-15): Validação de status da conta (ativa/inativa)
 * - v2.0.0 (2025-06-20): Refatoração completa com logs detalhados
 */

import { prisma } from "../../config/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  PersonType,
  EventType,
  Person,
  Employee,
  Role,
  Unit,
} from "@prisma/client";

// O que precisamos pra fazer login:
interface LoginProps {
  email: string;
  password: string;
  deviceInfo?: string;
}

// O que a gente devolve quando o login dá certo:
interface LoginResult {
  token: string;
  person: any;
  requires_password_change: boolean;
  access_log_id: number;
}

// Define os dados extras que buscamos na pessoa
type AuthPerson = Person & {
  employee?:
    | (Employee & {
        role?: Role;
      })
    | null;
  registration_unit?: Unit | null;
};

// Serviço que cuida do login: valida quem pode entrar e dá as chaves

export class LoginService {
  // Faz todo o processo de login, passo a passo

  async execute({
    email,
    password,
    deviceInfo = "Web",
  }: LoginProps): Promise<LoginResult> {
    try {
      // 1. Busca o usuário pelo email e verifica se existe
      const person = await this.findAndValidatePerson(email);

      // 2. Checa se ele tem permissão pra acessar o sistema
      this.validateSystemAccess(person.type);

      // 3. Verifica se a conta dele tá ativa (se for funcionário)
      this.validateAccountStatus(person);

      // 4. Compara a senha com a versão segura guardada
      await this.validatePassword(password, person.system_access_hash, person.temporary_password);

      // 5. Gera o token de acesso (vale por 8 horas)
      const token = this.generateToken(person.id);

      // 6. Registra no diário que ele entrou (com o dispositivo)
      const accessLogId = await this.logAccess(person);

      // 7. Verifica se ele precisa trocar a senha (se nunca trocou ou usou senha temporária)
      const requires_password_change = person.password_reset_at === null || 
                                      !!(person.temporary_password && password === person.temporary_password);

      // Junta tudo e entrega pro usuário!
      return {
        token,
        person,
        requires_password_change,
        access_log_id: accessLogId,
      };
    } catch (error: any) {
      throw error;
    }
  }

  // Encontra a pessoa pelo email e valida se existe

  private async findAndValidatePerson(email: string): Promise<AuthPerson> {
    try {
      // Busca a pessoa no banco, trazendo também dados de funcionário e unidade
      const person = await prisma.person.findUnique({
        where: {
          email: email,
        },
        include: {
          employee: {
            include: {
              role: true,
            },
          },
          registration_unit: true,
        },
      });

      // Se não achou, email errado ou usuário não existe
      if (!person) {
        throw new Error("Credenciais inválidas");
      }

      return person;
    } catch (error: any) {
      throw error;
    }
  }

  // Verifica se o tipo de pessoa pode acessar o sistema

  private validateSystemAccess(personType: PersonType) {
    // Quem pode entrar: coordenadores, funcionários e inspetores
    const allowedTypes: PersonType[] = [
      PersonType.coordinator,
      PersonType.employee,
      PersonType.inspector,
    ];

    // Se o tipo não estiver na lista, barra na hora
    if (!allowedTypes.includes(personType)) {
      throw new Error("Acesso restrito à coordenação e funcionários");
    }
  }

  // Checa se a conta da pessoa tá ativa (especialmente pra funcionários)

  private validateAccountStatus(person: AuthPerson) {
    // Se for funcionário e a conta tiver desativada, não deixa entrar
    if (
      person.type === PersonType.employee &&
      person.employee &&
      !person.employee.active
    ) {
      throw new Error("Conta de funcionário desativada");
    }
  }

  // Valida a senha: compara a digitada com a guardada (de forma segura)
  // Também verifica se é uma senha temporária válida

  private async validatePassword(
    password: string,
    passwordHash: string | null,
    temporaryPassword: string | null = null
  ) {
    // Se não tem senha definida no sistema, não pode entrar
    if (!passwordHash && !temporaryPassword) {
      throw new Error("Usuário não possui senha definida");
    }

    // Primeiro tenta validar com a senha temporária (se existir)
    if (temporaryPassword && password === temporaryPassword) {
      return; // Senha temporária válida
    }

    // Se não bateu com a temporária, tenta com a senha principal
    if (passwordHash) {
      const passwordMatch = await bcrypt.compare(password, passwordHash);
      if (passwordMatch) {
        return; // Senha principal válida
      }
    }

    // Se não bateu com nenhuma, credenciais inválidas
    throw new Error("Credenciais inválidas");
  }

  // Gera o token JWT (a chave de acesso)

  private generateToken(userId: number) {
    // Pega a chave secreta do ambiente (se não tiver, problema sério!)
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET não configurado no ambiente");
    }

    try {
      // Gera o token com o ID do usuário e validade de 8h
      const token = jwt.sign({ id: userId }, secret, { expiresIn: "8h" });
      return token;
    } catch (error: any) {
      throw error;
    }
  }

  // Registra no diário que a pessoa entrou (pra saber quem acessou quando)

  private async logAccess(person: AuthPerson) {
    try {
      // Cria o registro de acesso no banco
      const accessLog = await prisma.webAccessLog.create({
        data: {
          login_time: new Date(),
          event_type: EventType.entry,
          person_id: person.id,
          unit_id: person.registration_unit_id,
          // deviceInfo não é mais necessário na WebAccessLog para login
        },
      });

      return accessLog.id;
    } catch (error: any) {
      return 0;
    }
  }
}
