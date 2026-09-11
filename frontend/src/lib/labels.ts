/**
 * labels.ts - Traduz os códigos da API para o português que aparece na tela
 * # Pra que serve?
 * - Ter UM lugar que diz que "index_right" é "Indicador direito"
 * - Guardar junto o tom de cor de cada estado, pra etiqueta não inventar cor
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Primeira versão, junto com o painel novo
 */

import type {
  EventType,
  Finger,
  Period,
  PersonType,
  StudentStatus,
  UnitType,
} from "@/types/api"

/** O tom define a cor da etiqueta; cada tom sai de um token do index.css. */
export type Tone = "neutral" | "primary" | "authorized" | "denied" | "pending" | "exit"

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  student: "Aluno",
  teacher: "Professor",
  employee: "Funcionário",
  coordinator: "Coordenador",
  inspector: "Inspetor",
  visitor: "Visitante",
}

export const PERIOD_LABELS: Record<Period, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  night: "Noite",
  integral: "Integral",
}

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  transferred: "Transferido",
}

export const STUDENT_STATUS_TONES: Record<StudentStatus, Tone> = {
  active: "authorized",
  inactive: "neutral",
  transferred: "pending",
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  entry: "Entrada",
  exit: "Saída",
}

export const EVENT_TYPE_TONES: Record<EventType, Tone> = {
  entry: "primary",
  exit: "exit",
}

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  Etec: "Etec",
  Fatec: "Fatec",
}

export const FINGER_LABELS: Record<Finger, string> = {
  thumb_right: "Polegar direito",
  index_right: "Indicador direito",
  middle_right: "Médio direito",
  ring_right: "Anelar direito",
  pinky_right: "Mínimo direito",
  thumb_left: "Polegar esquerdo",
  index_left: "Indicador esquerdo",
  middle_left: "Médio esquerdo",
  ring_left: "Anelar esquerdo",
  pinky_left: "Mínimo esquerdo",
}

/**
 * Traduz com segurança: se a API mandar um valor que a gente não conhece, mostra o
 * valor cru em vez de quebrar a tela ou escrever "undefined".
 */
export function labelOf<T extends string>(
  dictionary: Record<T, string>,
  value: T | string | null | undefined,
): string {
  if (!value) return "—"
  return (dictionary as Record<string, string>)[value] ?? value
}

/** Só os tipos de pessoa que têm login no sistema web. */
export const WEB_ACCESS_TYPES: PersonType[] = ["coordinator", "employee", "inspector"]
