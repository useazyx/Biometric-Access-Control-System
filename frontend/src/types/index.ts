// Common types for the application

export interface Person {
  id: string;
  name: string;
  cpf: string;
  birthDate: Date | string;
  personType: 'STUDENT' | 'EMPLOYEE' | 'VISITOR';
  contactPhone?: string;
  email?: string;
  unitId?: string;
  unit?: Unit;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Student {
  id: string;
  personId: string;
  person: Person;
  registrationNumber: string;
  course?: string;
  shift?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Employee {
  id: string;
  personId: string;
  person: Person;
  employeeId: string;
  department?: string;
  position?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Visitor {
  id: string;
  personId: string;
  person: Person;
  visitDate: Date | string;
  visitPurpose?: string;
  hostName?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Biometric {
  id: string;
  personId: string;
  person?: Person;
  fingerprintData: string;
  fingerNumber: number;
  quality?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Unit {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BiometricLog {
  id: string;
  personId: string;
  person?: Person;
  unitId?: string;
  unit?: Unit;
  accessTime: Date | string;
  accessGranted: boolean;
  deviceId?: string;
  createdAt: Date | string;
}

export interface WebAccessLog {
  id: string;
  personId: string;
  person?: Person;
  unitId?: string;
  unit?: Unit;
  eventType: 'LOGIN' | 'LOGOUT' | 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE';
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date | string;
  details?: string;
  createdAt: Date | string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Person;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
