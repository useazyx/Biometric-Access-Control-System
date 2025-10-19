/**
 * server.ts - Prepara e inicia o servidor Fastify
 * # Pra que serve?
 * - Monta o servidor
 * - Instala os plugins e rotas
 * - Cuida de ligar e desligar tudo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.2.0
 * Data: 2025-05-15 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-03-15): Implementação inicial do servidor
 * - v1.1.0 (2025-04-10): Adicionada documentação Swagger/OpenAPI
 * - v1.2.0 (2025-05-15): Aprimoramento do sistema de shutdown
 */

import {
  validatorCompiler,
  serializerCompiler,
  ZodTypeProvider,
  jsonSchemaTransform,
} from "fastify-type-provider-zod";
import { fastifySwaggerUi } from "@fastify/swagger-ui";
import { fastifySwagger } from "@fastify/swagger";
import { fastifyCors } from "@fastify/cors";
import { fastify, FastifyInstance } from "fastify";
import { routes } from "./routes";
import dotenv from "dotenv";
import { prisma } from "./config/prisma";

// Pega as variáveis de ambiente do arquivo .env (senhas, chaves, etc)
dotenv.config();

const DEFAULT_PORT = 2077;
const DEFAULT_HOST = "0.0.0.0";
const API_TITLE = "Biometric Access Control API";
const API_DESCRIPTION =
  "Controle de acesso com biometria nas Etecs e Fatecs";
const DOCS_ROUTE = "/docs";

// Testa a conexão com o banco de dados

async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Conectado ao banco de dados com sucesso!");
  } catch (error) {
    console.error("❌ Falha na conexão com o banco:");
    console.error(error instanceof Error ? error.message : error);

    // Dicas para resolver problemas comuns
    console.log("\n👉 Dicas de solução:");
    console.log("1. Verifique se o PostgreSQL está rodando");
    console.log("2. Confira as credenciais no arquivo .env");
    console.log(
      "3. Teste a conexão manualmente com: psql -U seu_usuario -d nome_banco"
    );

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createServer(): Promise<FastifyInstance> {
  // Configurações básicas que a gente sempre usa
  const server = fastify({
    logger: true,
    ignoreTrailingSlash: true,
    caseSensitive: false,
  }).withTypeProvider<ZodTypeProvider>();

  // Configura os validadores (fiscais de dados)
  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  return server;
}
// Instala os plugins e rotas: coloca o CORS, repara a documentação Swagger e adiciona todas as rotas

async function registerPlugins(server: FastifyInstance): Promise<void> {
  // Configura o CORS pra aceitar tráfego de qualquer lugar (só em desenvolvimento!)
  await server.register(fastifyCors, {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Prepara a documentação da API
  await server.register(fastifySwagger, {
    openapi: {
      info: {
        title: API_TITLE,
        description: API_DESCRIPTION,
        version: "1.0.0",
      },
      tags: [
        // Categorias pra organizar os endpoints
        { name: "auth", description: "Login e senha" },
        { name: "people", description: "Gerenciar pessoas" },
        { name: "biometrics", description: "Digitais e biometria" },
        { name: "access", description: "Histórico de acessos" },
        { name: "students", description: "Alunos" },
        { name: "employees", description: "Funcionários" },
        { name: "teachers", description: "Professores" },
        { name: "visitors", description: "Visitantes" },
        { name: "units", description: "Unidades (Fatecs/Etecs)" },
      ],
    },
    transform: jsonSchemaTransform,
  });

  // Configura a interface bonitinha da documentação
  await server.register(fastifySwaggerUi, {
    routePrefix: DOCS_ROUTE,
    uiConfig: {
      docExpansion: "list", // Mostra a lista de endpoints
      deepLinking: true, // Permite link direto pra cada endpoint
    },
  });

  // Adiciona todas as rotas da aplicação
  await server.register(routes);
}

// Liga o servidor

async function startServer(): Promise<void> {
  try {
    // 1. Primeiro testa a conexão com o banco
    console.log("🔍 Testando conexão com o banco de dados...");
    await testDatabaseConnection();

    // 2. Cria e configura o servidor
    const server = await createServer();
    await registerPlugins(server);

    // 3. Decide porta e host (usa padrão se não tiver configurado)
    const port = Number(process.env.PORT) || DEFAULT_PORT;
    const host = process.env.HOST || DEFAULT_HOST;

    // 4. Coloca o servidor pra rodar
    await server.listen({ host, port });

    console.log(`
      🚀 Servidor rodando em: http://${host}:${port}
      📄 Documentação: http://${host}:${port}${DOCS_ROUTE}
    `);

    // 5. Presta atenção nos sinais de desligamento (Ctrl+C, etc)
    process.on("SIGINT", () => shutdown(server));
    process.on("SIGTERM", () => shutdown(server));
  } catch (error) {
    // Se der ruim, avisa e fecha a casa
    console.error(
      `❌ Falha ao iniciar: ${error instanceof Error ? error.message : error}`
    );
    process.exit(1);
  }
}

async function shutdown(server: FastifyInstance): Promise<void> {
  console.log("\n🛑 Desligando servidor...");

  try {
    await prisma.$disconnect();
    await server.close();
    console.log("✅ Servidor desligado com sucesso");
    process.exit(0);
  } catch (error) {
    // Se der problema na hora de desligar
    console.error(
      `❌ Erro no desligamento: ${
        error instanceof Error ? error.message : error
      }`
    );
    process.exit(1);
  }
}

startServer();

