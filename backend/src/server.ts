/**
 * server.ts - Prepara e inicia o servidor Fastify
 * # Pra que serve?
 * - Monta o servidor
 * - Instala os plugins e rotas
 * - Cuida de ligar e desligar tudo direitinho
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-03-15): Implementação inicial do servidor
 * - v1.1.0 (2025-04-10): Adicionada documentação Swagger/OpenAPI
 * - v1.2.0 (2025-05-15): Aprimoramento do sistema de shutdown
 * - v2.0.0 (2026-09-09): Passou a usar o config/app em vez de ler process.env na mão,
 *                        registrou o errorHandler (que existia mas nunca era usado),
 *                        fechou o CORS pra origens conhecidas e parou de desconectar
 *                        o banco logo depois de testar a conexão.
 */

import {
  validatorCompiler,
  serializerCompiler,
  ZodTypeProvider,
  jsonSchemaTransform,
} from "fastify-type-provider-zod"
import { fastifySwaggerUi } from "@fastify/swagger-ui"
import { fastifySwagger } from "@fastify/swagger"
import { fastifyCors } from "@fastify/cors"
import { fastify, FastifyInstance } from "fastify"
import { routes } from "./routes"
import { errorHandler } from "./lib/errorHandler"
import { prisma } from "./config/prisma"
import config from "./config/app"

const API_TITLE = "Biometric Access Control API"
const API_DESCRIPTION = "Controle de acesso com biometria nas Etecs e Fatecs"
const API_VERSION = "1.0.0"
const DOCS_ROUTE = "/docs"

// Categorias pra organizar os endpoints na documentação
const API_TAGS = [
  { name: "auth", description: "Login e senha" },
  { name: "dashboard", description: "Números da tela inicial" },
  { name: "people", description: "Gerenciar pessoas" },
  { name: "biometrics", description: "Digitais e biometria" },
  { name: "access", description: "Histórico de acessos" },
  { name: "students", description: "Alunos" },
  { name: "employees", description: "Funcionários" },
  { name: "teachers", description: "Professores" },
  { name: "visitors", description: "Visitantes" },
  { name: "units", description: "Unidades (Fatecs/Etecs)" },
  { name: "roles", description: "Cargos e permissões" },
  { name: "health", description: "Saúde da API" },
]

// Testa a conexão com o banco de dados antes de abrir a porta pro mundo
async function testDatabaseConnection(): Promise<void> {
  try {
    await prisma.$connect()
    console.log("✅ Conectado ao banco de dados com sucesso!")
  } catch (error) {
    console.error("❌ Falha na conexão com o banco:")
    console.error(error instanceof Error ? error.message : error)

    // Dicas para resolver problemas comuns
    console.log("\n👉 Dicas de solução:")
    console.log("1. Verifique se o PostgreSQL está rodando")
    console.log("2. Confira o DATABASE_URL no arquivo .env")
    console.log("3. Teste a conexão manualmente com: psql -U seu_usuario -d nome_banco")
    console.log("4. Rode as migrações: npx prisma migrate deploy")

    process.exit(1)
  }
  // Atenção: aqui NÃO tem $disconnect. A conexão que acabou de ser aberta
  // é a mesma que a aplicação vai usar; fechar aqui derrubaria a primeira requisição.
}

async function createServer(): Promise<FastifyInstance> {
  // Configurações básicas que a gente sempre usa
  const server = fastify({
    // Em desenvolvimento o log vem bonitinho; em produção sai em JSON pra ferramenta ler
    logger: config.ENVIRONMENT === "development" ? { level: "info" } : true,
    ignoreTrailingSlash: true,
    caseSensitive: false,
  }).withTypeProvider<ZodTypeProvider>()

  // Configura os validadores (fiscais de dados)
  server.setValidatorCompiler(validatorCompiler)
  server.setSerializerCompiler(serializerCompiler)

  // Coloca o tratador de erros central: sem isso, cada rota respondia do seu jeito
  server.setErrorHandler(errorHandler)

  return server
}

// Instala os plugins e rotas: coloca o CORS, prepara a documentação Swagger e adiciona todas as rotas
async function registerPlugins(server: FastifyInstance): Promise<void> {
  // Só os endereços listados no .env podem chamar a API (nada de "*" solto por aí)
  await server.register(fastifyCors, {
    origin: config.CORS_ORIGINS,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })

  // Prepara a documentação da API
  await server.register(fastifySwagger, {
    openapi: {
      info: {
        title: API_TITLE,
        description: API_DESCRIPTION,
        version: API_VERSION,
      },
      tags: API_TAGS,
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  })

  // Configura a interface bonitinha da documentação
  await server.register(fastifySwaggerUi, {
    routePrefix: DOCS_ROUTE,
    uiConfig: {
      docExpansion: "list", // Mostra a lista de endpoints
      deepLinking: true, // Permite link direto pra cada endpoint
    },
  })

  // Adiciona todas as rotas da aplicação
  await server.register(routes)
}

// Liga o servidor
async function startServer(): Promise<void> {
  try {
    // 1. Primeiro testa a conexão com o banco
    console.log("🔍 Testando conexão com o banco de dados...")
    await testDatabaseConnection()

    // 2. Cria e configura o servidor
    const server = await createServer()
    await registerPlugins(server)

    // 3. Coloca o servidor pra rodar no host e porta que vieram do .env
    await server.listen({ host: config.HOST, port: config.PORT })

    console.log(`
      🚀 Servidor rodando em: http://${config.HOST}:${config.PORT}
      📄 Documentação: http://${config.HOST}:${config.PORT}${DOCS_ROUTE}
      🌎 Ambiente: ${config.ENVIRONMENT}
    `)

    // 4. Presta atenção nos sinais de desligamento (Ctrl+C, etc)
    process.on("SIGINT", () => shutdown(server))
    process.on("SIGTERM", () => shutdown(server))
  } catch (error) {
    // Se der ruim, avisa e fecha a casa
    console.error(`❌ Falha ao iniciar: ${error instanceof Error ? error.message : error}`)
    process.exit(1)
  }
}

async function shutdown(server: FastifyInstance): Promise<void> {
  console.log("\n🛑 Desligando servidor...")

  try {
    // Fecha o servidor antes do banco, pra terminar as requisições que já estavam em andamento
    await server.close()
    await prisma.$disconnect()
    console.log("✅ Servidor desligado com sucesso")
    process.exit(0)
  } catch (error) {
    // Se der problema na hora de desligar
    console.error(`❌ Erro no desligamento: ${error instanceof Error ? error.message : error}`)
    process.exit(1)
  }
}

startServer()
