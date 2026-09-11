export type UnitTypeEnum = "Fatec" | "Etec"
export type FingerEnum =
  | "thumb_right"
  | "index_right"
  | "middle_right"
  | "ring_right"
  | "pinky_right"
  | "thumb_left"
  | "index_left"
  | "middle_left"
  | "ring_left"
  | "pinky_left"
export type PersonTypeEnum = "student" | "teacher" | "employee" | "coordinator" | "inspector" | "visitor"
export type PeriodEnum = "morning" | "afternoon" | "night" | "integral"
export type StudentStatusEnum = "active" | "inactive" | "transferred"
export type EventTypeEnum = "entry" | "exit"

export interface Unit {
  id: number
  name: string
  unit_type: UnitTypeEnum
  address?: string
  phone?: string
  unit_code: string
  is_extension: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Role {
  id: number
  name: string
  permission_level: number
  description?: string
  permissions?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface Person {
  id: number
  full_name: string
  birth_date?: string // date string (YYYY-MM-DD)
  cpf: string
  email: string
  phone?: string
  type: PersonTypeEnum
  main_unit_type: UnitTypeEnum
  system_access_hash?: string
  temporary_password?: string
  password_reset_at?: string // datetime string
  registration_unit_id: number
  createdAt?: string
  updatedAt?: string
}

export interface Biometric {
  id: number
  template: string // base64 encoded bytes
  finger: FingerEnum
  registration_date: string // datetime string
  device: string
  registration_unit_id: number
  personId?: number // Optional, as it's part of PeopleBiometrics association
  createdAt?: string
  updatedAt?: string
}

export interface Student {
  id: number
  rm: string
  period: PeriodEnum
  course?: string
  class_name?: string // Changed from 'class' to 'class_name' to avoid keyword conflict
  responsible?: string
  status: StudentStatusEnum
  person_id: number
  createdAt?: string
  updatedAt?: string
}

export interface Employee {
  id: number
  registration_number: string
  admission_date?: string // date string (YYYY-MM-DD)
  active: boolean
  person_id: number
  role_id: number
  createdAt?: string
  updatedAt?: string
}

export interface Teacher {
  id: number
  subjects: string[]
  can_teach_fatec: boolean
  can_teach_etec: boolean
  employee_id: number
  createdAt?: string
  updatedAt?: string
}

export interface Visitor {
  id: number
  company?: string
  visit_reason?: string
  registration_date: string // date string (YYYY-MM-DD)
  visit_expiry_date?: string // date string (YYYY-MM-DD)
  person_id: number
  responsible_employee_id?: number
  createdAt?: string
  // A listagem de visitantes já traz a pessoa aninhada. Faltava aqui no tipo,
  // e por isso a tela ia procurar o CPF numa outra lista pra conseguir excluir.
  person?: {
    id: number
    full_name: string
    cpf: string
    email: string | null
  }
  responsible_employee?: {
    id: number
    person: {
      id: number
      full_name: string
      cpf: string
    }
  } | null
}

export interface PeopleBiometrics {
  person_id: number
  biometric_id: number
}

export interface BiometricLog {
  id: number
  access_time: string // datetime string
  event_type: EventTypeEnum
  biometric_device: string
  is_authorized: boolean
  person_id?: number
  unit_id: number
  createdAt?: string
}

export interface WebAccessLog {
  id: number
  login_time: string // datetime string
  logout_time?: string | null // datetime string
  session_duration_minutes?: number | null
  event_type: EventTypeEnum
  person_id?: number | null
  person?: {
    full_name: string
    cpf: string
    type: string
  } | null
  unit_id: number
  unit?: {
    name: string
    unit_code: string
  } | null
  ipAddress?: string
  userAgent?: string
  timestamp?: string // datetime string
  details?: string
  createdAt?: string
}

export interface Token {
  id: number
  token: string
  expiration: string // datetime string
  used: boolean
  person_id: number
}

export interface TokenBlacklist {
  id: number
  token: string
  expiration: string // datetime string
  added_at: string // datetime string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: Person
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
