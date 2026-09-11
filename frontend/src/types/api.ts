/**
 * api.ts - Os tipos que espelham exatamente o que a API devolve
 * # Pra que serve?
 * - Ter uma fonte única de verdade sobre o formato de cada resposta
 * - Fazer o TypeScript reclamar quando uma tela lê um campo que não existe
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Escritos a partir do contrato do Swagger (/docs/json)
 *
 * Regra da casa: se a API mudar, muda AQUI primeiro. Nenhuma tela inventa campo.
 */

// --- Enumerações (os mesmos valores do schema.prisma) ---

export const PERSON_TYPES = [
  "student",
  "teacher",
  "employee",
  "coordinator",
  "inspector",
  "visitor",
] as const
export type PersonType = (typeof PERSON_TYPES)[number]

export const UNIT_TYPES = ["Etec", "Fatec"] as const
export type UnitType = (typeof UNIT_TYPES)[number]

export const PERIODS = ["morning", "afternoon", "night", "integral"] as const
export type Period = (typeof PERIODS)[number]

export const STUDENT_STATUSES = ["active", "inactive", "transferred"] as const
export type StudentStatus = (typeof STUDENT_STATUSES)[number]

export const EVENT_TYPES = ["entry", "exit"] as const
export type EventType = (typeof EVENT_TYPES)[number]

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
export type Finger = (typeof FINGERS)[number]

// --- Blocos que se repetem ---

/** Toda listagem paginada devolve estes três campos junto com os itens. */
export interface PageInfo {
  total: number
  current_page: number
  total_pages: number
}

export interface UnitRef {
  id?: number
  unit_code: string
  name: string
}

// --- Autenticação ---

export interface LoginResponse {
  token: string
  person: {
    id: number
    full_name: string
    type: string
    email: string
    unit_id: number
  }
  requires_password_change: boolean
  access_log_id: number
}

/** O que GET /me devolve: é daqui que sai o unit_code que as listagens exigem. */
export interface Me {
  id: number
  full_name: string
  birth_date: string | null
  cpf: string
  email: string
  phone: string | null
  type: PersonType
  main_unit_type: UnitType | null
  registration_unit: UnitRef | null
  student: { id: number; rm: string } | null
  employee: { id: number; registration_number: string } | null
  visitor: { id: number; company: string | null } | null
}

// --- Painel ---

export interface DashboardStatistics {
  totalPeople: number
  totalStudents: number
  totalEmployees: number
  totalUnits: number
  totalVisitors: number
}

/** Quantas pessoas de cada tipo existem. As chaves são os PersonType. */
export type PeopleBreakdown = Record<PersonType, number>

export interface UnitBreakdown {
  fatec: number
  etec: number
  fatec_extension: number
  etec_extension: number
}

// --- Pessoas ---

export interface PersonSummary {
  id: number
  full_name: string
  type: PersonType
  email: string | null
  cpf: string | null
  main_unit_type: UnitType | null
  registration_unit: UnitRef
}

export interface PersonDetail {
  id: number
  full_name: string
  type: PersonType
  email: string
  cpf: string
  main_unit_type: UnitType | null
  birth_date: string | null
  phone: string | null
  registration_unit: UnitRef | null
  student: StudentProfile | null
  employee: EmployeeProfile | null
  visitor: VisitorProfile | null
}

export interface StudentProfile {
  rm: string
  period: Period
  course: string | null
  class: string | null
  status: StudentStatus
}

export interface EmployeeProfile {
  registration_number: string
  active: boolean
  role: { id: number; name: string } | null
}

export interface VisitorProfile {
  company: string | null
  visit_reason: string | null
}

// --- Perfis nas listagens ---
// ATENÇÃO: cada listagem tem um formato PRÓPRIO, conferido contra a resposta real da
// API. Não são variações do mesmo objeto, então não dá pra tratar como se fossem.

export interface StudentRow {
  id: number
  full_name: string
  rm: string
  email: string | null
  person_id: number
  period: Period
  course: string | null
  /** A API chama de class_name porque "class" é palavra reservada em muita linguagem. */
  class_name: string | null
  status: StudentStatus
  registration_unit: UnitRef | null
}

export interface TeacherRow {
  id: number
  full_name: string
  employee_id: number
  person_id: number
  subjects: string[]
  can_teach_fatec: boolean
  can_teach_etec: boolean
}

export interface EmployeeRow {
  id: number
  full_name: string
  registration_number: string
  email: string | null
  cpf: string | null
  active: boolean
  admission_date: string | null
  registration_unit_id: number | null
  person_type: PersonType
  /** Vem como texto puro, não como objeto de cargo. */
  role_name: string | null
}

export interface VisitorRow {
  id: number
  company: string | null
  visit_reason: string | null
  registration_date: string | null
  visit_expiry_date: string | null
  person_id: number
  responsible_employee_id: number | null
  person: { id: number; full_name: string; cpf: string; email: string | null } | null
  responsible_employee: {
    id: number
    person: { id: number; full_name: string; cpf: string } | null
  } | null
}

export interface Role {
  id: number
  name: string
  permission_level: number
  description: string | null
}

// --- Unidades ---

export interface Unit {
  id: number
  name: string
  unit_type: UnitType
  unit_code: string
  address: string | null
  phone: string | null
  is_extension: boolean
}

// --- Biometria ---

export interface BiometricRow {
  id: number
  person_id: number
  finger: Finger
  device: string | null
  registration_date: string
  unit_id: number | null
  person: { full_name: string; cpf: string } | null
  unit: UnitRef | null
}

// --- Registros de acesso ---

export interface BiometricLogRow {
  id: number
  access_time: string
  event_type: EventType
  biometric_device: string | null
  is_authorized: boolean
  person_id: number | null
  person: { full_name: string; cpf: string; type: PersonType } | null
  unit_id: number | null
  unit: UnitRef | null
}

export interface WebLogRow {
  id: number
  login_time: string
  logout_time: string | null
  session_duration_minutes: number | null
  event_type: EventType
  person_id: number | null
  person: { full_name: string; cpf: string; type: PersonType } | null
  unit_id: number | null
  unit: UnitRef | null
}

/** Os dois endpoints de log paginam com nomes próprios de campo. */
export interface LogPageInfo {
  total_items: number
  total_pages: number
  current_page: number
}
