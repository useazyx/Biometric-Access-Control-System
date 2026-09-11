/**
 * Normaliza nomes de disciplinas para um formato padrão
 * Remove acentos, converte para minúsculas e capitaliza primeira letra
 */
export function normalizeSubject(subject: string): string {
  if (!subject) return ""
  
  // Remove espaços extras
  let normalized = subject.trim()
  
  // Remove acentos
  normalized = normalized
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
  
  // Converte para minúsculas
  normalized = normalized.toLowerCase()
  
  // Capitaliza primeira letra de cada palavra
  normalized = normalized
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
  
  return normalized
}

/**
 * Normaliza um array de disciplinas
 */
export function normalizeSubjects(subjects: string[]): string[] {
  return subjects.map(normalizeSubject).filter((s) => s)
}

