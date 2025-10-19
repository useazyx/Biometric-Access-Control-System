/**
 * GetPersonService.ts - O detetive de pessoas: busca tudo sobre alguém pelo CPF
 * # Pra que serve?
 * - Encontrar uma pessoa pelo CPF (tipo um buscador de dados)
 * - Organizar as informações num formato fácil de entender
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.3.0
 * Data: 2025-07-17 (Atualizado)
 * Alterações:
 * - v1.0.0 (2025-03-18): Busca básica de informações de pessoa
 * - v1.1.0 (2025-04-02): Inclusão de dados relacionados (estudante, funcionário, etc)
 * - v1.2.0 (2025-07-13): Otimização de consultas com JOINs eficientes
 * - v1.2.1 (2025-07-17): Correção na formatação do CPF e simplificação da consulta
 * - v1.3.0 (2025-07-17): Tratamento robusto de serialização (datas e campos nulos)
 */

import { prisma } from "../../config/prisma";
import { Person, Student, Employee, Visitor, Unit } from "@prisma/client";

// Como a gente quer devolver os dados da pessoa (tipo um retrato falado)
interface PersonDetails {
  id: number;
  full_name: string;
  birth_date: string | null; // Agora é string (ISO)
  cpf: string;
  email: string | null;
  phone: string | null;
  type: string;
  main_unit_type: string | null;
  registration_unit: {
    id: number;
    name: string;
    unit_code: string;
  } | null;
  student: {
    id: number;
    rm: string;
    status: string;
  } | null;
  employee: {
    id: number;
    registration_number: string;
  } | null;
  visitor: {
    id: number;
    company: string | null;
  } | null;
}

// Busca os dados completos de uma pessoa (tipo um dossiê)
export class GetPersonService {
  async execute(inputCpf: string): Promise<PersonDetails> {
    // Normaliza o CPF (remove formatação)
    const normalizedCpf = this.normalizeCpf(inputCpf);
    console.log(`Buscando pessoa com CPF normalizado: ${normalizedCpf}`);

    try {
      const person = await this.getPersonWithRelations(normalizedCpf);
      return this.formatPersonDetails(person);
    } catch (error) {
      console.error("Erro no GetPersonService:", error);
      throw new Error("Erro ao buscar pessoa");
    }
  }

  private normalizeCpf(cpf: string): string {
    // Remove todos os não-dígitos
    return cpf.replace(/\D/g, "");
  }

  // Busca a pessoa no banco, trazendo todas as informações adicionais (tudo junto e misturado)
  private async getPersonWithRelations(cpf: string) {
    // Uma única busca no banco, trazendo tudo de uma vez (pra ser eficiente)
    const person = await prisma.person.findUnique({
      where: { cpf },
      include: {
        student: true,
        employee: true,
        visitor: true,
        registration_unit: true,
      },
    });

    // Se não achou, já solta o erro
    if (!person) {
      console.log(`Pessoa com CPF ${cpf} não encontrada`);
      throw new Error("Pessoa não encontrada");
    }
    console.log(`Pessoa encontrada: ${person.full_name}`);
    return person;
  }

  // Monta os dados da pessoa no formato que a gente precisa (tipo arrumar a mesa pro jantar)
  private formatPersonDetails(
    person: Person & {
      student: Student | null;
      employee: Employee | null;
      visitor: Visitor | null;
      registration_unit: Unit | null;
    }
  ): PersonDetails {
    // Função para garantir que campos sejam null em vez de undefined
    const safeValue = <T>(value: T | null | undefined): T | null => {
      return value !== undefined ? value : null;
    };

    // Função para converter datas para ISO string
    const safeDate = (date: Date | null): string | null => {
      return date ? date.toISOString() : null;
    };

    // Monta o objeto resposta, pegando só o que interessa de cada parte
    return {
      id: person.id,
      full_name: person.full_name,
      birth_date: safeDate(person.birth_date),
      cpf: person.cpf,
      email: safeValue(person.email),
      phone: safeValue(person.phone),
      type: person.type,
      main_unit_type: safeValue(person.main_unit_type),
      // Formata a unidade de registro (se existir)
      registration_unit: person.registration_unit
        ? {
            id: person.registration_unit.id,
            name: person.registration_unit.name,
            unit_code: person.registration_unit.unit_code,
          }
        : null,

      // Se for estudante, pega os dados específicos
      student: person.student
        ? {
            id: person.student.id,
            rm: person.student.rm,
            status: person.student.status,
          }
        : null,
      // Se for funcionário, pega o número de matrícula
      employee: person.employee
        ? {
            id: person.employee.id,
            registration_number: person.employee.registration_number,
          }
        : null,
      // Se for visitante, pega a empresa (se tiver)
      visitor: person.visitor
        ? {
            id: person.visitor.id,
            company: safeValue(person.visitor.company),
          }
        : null,
    };
  }
}