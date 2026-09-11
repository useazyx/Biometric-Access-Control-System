/**
 * personSearch.ts - Monta o filtro de busca textual usado pelas listagens
 * # Pra que serve?
 * - Deixar as telas de listagem procurarem por nome, e-mail ou CPF num campo só
 * - Ter a regra de busca escrita UMA vez, em vez de repetida em cada serviço
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Primeira versão, junto com o campo de busca das listagens
 */

import type { Prisma } from "@prisma/client"

// O CPF fica salvo formatado no banco ("445.044.878-29"), mas quase todo mundo digita
// só os números. Então, quando a busca é só dígito, a gente procura pelas duas formas.
function cpfVariants(search: string): string[] {
  const digits = search.replace(/\D/g, "")

  // Não é uma busca por CPF: não vale a pena inventar variação
  if (digits.length < 3 || digits.length !== search.length) return [search]

  // Formata do jeito que o banco guarda, na medida do que a pessoa já digitou
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean)
  const checkDigits = digits.slice(9, 11)
  const formatted = parts.join(".") + (checkDigits ? `-${checkDigits}` : "")

  return [search, formatted]
}

/**
 * Devolve o pedaço de `where` que filtra uma Person pelo texto buscado.
 * Sem busca, devolve um objeto vazio — que o Prisma simplesmente ignora.
 */
export function personSearchFilter(search?: string): Prisma.PersonWhereInput {
  if (!search) return {}

  const conditions: Prisma.PersonWhereInput[] = [
    { full_name: { contains: search, mode: "insensitive" } },
    { email: { contains: search, mode: "insensitive" } },
    ...cpfVariants(search).map((variant) => ({ cpf: { contains: variant } })),
  ]

  return { OR: conditions }
}
