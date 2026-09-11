/**
 * cpfValidator.ts - valida se um CPF é de verdade ou não
 * # Pra que serve?
 * - Checar se um CPF é válido, usando as regras oficiais (aqueles dígitos no final)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.3.0
 * Data: 2025-04-12 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-03-18): Algoritmo básico de validação
 * - v1.1.0 (2025-04-02): Otimização de performance
 * - v1.2.0 (2025-04-08): Tratamento de CPFs com zeros à esquerda
 * - v1.3.0 (2025-04-12): Validação estrita de dígitos repetidos
 */

export function validateCPF(cpf: string): boolean {
  // Tira tudo que não é número (pontos, traços, etc)
  const cleanCPF = cpf.replace(/\D/g, "");

  // Primeiro, verifica se tem 11 dígitos e se não é tudo repetido (tipo 111.111.111-11)
  if (isInvalidLength(cleanCPF) || isRepeatedDigits(cleanCPF)) {
    return false;
  }

  // Transforma a string em uma lista de números (pra fazer as contas)
  const digits = cleanCPF.split("").map(Number);

  // Calcula o primeiro dígito de verificação (aquele depois do traço)
  const firstVerifier = calculateVerifierDigit(digits.slice(0, 9), 10);
  // Calcula o segundo dígito, incluindo o primeiro que a gente acabou de calcular
  const secondVerifier = calculateVerifierDigit(digits.slice(0, 10), 11);

  // Confere se os dígitos calculados batem com os que foram informados
  return firstVerifier === digits[9] && secondVerifier === digits[10];
}

function calculateVerifierDigit(
  digits: number[],
  initialWeight: number
): number {
  // Faz a soma: cada dígito multiplicado pelo peso (que vai diminuindo)
  const sum = digits.reduce(
    (acc, digit, index) => acc + digit * (initialWeight - index),
    0
  );

  // Calcula o resto da divisão por 11 e decide o dígito
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

// Verifica se o CPF não tem 11 dígitos (tamanho errado = inválido)

function isInvalidLength(cpf: string): boolean {
  // CPF tem que ter 11 números, nem mais nem menos
  return cpf.length !== 11;
}

// Verifica se o CPF é tudo o mesmo número (tipo 111.111.111-11) - isso é inválido!

function isRepeatedDigits(cpf: string): boolean {
  // Usa uma regex pra ver se todos os dígitos são iguais
  return /^(\d)\1{10}$/.test(cpf);
}
