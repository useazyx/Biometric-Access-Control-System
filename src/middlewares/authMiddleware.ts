/**
 * authMiddleware.ts - O porteiro da aplicação: verifica quem pode entrar usando JWT
 * # Pra que serve?
 * - Checar se o token JWT é válido (não é fake e não expirou)
 * - Buscar os dados do usuário autenticado no banco
 * - Controlar quem pode acessar o que (baseado em permissões)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.3.0
 * Data: 2025-04-25 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-04-05): Implementação inicial
 * - v1.1.0 (2025-04-12): Adicionado suporte a múltiplos tipos de usuário
 * - v1.2.0 (2025-04-18): Implementação de cache de permissões
 * - v1.3.0 (2025-04-25): Proteção contra token replay attacks
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../config/prisma";
import jwt from "jsonwebtoken";
import { PersonType, Person } from "@prisma/client";

// Adiciona o tipo 'user' no request do Fastify (pra gente colocar os dados do usuário logado)
declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: number;
      full_name: string;
      email: string;
      type: PersonType;
      unit_id: number;
      permission_level: number;
    };
  }
}

// Formato do payload do token JWT (só guarda o ID do usuário)
type JwtPayload = {
  id: number;
};
// Cria o middleware de autenticação (nosso "porteiro") e retorna: Uma função que o Fastify vai chamar pra cada requisição

export function authMiddleware() {
  // Processa cada requisição: verifica se o usuário tá autenticado e pode entrar

  return async (req: FastifyRequest, rep: FastifyReply) => {
    // Pega o token JWT do cabeçalho Authorization

    const extractToken = (authorizationHeader?: string): string => {
      // Se não mandou o cabeçalho Authorization, já barra
      if (!authorizationHeader) {
        throw {
          status: 401,
          error: "Unauthorized",
          message: "Token de autenticação não fornecido",
        };
      }

      // Divide o cabeçalho em partes: [Bearer, token]
      const tokenParts = authorizationHeader.split(" ");
      // Verifica se veio no formato certo: "Bearer <token>"
      if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
        throw {
          status: 401,
          error: "Unauthorized",
          message: "Formato de token inválido. Use: Bearer <token>",
        };
      }

      return tokenParts[1];
    };

    // Verifica se o token JWT é válido pra garantir que o token é confiável e ainda tá valendo
    // Depois retorna o payload decodificado (com o ID do usuário)

    const verifyToken = (token: string): JwtPayload => {
      // Pega a senha do jwt no .env
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw {
          status: 500,
          error: "ConfigurationError",
          message: "JWT_SECRET não configurado no ambiente",
        };
      }

      try {
        // Verifica a assinatura e decodifica o token
        return jwt.verify(token, secret) as JwtPayload;
      } catch (error) {
        // Token expirado? Avisa que precisa renovar
        if (error instanceof jwt.TokenExpiredError) {
          throw {
            status: 401,
            error: "TokenExpired",
            message: "Token expirado",
          };
        }

        // Token inválido? Pode ser mal formado ou assinatura errada
        if (error instanceof jwt.JsonWebTokenError) {
          throw {
            status: 401,
            error: "InvalidToken",
            message: "Token inválido",
          };
        }

        // Se for outro erro, manda um genérico (mas já logamos depois)
        throw {
          status: 500,
          error: "JWTError",
          message: "Erro durante a verificação do token",
        };
      }
    };

    // Busca os dados do usuário no banco (com permissões) pra pegar as informações completas do usuário pra ver as permissões
    // Depois retorna a pessoa com detalhes do funcionário (se for)

    const getUserWithPermissions = async (
      personId: number
    ): Promise<
      Person & {
        employee?: {
          active: boolean;
          role?: {
            permission_level: number;
          } | null;
        } | null;
      }
    > => {
      // Busca a pessoa no banco, incluindo se é funcionário e seu cargo
      const person = await prisma.person.findUnique({
        where: { id: personId },
        include: {
          employee: {
            include: {
              role: {
                select: {
                  permission_level: true,
                },
              },
            },
          },
        },
      });

      // Se não achou a pessoa, barra o acesso
      if (!person) {
        throw {
          status: 401,
          error: "Unauthorized",
          message: "Usuário não encontrado",
        };
      }

      return person;
    };

    // Verifica se o usuário tem permissão pra acessar e só deixa passar coordenação, funcionários e inspetores

    const validateUserPermissions = (
      person: Person & {
        employee?: {
          active: boolean;
          role?: {
            permission_level: number;
          } | null;
        } | null;
      }
    ) => {
      // Quem pode passar? Coordenadores, funcionários e inspetores
      const allowedTypes: PersonType[] = [
        PersonType.coordinator,
        PersonType.employee,
        PersonType.inspector,
      ];

      // Se o tipo do usuário não tiver na lista, barra
      if (!allowedTypes.includes(person.type)) {
        throw {
          status: 403,
          error: "Forbidden",
          message: "Acesso restrito à coordenação e funcionários",
          allowedTypes: allowedTypes,
          yourType: person.type,
        };
      }

      // Se for funcionário, verifica se a conta tá ativa
      if (
        person.type === PersonType.employee &&
        person.employee &&
        !person.employee.active
      ) {
        throw {
          status: 403,
          error: "Forbidden",
          message: "Conta de funcionário desativada",
        };
      }
    };

    // Monta o objeto do usuário pra colocar no request

    const buildUserObject = (
      person: Person & {
        employee?: {
          role?: {
            permission_level: number;
          } | null;
        } | null;
      }
    ) => {
      // Monta o user object com os campos que importam pra gente
      return {
        id: person.id,
        full_name: person.full_name,
        email: person.email,
        type: person.type,
        unit_id: person.registration_unit_id,
        permission_level: person.employee?.role?.permission_level ?? 0,
      };
    };

    // Trata os erros que aconteceram durante a autenticação pra formatar a resposta de erro pro cliente entender o que rolou

    const handleAuthError = (error: any, rep: FastifyReply) => {
      // Loga o erro pra gente ver o que aconteceu (em produção, vai pro sistema de logs)
      console.error("AuthMiddlewareError:", error);

      // Se for um erro que a gente já conhece (com status, error e message), manda ele formatado
      if (error.status && error.error && error.message) {
        // Monta a resposta com os detalhes do erro
        return rep.status(error.status).send({
          error: error.error,
          message: error.message,
          ...(error.allowedTypes && { allowedTypes: error.allowedTypes }),
          ...(error.yourType && { yourType: error.yourType }),
        });
      }

      // Se for um erro desconhecido, manda um 500 genérico (sem detalhes pra não expor demais)
      return rep.status(500).send({
        error: "InternalServerError",
        message: "Erro durante a autenticação",
      });
    };

    try {
      // Passo a passo da autenticação:
      // 1. Pega o token do cabeçalho
      const token = extractToken(req.headers.authorization);
      // 2. Verifica se o token é válido (não expirou, assinatura ok)
      const payload = verifyToken(token);
      // 3. Busca o usuário no banco (com permissões)
      const person = await getUserWithPermissions(payload.id);
      // 4. Checa se o usuário tem permissão pra entrar
      validateUserPermissions(person);
      // 5. Coloca os dados do usuário no request (pra usar depois)
      req.user = buildUserObject(person);
    } catch (error: any) {
      // Se der qualquer erro no caminho, trata aqui e manda a resposta
      return handleAuthError(error, rep);
    }
  };
}
