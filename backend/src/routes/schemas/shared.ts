/**
 * shared.ts - Os pedacinhos de validação que a gente reusa em várias rotas
 * # Pra que serve?
 * - Guardar num lugar só as validações que aparecem em vários endpoints (CPF, data, senha...)
 * - Evitar copiar e colar a mesma regra em 10 arquivos diferentes
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2026-09-09): Extraído do routes.ts antigo (que tinha 1227 linhas) e migrado pro Zod 4
 */

import z from "zod"
import { validateCPF } from "../../utils/cpfValidator"

// Lista dos dedos que o sensor R307 aceita (tem que bater com o enum Finger do Prisma)
export const FINGERS = [
  "thumb_right",
  "index_right",
  "middle_right",
  "ring_right",
  "pinky_right",
  "thumb_left",
  "index_left",
  "middle_left",
  "ring_left",
  "pinky_left",
] as const

// Tipos de pessoa que o sistema conhece (tem que bater com o enum PersonType do Prisma)
export const PERSON_TYPES = ["student", "teacher", "employee", "coordinator", "inspector", "visitor"] as const

// Tipos de unidade: Fatec (faculdade) ou Etec (escola técnica)
export const UNIT_TYPES = ["Fatec", "Etec"] as const

// Períodos de aula
export const PERIODS = ["morning", "afternoon", "night", "integral"] as const

// Situação do aluno
export const STUDENT_STATUSES = ["active", "inactive", "transferred"] as const

// Tipos de evento de acesso: entrou ou saiu
export const EVENT_TYPES = ["entry", "exit"] as const

// CPF: limpa a pontuação, confere o tamanho e passa pela conta dos dígitos verificadores
export const CPF_SCHEMA = z
  .string()
  .transform((val) => val.replace(/\D/g, "")) // Tira tudo que não é número do CPF
  .refine((val) => val.length === 11, { message: "CPF precisa ter 11 dígitos" })
  .refine(validateCPF, { message: "CPF inválido" }) // Testa se é um CPF de verdade

// Data no padrão ISO curtinho (só o dia, sem hora)
export const DATE_SCHEMA = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Data no formato errado (use YYYY-MM-DD)",
})

// Código de unidade: 6 caracteres, começando com FAT ou ETE
export const UNIT_CODE_SCHEMA = z
  .string()
  .length(6, { message: "Código da unidade precisa ter 6 caracteres" })
  .regex(/^(FAT|ETE)\d{3}$/, {
    // Formato tipo FAT001 ou ETE001
    message: "Formato inválido (ex: FAT001 ou ETE001)",
  })

// Senha forte: tamanho mínimo e um pouco de cada tipo de caractere
export const PASSWORD_SCHEMA = z
  .string()
  .min(8, { message: "Senha muito curta (min 8 caracteres)" })
  .refine((password) => /[A-Z]/.test(password), {
    message: "Falta uma letra MAIÚSCULA",
  })
  .refine((password) => /[a-z]/.test(password), {
    message: "Falta uma letra minúscula",
  })
  .refine((password) => /[0-9]/.test(password), {
    message: "Falta um número",
  })
  .refine((password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), {
    message: "Falta um caracter especial (!@#$...)",
  })

// E-mail com limite de tamanho (o banco guarda no máximo 100 caracteres)
export const EMAIL_SCHEMA = z
  .string()
  .email({ message: "Email com formato errado" })
  .max(100, { message: "Email muito longo (max 100)" })

// Telefone: só limita o tamanho, porque o formato varia demais
export const PHONE_SCHEMA = z.string().max(20, { message: "Telefone muito longo (max 20)" })

// Nome completo: nem curto demais nem maior do que o banco aguenta
export const FULL_NAME_SCHEMA = z
  .string()
  .min(3, { message: "Nome muito curto (min 3 caracteres)" })
  .max(100, { message: "Nome muito longo (max 100)" })

// Paginação: vem como texto na query string, então a gente converte pra número na hora
// O coerce resolve o "20" -> 20 sozinho, e o default entra quando o campo não vem
export const PAGE_SCHEMA = z.coerce.number().int().min(1, { message: "Página começa no 1" }).default(1)

export const PAGE_SIZE_SCHEMA = z.coerce
  .number()
  .int()
  .min(1, { message: "Tamanho de página começa no 1" })
  .max(100, { message: "Tamanho de página máximo: 100" })
  .default(20)

// Junta os dois campos de paginação, porque quase toda listagem usa os mesmos
export const PAGINATION_SCHEMA = {
  page: PAGE_SCHEMA,
  page_size: PAGE_SIZE_SCHEMA,
}

// Busca textual das listagens. Vem vazia quando a pessoa limpa o campo, e nesse caso
// a gente trata como "sem busca" em vez de procurar por string vazia.
export const SEARCH_SCHEMA = z
  .string()
  .trim()
  .max(100, { message: "Busca muito longa (max 100)" })
  .optional()
  .transform((value) => (value ? value : undefined))

// Como toda resposta de listagem paginada termina (pro front saber onde está)
export const PAGINATION_RESPONSE = {
  total: z.number(),
  current_page: z.number(),
  total_pages: z.number(),
}

// Formato padrão de erro da API: um código curto pra máquina e uma mensagem pra pessoa
export const ERROR_RESPONSE = z.object({
  error: z.string(),
  message: z.string().optional(),
})
