/**
 * passwordGenerator.ts - cria senhas seguras pra você
 * # Pra que serve?
 * - Gerar senhas temporárias difíceis de adivinhar
 * - Garantir que tenham letras, números e símbolos (tipo um quebra-cabeça)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.2.0
 * Data: 2025-04-10 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-03-28): Geração básica de senhas aleatórias
 * - v1.1.0 (2025-04-05): Garantia de caracteres obrigatórios
 * - v1.2.0 (2025-04-10): Algoritmo de embaralhamento melhorado
 */

export function generateTemporaryPassword(): string {
  // Conjuntos de caracteres sem letras/números confusos (tipo 1, l, I, 0, O)
  const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const LOWERCASE = "abcdefghjkmnpqrstuvwxyz";
  const NUMBERS = "23456789";
  const SYMBOLS = "!@#$%&*";
  const ALL_CHARS = UPPERCASE + LOWERCASE + NUMBERS + SYMBOLS;
  const PASSWORD_LENGTH = 12;

  // Garante que vai ter pelo menos um de cada tipo (letra, número, símbolo)
  const passwordChars = [
    getRandomChar(UPPERCASE),
    getRandomChar(LOWERCASE),
    getRandomChar(NUMBERS),
    getRandomChar(SYMBOLS),
  ];

  // Preenche o resto da senha com qualquer caractere permitido
  for (let i = passwordChars.length; i < PASSWORD_LENGTH; i++) {
    passwordChars.push(getRandomChar(ALL_CHARS));
  }

  // Mistura tudo como um baralho pra ficar imprevisível
  return shuffleArray(passwordChars).join("");
}

// Pega um caractere aleatório de um conjunto (tipo sortear um papelzinho)

function getRandomChar(charSet: string): string {
  // Escolhe uma posição qualquer dentro das opções disponíveis
  return charSet[Math.floor(Math.random() * charSet.length)];
}
// Embaralha no array
function shuffleArray<T>(array: T[]): T[] {
  // Faz uma cópia pra não bagunçar o array original
  const shuffled = [...array];

  // Vai de trás pra frente trocando posições aleatórias
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Escolhe uma posição aleatória entre o começo e onde estamos
    const j = Math.floor(Math.random() * (i + 1));
    // Troca os dois de lugar
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
