import axios from 'axios';

// Base API URL - configure this based on your backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (cpf: string, password: string) =>
    api.post('/auth/login', { cpf, password }),
  
  logout: () => api.post('/auth/logout'),
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// Person API
export const personAPI = {
  getAll: (params?: { type?: string; unitId?: string }) =>
    api.get('/persons', { params }),
  
  getById: (id: string) => api.get(`/persons/${id}`),
  
  create: (data: any) => api.post('/persons', data),
  
  update: (id: string, data: any) => api.put(`/persons/${id}`, data),
  
  delete: (id: string) => api.delete(`/persons/${id}`),
  
  getByCpf: (cpf: string) => api.get(`/persons/cpf/${cpf}`),
};

// Student API
export const studentAPI = {
  getAll: (params?: { unitId?: string }) =>
    api.get('/students', { params }),
  
  getById: (id: string) => api.get(`/students/${id}`),
  
  create: (data: any) => api.post('/students', data),
  
  update: (id: string, data: any) => api.put(`/students/${id}`, data),
  
  delete: (id: string) => api.delete(`/students/${id}`),
};

// Employee API
export const employeeAPI = {
  getAll: (params?: { unitId?: string }) =>
    api.get('/employees', { params }),
  
  getById: (id: string) => api.get(`/employees/${id}`),
  
  create: (data: any) => api.post('/employees', data),
  
  update: (id: string, data: any) => api.put(`/employees/${id}`, data),
  
  delete: (id: string) => api.delete(`/employees/${id}`),
};

// Visitor API
export const visitorAPI = {
  getAll: (params?: { unitId?: string }) =>
    api.get('/visitors', { params }),
  
  getById: (id: string) => api.get(`/visitors/${id}`),
  
  create: (data: any) => api.post('/visitors', data),
  
  update: (id: string, data: any) => api.put(`/visitors/${id}`, data),
  
  delete: (id: string) => api.delete(`/visitors/${id}`),
};

// Biometric API
export const biometricAPI = {
  getAll: (params?: { personId?: string }) =>
    api.get('/biometrics', { params }),
  
  getById: (id: string) => api.get(`/biometrics/${id}`),
  
  create: (data: any) => api.post('/biometrics', data),
  
  delete: (id: string) => api.delete(`/biometrics/${id}`),
  
  // Integration with C++ biometric module
  capture: () => api.post('/biometrics/capture'),
  
  verify: (fingerprintData: string) =>
    api.post('/biometrics/verify', { fingerprintData }),
};

// Unit API
export const unitAPI = {
  getAll: () => api.get('/units'),
  
  getById: (id: string) => api.get(`/units/${id}`),
  
  create: (data: any) => api.post('/units', data),
  
  update: (id: string, data: any) => api.put(`/units/${id}`, data),
  
  delete: (id: string) => api.delete(`/units/${id}`),
};

// Biometric Log API
export const biometricLogAPI = {
  getAll: (params?: {
    unitId?: string;
    cpf?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get('/biometric-logs', { params }),
  
  getById: (id: string) => api.get(`/biometric-logs/${id}`),
  
  create: (data: any) => api.post('/biometric-logs', data),
};

// Web Access Log API
export const webAccessLogAPI = {
  getAll: (params?: {
    unitId?: string;
    cpf?: string;
    eventType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get('/web-access-logs', { params }),
  
  getById: (id: string) => api.get(`/web-access-logs/${id}`),
  
  create: (data: any) => api.post('/web-access-logs', data),
};

// Role API
export const roleAPI = {
  getAll: () => api.get('/roles'),
  
  getById: (id: string) => api.get(`/roles/${id}`),
  
  create: (data: any) => api.post('/roles', data),
  
  update: (id: string, data: any) => api.put(`/roles/${id}`, data),
  
  delete: (id: string) => api.delete(`/roles/${id}`),
};

export default api;
