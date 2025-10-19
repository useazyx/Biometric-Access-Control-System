/**
 * CreatePersonController.ts - Cuida do cadastro de pessoas no sistema
 * # Pra que serve?
 * - Recebe os dados de uma nova pessoa e valida tudo certinho
 * - Salva no banco se estiver tudo ok e avisa o front
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.5.0
 * Data: 2025-06-10 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-04-15): Implementação inicial
 * - v1.1.0 (2025-04-25): Validação de CPF aprimorada
 * - v1.2.0 (2025-05-05): Suporte a múltiplas unidades
 * - v1.3.0 (2025-05-20): Tratamento de erros de duplicidade
 * - v1.4.0 (2025-05-30): Validação de data de nascimento refinada
 * - v1.5.0 (2025-06-10): Integração com sistema de auditoria
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { CreatePersonService } from "../../services/people/CreatePersonService";
import { prisma } from "../../config/prisma";
import { validateCPF } from "../../utils/cpfValidator";
import { PersonType } from "@prisma/client";

// Cuida de todo o processo de cadastro de uma pessoa (desde a validação até salvar)
export class CreatePersonController {
  // Processa o pedido de cadastro (rota que o sistema chama pra adicionar alguém)

  async handle(req: FastifyRequest, rep: FastifyReply) {
    // Pega os dados do corpo da requisição (tudo que o front mandou)
    const {
      full_name,
      birth_date,
      cpf: rawCpf,
      email,
      phone,
      type,
      main_unit_type,
      unit_code,
    } = req.body as any;

    // Limpa o CPF (tira pontos e traços, deixa só os números)
    const cpf = this.cleanCpf(rawCpf);

    // Faz as validações uma por uma - se alguma falhar, já responde com erro
    if (!this.validateCpf(cpf, rep)) return;
    const unitCodeString = this.validateUnitCode(unit_code, rep);
    if (!unitCodeString) return;
    const birthDateResult = this.validateBirthDate(birth_date, rep);
    if (!birthDateResult.valid) return;
    const birthDateObj = birthDateResult.value;

    try {
      // Verifica se a unidade existe no banco (pra não cadastrar em lugar que não existe)
      const unit = await this.findUnit(unitCodeString, rep);
      if (!unit) return;

      // Manda o serviço criar a pessoa (ele que fala com o banco e faz a mágica)
      const createPersonService = new CreatePersonService();
      const result = await createPersonService.execute({
        full_name,
        birth_date: birthDateObj,
        cpf,
        email,
        phone,
        type: type as PersonType,
        main_unit_type,
        registration_unit_id: unit.id,
      });

      // Se deu tudo certo, manda a resposta de sucesso com os dados
      return rep.code(201).send(result);
    } catch (error: any) {
      // Se deu erro no serviço, trata de um jeito amigável
      this.handleServiceError(error, rep);
    }
  }

  // Limpa o CPF: tira tudo que não é número (pontos, traços, espaços)
  private cleanCpf(rawCpf: string): string {
    return rawCpf.replace(/\D/g, "");
  }

  // Valida o CPF: usa aquela lógica matemática pra ver se é válido mesmo
  private validateCpf(cpf: string, rep: FastifyReply): boolean {
    if (!validateCPF(cpf)) {
      rep.status(400).send({
        error: "InvalidCPF",
        message: "CPF inválido - confere os números aí!",
      });
      return false;
    }
    return true;
  }

  // Valida o código da unidade: precisa existir e não pode ser vazio
  private validateUnitCode(unit_code: any, rep: FastifyReply): string | null {
    // Se não veio código, avisa
    if (unit_code === undefined || unit_code === null) {
      rep.status(400).send({
        error: "MissingUnitCode",
        message: "Opa, faltou o código da unidade!",
      });
      return null;
    }

    // Converte pra string e tira espaços extras
    const unitCodeString = String(unit_code).trim();

    // Se ficou vazio depois de limpar, avisa
    if (!unitCodeString) {
      rep.status(400).send({
        error: "EmptyUnitCode",
        message: "Código da unidade não pode ser só espaços!",
      });
      return null;
    }
    return unitCodeString;
  }

  // Valida a data de nascimento: precisa ser uma data válida e não pode ser no futuro
  private validateBirthDate(
    birth_date: string | null,
    rep: FastifyReply
  ): { valid: boolean; value: Date | null } {
    // Se não veio data, tá de boa (é opcional)
    if (!birth_date) return { valid: true, value: null };

    const birthDateObj = new Date(birth_date);

    // Se a data for inválida (tipo 31 de abril), avisa
    if (isNaN(birthDateObj.getTime())) {
      rep.status(400).send({
        error: "InvalidBirthDate",
        message: "Data de nascimento inválida - coloca no formato certo!",
      });
      return { valid: false, value: null };
    }

    // Pega hoje e zera as horas (pra comparar só a data)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Se a data de nascimento for depois de hoje, não rola!
    if (birthDateObj > today) {
      rep.status(400).send({
        error: "FutureBirthDate",
        message: "Opa, você nasceu no futuro? Data inválida!",
      });
      return { valid: false, value: null };
    }

    return { valid: true, value: birthDateObj };
  }

  // Busca a unidade no banco pelo código (pra ter certeza que existe)
  private async findUnit(unitCode: string, rep: FastifyReply) {
    const unit = await prisma.unit.findUnique({
      where: { unit_code: unitCode },
    });

    // Se não achou, avisa o front
    if (!unit) {
      rep.status(400).send({
        error: "UnitNotFound",
        message: "Código da unidade não existe - cadastra a unidade primeiro!",
      });
      return null;
    }
    return unit;
  }

  // Trata os erros que podem acontecer quando tenta salvar a pessoa
  private handleServiceError(error: any, rep: FastifyReply) {
    // Primeiro, loga o erro pra gente debugar depois
    console.error("Deu ruim no cadastro:", error);

    // Se o erro for sobre CPF duplicado (já existe alguém com esse CPF)
    if (error.message.includes("CPF")) {
      rep.status(400).send({
        error: "DuplicateCPF",
        message: "CPF já cadastrado! Não pode ter duas pessoas com mesmo CPF",
      });
      return;
    }

    // Se o erro for sobre email duplicado (já existe alguém com esse email)
    if (error.message.includes("E-mail")) {
      rep.status(400).send({
        error: "DuplicateEmail",
        message: "E-mail já cadastrado! Usa outro email ou recupera a senha",
      });
      return;
    }

    // Se for outro erro que a gente não conhece, manda genérico
    rep.status(500).send({
      error: "InternalServerError",
      message:
        "Opa, deu um erro inesperado! Tenta de novo ou fala com o suporte",
    });
  }
}
