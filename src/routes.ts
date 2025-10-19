/**
 * routes.ts - Configura as rotas da API, tipo um mapa de quem pode acessar o quê
 * # Pra que serve?
 * - Define as regras de validação pra cada endpoint (pra não entrar lixo)
 * - Separa rotas públicas (sem login) das privadas
 * - Coloca o porteiro (middleware) pra verificar quem entra
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.4.0
 * Data: 2025-06-20
 * Alterações:
 * - v1.0.0 (2025-03-20): Estrutura inicial de rotas
 * - v1.1.0 (2025-04-15): Adicionado sistema de autenticação
 * - v1.2.0 (2025-05-05): Integração com validação Zod
 * - v1.3.0 (2025-06-01): Suporte a paginação em endpoints críticos
 * - v1.4.0 (2025-06-20): Adicionadas rotas de biometria
 */

import { FastifyInstance } from "fastify";
import z from "zod";
import { validateCPF } from "./utils/cpfValidator";
import { authMiddleware } from "./middlewares/authMiddleware";

// Controladores que fazem o trabalho pesado
import { GetWebAccessLogsController } from "./controllers/access/GetWebAccessLogsController";
import { GetBiometricAccessLogsController } from "./controllers/access/GetBiometricAccessLogsController";
import { LoginController } from "./controllers/auth/LoginController";
import { LogoutController } from "./controllers/auth/LogoutController";
import { ResetPasswordController } from "./controllers/auth/ResetPasswordController";
import { ForgotPasswordController } from "./controllers/auth/ForgotPasswordController";
import { ChangePasswordController } from "./controllers/auth/ChangePasswordController";
import { CreateBiometricController } from "./controllers/biometrics/CreateBiometricController";
import { DeleteBiometricController } from "./controllers/biometrics/DeleteBiometricController";
import { CreateEmployeeController } from "./controllers/employees/CreateEmployeeController";
import { UpdateEmployeeController } from "./controllers/employees/UpdateEmployeeController";
import { CreatePersonController } from "./controllers/people/CreatePersonController";
import { DeletePersonController } from "./controllers/people/DeletePersonController";
import { GetPersonController } from "./controllers/people/GetPersonController";
import { ListPersonController } from "./controllers/people/ListPersonController";
import { UpdatePersonController } from "./controllers/people/UpdatePersonController";
import { CreateStudentController } from "./controllers/students/CreateStudentController";
import { UpdateStudentController } from "./controllers/students/UpdateStudentController";
import { CreateTeacherController } from "./controllers/teachers/CreateTeacherController";
import { CreateUnitsController } from "./controllers/units/CreateUnitsController";
import { GetUnitsController } from "./controllers/units/GetUnitsController";
import { CreateVisitorController } from "./controllers/visitors/CreateVisitorController";

// Esquemas que a gente usa em vários lugares (pra não repetir)
const CPF_SCHEMA = z
  .string()
  .transform((val) => val.replace(/\D/g, "")) // Tira tudo que não é número do CPF
  .refine((val) => val.length === 11, { message: "CPF precisa ter 11 dígitos" })
  .refine(validateCPF, { message: "CPF inválido" }); // Testa se é um CPF de verdade

const DATE_SCHEMA = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Data no formato errado (use YYYY-MM-DD)",
});

const UNIT_CODE_SCHEMA = z
  .string()
  .length(6, { message: "Código da unidade precisa ter 6 caracteres" })
  .regex(/^(FAT|ETE)\d{3}$/, {
    // Formato tipo FAT001 ou ETE001
    message: "Formato inválido (ex: FAT001 ou ETE001)",
  });

const PASSWORD_SCHEMA = z
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
  });

// Configuração específica de cada endpoint
const LOGIN_SCHEMA = {
  tags: ["auth"],
  description: "Faz login com email e senha",
  body: z.object({
    email: z.string().email({ message: "Email com formato errado" }),
    password: z.string().min(1, { message: "Senha obrigatória" }),
  }),
  response: {
    200: z.object({
      token: z.string(),
      person: z.object({
        id: z.number(),
        full_name: z.string(),
        type: z.string(),
        email: z.string(),
        unit_id: z.number(),
      }),
      requires_password_change: z.boolean(),
    }),
    401: z.object({ error: z.string() }),
  },
};

const RESET_PASSWORD_SCHEMA = {
  tags: ["auth"],
  description: "Troca senha usando token temporário",
  body: z
    .object({
      email: z.string().email({ message: "Email com formato errado" }),
      token: z
        .string()
        .length(6, { message: "Token precisa ter 6 caracteres" }),
      new_password: PASSWORD_SCHEMA,
      new_password_confirm: z.string().min(8, {
        message: "Confirmação muito curta (min 8 caracteres)",
      }),
    })
    .refine((data) => data.new_password === data.new_password_confirm, {
      message: "As senhas não batem",
      path: ["new_password_confirm"],
    }),
  response: {
    200: z.object({ message: z.string() }),
    400: z.object({ error: z.string() }),
  },
};

const FORGOT_PASSWORD_SCHEMA = {
  tags: ["auth"],
  description: "Solicita reset de senha via email",
  body: z.object({
    email: z.string().email({ message: "Email com formato errado" }),
  }),
  response: {
    200: z.object({ 
      message: z.string(),
      email: z.string(),
    }),
    400: z.object({ 
      error: z.string(),
      message: z.string(),
    }),
  },
};

const CHANGE_PASSWORD_SCHEMA = {
  tags: ["auth"],
  description: "Troca senha para usuário logado",
  body: z
    .object({
      current_password: z.string().min(1, { message: "Senha atual obrigatória" }),
      new_password: PASSWORD_SCHEMA,
      new_password_confirm: z.string().min(8, {
        message: "Confirmação muito curta (min 8 caracteres)",
      }),
    })
    .refine((data) => data.new_password === data.new_password_confirm, {
      message: "As senhas não batem",
      path: ["new_password_confirm"],
    }),
  response: {
    200: z.object({ message: z.string() }),
    400: z.object({ 
      error: z.string(),
      message: z.string(),
    }),
  },
};

const LOGOUT_SCHEMA = {
  tags: ["auth"],
  description: "Dá tchau e invalida o token",
  response: {
    200: z.object({
      message: z.string(),
      timestamp: z.string().datetime(),
    }),
    401: z.object({ error: z.string() }),
  },
};

const CREATE_PERSON_SCHEMA = {
  tags: ["people", "creation"],
  description: "Cadastra uma pessoa nova",
  body: z.object({
    full_name: z
      .string()
      .min(3, { message: "Nome muito curto (min 3 caracteres)" })
      .max(100, { message: "Nome muito longo (max 100)" }),
    birth_date: DATE_SCHEMA.optional(),
    cpf: CPF_SCHEMA,
    email: z
      .string()
      .email({ message: "Email com formato errado" })
      .max(100, { message: "Email muito longo (max 100)" }),
    phone: z.string().max(20, { message: "Telefone muito longo (max 20)" }),
    type: z.enum(
      ["student", "teacher", "employee", "coordinator", "inspector", "visitor"],
      { errorMap: () => ({ message: "Tipo de pessoa inválido" }) }
    ),
    main_unit_type: z.enum(["Fatec", "Etec"], {
      errorMap: () => ({ message: "Tipo de unidade inválido" }),
    }),
    unit_code: UNIT_CODE_SCHEMA,
  }),
  response: {
    201: z.object({
      id: z.number(),
      message: z.string(),
      created_at: z.string().datetime(),
      email: z.string(),
      full_name: z.string(),
      temporary_password_sent: z.boolean(), // Avisa se mandamos senha temporária
    }),
  },
};

const LIST_PERSON_SCHEMA = {
  tags: ["people", "search"],
  description: "Lista pessoas por unidade",
  querystring: z.object({
    unit_code: z.string(),
    type: z
      .enum([
        "student",
        "teacher",
        "employee",
        "coordinator",
        "inspector",
        "visitor",
      ])
      .optional(),
    page: z
      .string()
      .transform((val) => parseInt(val) || 1)
      .default("1"),
    page_size: z
      .string()
      .transform((val) => parseInt(val) || 20)
      .default("20"),
  }),
  response: {
    200: z.object({
      people: z.array(
        z.object({
          id: z.number(),
          full_name: z.string(),
          type: z.string(),
          email: z.string().nullable(),
          cpf: z.string().nullable(),
        })
      ),
      total: z.number(),
      current_page: z.number(),
      total_pages: z.number(),
    }),
  },
};

const GET_PERSON_SCHEMA = {
  tags: ["people"],
  description: "Pega todos os dados de uma pessoa pelo CPF",
  body: z.object({
    cpf: CPF_SCHEMA,
  }),
  response: {
    200: z.object({
      id: z.number(),
      full_name: z.string(),
      birth_date: z.string().nullable(),
      cpf: z.string(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      type: z.string(),
      main_unit_type: z.string().nullable(),
      registration_unit: z
        .object({
          id: z.number(),
          name: z.string(),
          unit_code: z.string(),
        })
        .nullable(),
      student: z
        .object({
          id: z.number(),
          rm: z.string(),
          status: z.string(),
        })
        .nullable()
        .optional(),
      employee: z
        .object({
          id: z.number(),
          registration_number: z.string(),
        })
        .nullable()
        .optional(),
      visitor: z
        .object({
          id: z.number(),
          company: z.string().nullable(),
        })
        .nullable()
        .optional(),
    }),
    404: z.object({
      error: z.string(),
      tip: z.string().optional(),
    }),
  },
};

const UPDATE_PERSON_SCHEMA = {
  tags: ["people", "update"],
  description: "Atualiza dados de uma pessoa",
  params: z.object({
    cpf: CPF_SCHEMA,
  }),
  body: z.object({
    full_name: z
      .string()
      .min(3, { message: "Nome muito curto (min 3 caracteres)" })
      .max(100, { message: "Nome muito longo (max 100)" })
      .optional(),
    email: z
      .string()
      .email({ message: "Email com formato errado" })
      .max(100, { message: "Email muito longo (max 100)" })
      .optional(),
    phone: z
      .string()
      .max(20, { message: "Telefone muito longo (max 20)" })
      .optional(),
  }),
  response: {
    200: z.object({
      message: z.string(),
      updated_fields: z.array(z.string()),
    }),
    404: z.object({
      error: z.string(),
      id: z.number(),
    }),
  },
};

const DELETE_PERSON_SCHEMA = {
  tags: ["people", "delete"],
  description: "Apaga uma pessoa",
  body: z.object({
    cpf: CPF_SCHEMA,
  }),
  response: {
    200: z.object({
      message: z.string(),
      details: z.object({
        message: z.string(),
        deletedPersonId: z.number(),
      }),
    }),
    404: z.object({
      error: z.string(),
      tip: z.string(),
    }),
    409: z.object({
      error: z.string(),
      message: z.string(),
      solution: z.string(),
    }),
  },
};

const CREATE_BIOMETRIC_SCHEMA = {
  tags: ["biometrics", "creation"],
  description: "Cadastra uma digital nova",
  body: z.object({
    cpf: CPF_SCHEMA,
    template: z.string().describe("Digital em formato base64"),
    finger: z.enum(
      [
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
      ],
      { errorMap: () => ({ message: "Dedo inválido" }) }
    ),
    device: z.string().default("R307"),
    unit_code: z.string().min(3, { message: "Código da unidade inválido" }),
    quality: z
      .number()
      .min(0, { message: "Qualidade mínima: 0" })
      .max(100, { message: "Qualidade máxima: 100" })
      .optional(),
  }),
  response: {
    201: z.object({
      id: z.number(),
      message: z.string(),
      person_id: z.number(),
      finger: z.string(),
      created_at: z.string().datetime(),
    }),
  },
};

const DELETE_BIOMETRIC_SCHEMA = {
  tags: ["biometrics", "delete"],
  description: "Apaga uma digital",
  querystring: z.object({
    cpf: CPF_SCHEMA,
    finger: z.enum(
      [
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
      ],
      { errorMap: () => ({ message: "Dedo inválido" }) }
    ),
  }),
  response: {
    200: z.object({
      message: z.string(),
    }),
    404: z.object({
      error: z.string(),
    }),
  },
};

const GET_WEB_ACCESS_LOGS_SCHEMA = {
  tags: ["access", "search"],
  description: "Pega histórico completo de acessos",
  body: z.object({
    unit_id: z.number().optional(),
    cpf: z.string().optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}/)
      .optional(), // -> IA QUE FEZ TAVA CANSADO PARA CARALHO
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}/)
      .optional(), // -> IA QUE FEZ TAVA CANSADO PARA CARALHO
    event_type: z.enum(["entry", "exit"]).optional(),
    page: z.number().min(1).default(1),
    page_size: z.number().min(1).max(100).default(20),
  }),
  response: {
    200: z.object({
      logs: z.array(
        z.object({
          id: z.number(),
          login_time: z.string().datetime(),
          event_type: z.string(),
          person_id: z.number().nullable(),
          person_name: z.string().nullable(),
          person_cpf: z.string().nullable(),
          person_type: z.string().nullable(),
          unit_id: z.number(),
          unit_name: z.string().nullable(),
          unit_code: z.string().nullable(),
          logout_time: z.string().datetime().nullable(),
          session_duration_minutes: z.number().nullable(),
        })
      ),
      total: z.number(),
      current_page: z.number(),
      total_pages: z.number(),
    }),
  },
};

const GET_BIOMETRIC_ACCESS_LOGS_SCHEMA = {
  tags: ["biometric-access", "search"],
  description: "Pega histórico completo de acessos biométricos",
  body: z.object({
    unit_id: z.number().optional(),
    cpf: z.string().optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}/)
      .optional(),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}/)
      .optional(),
    event_type: z.enum(["entry", "exit"]).optional(),
    page: z.number().min(1).default(1),
    page_size: z.number().min(1).max(100).default(20),
  }),
  response: {
    200: z.object({
      logs: z.array(
        z.object({
          id: z.number(),
          access_time: z.string().datetime(),
          event_type: z.string(),
          biometric_device: z.string().nullable(),
          is_authorized: z.boolean(),
          person_id: z.number().nullable(),
          person: z.object({
            full_name: z.string(),
            cpf: z.string(),
            type: z.string(),
          }).nullable(),
          unit_id: z.number(),
          unit: z.object({
            name: z.string(),
            unit_code: z.string(),
          }),
        })
      ),
      total_items: z.number(),
      total_pages: z.number(),
      current_page: z.number(),
      page_size: z.number(),
    }),
  },
};

const CREATE_STUDENT_SCHEMA = {
  tags: ["students", "creation"],
  description: "Cadastra um aluno novo",
  body: z.object({
    cpf: CPF_SCHEMA,
    rm: z
      .string()
      .length(6, { message: "RM precisa ter 6 dígitos" })
      .refine((val) => /^\d+$/.test(val), {
        message: "RM só pode ter números",
      }),
    period: z.enum(["morning", "afternoon", "night", "integral"]),
    course: z
      .string()
      .min(3, { message: "Curso muito curto (min 3 caracteres)" })
      .max(50, { message: "Curso muito longo (max 50)" }),
    class: z
      .string()
      .min(1, { message: "Turma muito curta (min 1 caractere)" })
      .max(10, { message: "Turma muito longa (max 10)" }),
    responsible: z.string().max(100, {
      message: "Responsável muito longo (max 100)",
    }),
  }),
  response: {
    201: z.object({
      id: z.number(),
      message: z.string(),
      student: z.object({
        id: z.number(),
        rm: z.string(),
        person_id: z.number(),
      }),
    }),
  },
};

const UPDATE_STUDENT_SCHEMA = {
  tags: ["students", "update"],
  description: "Atualiza dados de um aluno",
  params: z.object({
    rm: z.string().length(6, { message: "RM inválido" }),
  }),
  body: z.object({
    period: z.enum(["morning", "afternoon", "night", "integral"]).optional(),
    course: z.string().optional(),
    class: z.string().optional(),
    status: z.enum(["active", "inactive", "transferred"]).optional(),
    responsible: z.string().optional(),
  }),
  response: {
    200: z.object({
      message: z.string(),
      updated_student: z.object({
        id: z.number(),
        rm: z.string(),
      }),
    }),
  },
};

const CREATE_EMPLOYEE_SCHEMA = {
  tags: ["employees", "creation"],
  description: "Cadastra um funcionário novo",
  body: z.object({
    cpf: CPF_SCHEMA,
    role_id: z.number({
      invalid_type_error: "ID do cargo precisa ser número",
    }),
    registration_number: z
      .string()
      .min(5, {
        message: "Registro muito curto (min 5 caracteres)",
      })
      .max(20, {
        message: "Registro muito longo (max 20)",
      }),
    admission_date: DATE_SCHEMA.optional(),
  }),
  response: {
    201: z.object({
      id: z.number(),
      message: z.string(),
      employee: z.object({
        id: z.number(),
        registration_number: z.string(),
        person_id: z.number(),
      }),
    }),
  },
};

const UPDATE_EMPLOYEE_SCHEMA = {
  tags: ["employees", "update"],
  description: "Atualiza dados de um funcionário",
  params: z.object({
    cpf: CPF_SCHEMA,
  }),
  body: z.object({
    role_name: z
      .string()
      .min(3, { message: "Cargo muito curto (min 3 caracteres)" })
      .optional(),
    active: z.boolean().optional(),
  }),
  response: {
    200: z.object({
      message: z.string(),
      updated_employee: z.object({
        id: z.number(),
        registration_number: z.string(),
      }),
    }),
  },
};

const CREATE_TEACHER_SCHEMA = {
  tags: ["teachers", "creation"],
  description: "Cadastra um professor novo",
  body: z.object({
    cpf: CPF_SCHEMA,
    subjects: z
      .array(z.string())
      .min(1, { message: "Precisa de pelo menos uma matéria" }),
    can_teach_fatec: z.boolean().default(false),
    can_teach_etec: z.boolean().default(false),
  }),
  response: {
    201: z.object({
      id: z.number(),
      message: z.string(),
      teacher: z.object({
        id: z.number(),
        employee_id: z.number(),
        subjects: z.array(z.string()),
      }),
    }),
  },
};

const CREATE_VISITOR_SCHEMA = {
  tags: ["visitors", "creation"],
  description: "Registra um visitante novo",
  body: z.object({
    cpf: CPF_SCHEMA,
    company: z
      .string()
      .max(100, { message: "Empresa muito longa (max 100)" })
      .optional(),
    visit_reason: z
      .string()
      .min(5, { message: "Motivo muito curto (min 5 caracteres)" })
      .max(200, {
        message: "Motivo muito longo (max 200)",
      })
      .optional(),
    responsible_employee_cpf: CPF_SCHEMA,
  }),
  response: {
    201: z.object({
      id: z.number(),
      message: z.string(),
      visitor: z.object({
        id: z.number(),
        person_id: z.number(),
      }),
    }),
  },
};

const CREATE_UNITS_SCHEMA = {
  tags: ["units", "creation"],
  description: "Cadastra uma unidade nova",
  body: z.object({
    name: z
      .string()
      .min(3, { message: "Nome muito curto (min 3 caracteres)" })
      .max(100, { message: "Nome muito longo (max 100)" }),
    unit_type: z.enum(["Fatec", "Etec"], {
      errorMap: () => ({ message: "Tipo de unidade inválido" }),
    }),
    address: z
      .string()
      .min(5, { message: "Endereço muito curto (min 5 caracteres)" })
      .max(200, { message: "Endereço muito longo (max 200)" })
      .optional(),
    phone: z
      .string()
      .max(20, { message: "Telefone muito longo (max 20)" })
      .optional(),
    unit_code: UNIT_CODE_SCHEMA,
    is_extension: z.boolean().default(false),
  }),
  response: {
    201: z.object({
      id: z.number(),
      message: z.string(),
      unit: z.object({
        id: z.number(),
        name: z.string(),
        unit_code: z.string(),
        unit_type: z.string(),
      }),
    }),
  },
};

const GET_UNITS_SCHEMA = {
  tags: ["units", "search"],
  description: "Lista unidades cadastradas",
  querystring: z.object({
    type: z.enum(["Fatec", "Etec"]).optional(),
    is_extension: z.boolean().optional(),
  }),
  response: {
    200: z.object({
      units: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          unit_type: z.string(),
          unit_code: z.string(),
          address: z.string().nullable(),
          phone: z.string().nullable(),
          is_extension: z.boolean(),
        })
      ),
      total: z.number(),
    }),
  },
};

// Registra as rotas principais (tipo o ponto de partida)

export async function routes(fastify: FastifyInstance) {
  // Rotas abertas (não precisa de login)
  fastify.post("/login", { schema: LOGIN_SCHEMA }, async (request, reply) => {
    return new LoginController().handle(request, reply);
  });

  fastify.post(
    "/forgot-password",
    { schema: FORGOT_PASSWORD_SCHEMA },
    async (request, reply) => {
      return new ForgotPasswordController().handle(request, reply);
    }
  );

  fastify.post(
    "/reset-password",
    { schema: RESET_PASSWORD_SCHEMA },
    async (request, reply) => {
      return new ResetPasswordController().handle(request, reply);
    }
  );

  // Rotas privadas (só entra com login)
  fastify.register(privateRoutes);
}

// Registra as rotas privadas e coloca um porteiro (authMiddleware) em todas as rotas pra ver se tá logado mesmo

async function privateRoutes(fastify: FastifyInstance) {
  // Porteiro que verifica o token antes de deixar entrar
  fastify.addHook("preHandler", authMiddleware());
  // Rotas de autenticação
  fastify.post("/logout", { schema: LOGOUT_SCHEMA }, async (request, reply) => {
    return new LogoutController().handle(request, reply);
  });

  fastify.post(
    "/change-password",
    { schema: CHANGE_PASSWORD_SCHEMA },
    async (request, reply) => {
      return new ChangePasswordController().handle(request, reply);
    }
  );

  // Rotas de pessoas
  fastify.post(
    "/people",
    { schema: CREATE_PERSON_SCHEMA },
    async (request, reply) => {
      return new CreatePersonController().handle(request, reply);
    }
  );

  fastify.get(
    "/people",
    { schema: LIST_PERSON_SCHEMA },
    async (request, reply) => {
      return new ListPersonController().handle(request, reply);
    }
  );

  fastify.post(
    "/people/get-people",
    { schema: GET_PERSON_SCHEMA },
    async (request, reply) => {
      return new GetPersonController().handle(request, reply);
    }
  );

  fastify.patch(
    "/people/:cpf",
    { schema: UPDATE_PERSON_SCHEMA },
    async (request, reply) => {
      return new UpdatePersonController().handle(request, reply);
    }
  );

  fastify.delete(
    "/people",
    { schema: DELETE_PERSON_SCHEMA },
    async (request, reply) => {
      return new DeletePersonController().handle(request, reply);
    }
  );

  // Rotas de biometria
  fastify.post(
    "/biometrics",
    { schema: CREATE_BIOMETRIC_SCHEMA },
    async (request, reply) => {
      return new CreateBiometricController().handle(request, reply);
    }
  );

  fastify.delete(
    "/biometrics",
    { schema: DELETE_BIOMETRIC_SCHEMA },
    async (request, reply) => {
      return new DeleteBiometricController().handle(request, reply);
    }
  );

  // Rotas de histórico de acessos
  fastify.post(
    "/web-access-logs",
    { schema: GET_WEB_ACCESS_LOGS_SCHEMA },
    async (request, reply) => {
      return new GetWebAccessLogsController().handle(request, reply);
    }
  );

  // Rotas de estudantes
  fastify.post(
    "/biometric-access-logs",
    { schema: GET_BIOMETRIC_ACCESS_LOGS_SCHEMA },
    async (request, reply) => {
      return new GetBiometricAccessLogsController().handle(request, reply);
    }
  );

  fastify.post(
    "/students",
    { schema: CREATE_STUDENT_SCHEMA },
    async (request, reply) => {
      return new CreateStudentController().handle(request, reply);
    }
  );

  fastify.patch(
    "/students/:rm",
    { schema: UPDATE_STUDENT_SCHEMA },
    async (request, reply) => {
      return new UpdateStudentController().handle(request, reply);
    }
  );

  // Rotas de funcionários
  fastify.post(
    "/employees",
    { schema: CREATE_EMPLOYEE_SCHEMA },
    async (request, reply) => {
      return new CreateEmployeeController().handle(request, reply);
    }
  );

  fastify.patch(
    "/employees/:cpf",
    { schema: UPDATE_EMPLOYEE_SCHEMA },
    async (request, reply) => {
      return new UpdateEmployeeController().handle(request, reply);
    }
  );

  // Rotas de professores
  fastify.post(
    "/teachers",
    { schema: CREATE_TEACHER_SCHEMA },
    async (request, reply) => {
      return new CreateTeacherController().handle(request, reply);
    }
  );

  // Rotas de visitantes
  fastify.post(
    "/visitors",
    { schema: CREATE_VISITOR_SCHEMA },
    async (request, reply) => {
      return new CreateVisitorController().handle(request, reply);
    }
  );

  // Rotas de unidades
  fastify.post(
    "/units",
    { schema: CREATE_UNITS_SCHEMA },
    async (request, reply) => {
      return new CreateUnitsController().handle(request, reply);
    }
  );

  fastify.get(
    "/units",
    { schema: GET_UNITS_SCHEMA },
    async (request, reply) => {
      return new GetUnitsController().handle(request, reply);
    }
  );
}
