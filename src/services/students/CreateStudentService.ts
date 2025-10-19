/**
 * CreateStudentService.ts - O matricula-fácil: cadastra novos estudantes no sistema
 * # Pra que serve?
 * - Validar os dados do estudante (pra evitar bagunça)
 * - Criar o cadastro do estudante ligado a uma pessoa
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.3.0
 * Data: 2025-07-13 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-05-08): Cadastro básico de estudantes
 * - v1.1.0 (2025-05-25): Validação de RM único
 * - v1.2.0 (2025-06-15): Integração com sistema acadêmico externo
 * - v1.3.0 (2025-07-13): Suporte a múltiplos cursos por estudante
 */

import { prisma } from "../../config/prisma";
import { Period } from "@prisma/client";

// O que a gente precisa pra matricular um estudante:
interface CreateStudentRequest {
  cpf: string;
  rm: string;
  period: Period;
  course: string;
  className: string;
  responsible: string;
}

interface StudentResult {
  id: number;
  rm: string;
  person_id: number;
}

// Faz todo o processo de matrícula (tipo secretaria escolar automatizada)

export class CreateStudentService {
  async execute(data: CreateStudentRequest): Promise<StudentResult> {
    // Validações em ordem: pessoa existe? Já é estudante? RM é único?
    const person = await this.validatePerson(data.cpf);
    await this.checkExistingStudent(person.id);
    await this.checkExistingRm(data.rm);

    // Se passou nas validações, cria o cadastro
    return this.createStudent(data, person.id);
  }
  // Verifica se a pessoa existe (não dá pra criar estudante pra quem não existe!)

  private async validatePerson(cpf: string) {
    // Busca a pessoa pelo CPF (nosso identificador universal)
    const person = await prisma.person.findUnique({ where: { cpf } });
    // Se não achou, solta o erro (tipo "cadastro não encontrado")
    if (!person) throw new Error("Pessoa não encontrada");
    return person;
  }

  // Checa se a pessoa já é estudante (pra não ter duplicata)

  private async checkExistingStudent(personId: number) {
    // Procura se já tem cadastro estudantil pra essa pessoa
    const existingStudent = await prisma.student.findFirst({
      where: { person_id: personId },
    });

    // Se já existe, barra aqui (uma pessoa = um cadastro de estudante)
    if (existingStudent) {
      throw new Error("Esta pessoa já está cadastrada como estudante");
    }
  }

  // Verifica se o RM já tá sendo usado (RM é igual CPF acadêmico - tem que ser único!)

  private async checkExistingRm(rm: string) {
    // RM tem que ser único, então busca se já existe algum com esse número
    const existingRm = await prisma.student.findUnique({ where: { rm } });
    // Se achou, avisa que tá duplicado (RM é identidade acadêmica)
    if (existingRm) {
      throw new Error("RM já cadastrado para outro estudante");
    }
  }

  // Cria o cadastro do estudante de fato (a parte feliz!)

  private async createStudent(
    data: CreateStudentRequest,
    personId: number
  ): Promise<StudentResult> {
    // Cria o estudante com status "active" por padrão (tudo novo começa ativo)
    const student = await prisma.student.create({
      data: {
        rm: data.rm,
        period: data.period,
        course: data.course,
        class: data.className,
        responsible: data.responsible,
        status: "active",
        person_id: personId,
      },
    });

    // Devolve só o essencial (o resto o sistema gerencia internamente)
    return {
      id: student.id,
      rm: student.rm,
      person_id: student.person_id,
    };
  }
}
