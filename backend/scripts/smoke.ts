/**
 * smoke.ts - Confere rapidinho se a API está de pé e respondendo o que deveria
 * # Pra que serve?
 * - Provar que o servidor monta, as rotas registram e o Swagger gera
 * - Provar que a validação barra corpo errado (400) e o porteiro barra quem não tem token (401)
 * - Rodar sem banco nenhum, usando o inject() do Fastify (não abre porta)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2026-09-09): Primeira versão, criada durante a reforma do projeto
 *
 * Como rodar:
 *   npm run smoke
 * Sai com código 1 se qualquer caso falhar, então dá pra usar em CI.
 */

import { validatorCompiler, serializerCompiler, ZodTypeProvider, jsonSchemaTransform } from "fastify-type-provider-zod"
import { fastifySwagger } from "@fastify/swagger"
import { fastifyCors } from "@fastify/cors"
import { fastify } from "fastify"
import { routes } from "../src/routes"
import { errorHandler } from "../src/lib/errorHandler"

type Case = {
  nome: string
  method: "GET" | "POST" | "PATCH" | "DELETE"
  url: string
  payload?: unknown
  headers?: Record<string, string>
  esperado: number
}

const CASES: Case[] = [
  { nome: "health responde ok", method: "GET", url: "/health", esperado: 200 },
  { nome: "login sem corpo -> 400", method: "POST", url: "/login", payload: {}, esperado: 400 },
  { nome: "login email invalido -> 400", method: "POST", url: "/login", payload: { email: "naoehemail", password: "x" }, esperado: 400 },
  { nome: "forgot-password sem email -> 400", method: "POST", url: "/forgot-password", payload: {}, esperado: 400 },
  { nome: "rota privada sem token -> 401", method: "GET", url: "/me", esperado: 401 },
  { nome: "listar pessoas sem token -> 401", method: "GET", url: "/people?unit_code=ETE001", esperado: 401 },
  { nome: "dashboard sem token -> 401", method: "GET", url: "/dashboard/statistics", esperado: 401 },
  { nome: "token mal formatado -> 401", method: "GET", url: "/me", headers: { authorization: "semBearer" }, esperado: 401 },
  { nome: "token invalido -> 401", method: "GET", url: "/me", headers: { authorization: "Bearer abc.def.ghi" }, esperado: 401 },
  // Sem corpo valido a validacao roda ANTES do preHandler de auth (ciclo do Fastify), entao vem 400
  { nome: "criar unidade com corpo invalido -> 400", method: "POST", url: "/units", payload: {}, esperado: 400 },
  // Com corpo valido, ai sim quem barra e o auth
  { nome: "criar unidade valida sem token -> 401", method: "POST", url: "/units", payload: { name: "Etec Teste", unit_type: "Etec", unit_code: "ETE999" }, esperado: 401 },
  { nome: "rota que nao existe -> 404", method: "GET", url: "/nao-existe", esperado: 404 },
]

async function build() {
  const server = fastify({ logger: false }).withTypeProvider<ZodTypeProvider>()
  server.setValidatorCompiler(validatorCompiler)
  server.setSerializerCompiler(serializerCompiler)
  server.setErrorHandler(errorHandler)

  await server.register(fastifyCors, { origin: ["http://localhost:5173"] })
  await server.register(fastifySwagger, {
    openapi: { info: { title: "smoke", version: "1.0.0" } },
    transform: jsonSchemaTransform,
  })
  await server.register(routes)
  await server.ready()
  return server
}

async function main() {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "segredo-de-teste-com-mais-de-32-caracteres-aqui"

  const server = await build()
  let passou = 0
  let falhou = 0

  for (const c of CASES) {
    const res = await server.inject({
      method: c.method,
      url: c.url,
      payload: c.payload as never,
      headers: c.headers,
    })

    const ok = res.statusCode === c.esperado
    if (ok) passou++
    else falhou++

    const marca = ok ? "PASS" : "FALHOU"
    console.log(`${marca}  [${res.statusCode} esperado ${c.esperado}] ${c.nome}`)
    if (!ok) console.log(`        corpo: ${res.body.slice(0, 300)}`)
  }

  // Mostra um corpo de erro de validacao pra conferir o formato do errorHandler
  const val = await server.inject({ method: "POST", url: "/login", payload: { email: "x", password: "" } })
  console.log(`\nFormato do erro de validacao:\n${val.body}`)

  const spec: any = server.swagger()
  console.log(`\nOpenAPI: ${Object.keys(spec.paths || {}).length} caminhos documentados`)

  await server.close()
  console.log(`\n=== ${passou} passaram, ${falhou} falharam ===`)
  if (falhou > 0) process.exit(1)
}

main().catch((e) => {
  console.error("ERRO NO SMOKE:", e)
  process.exit(1)
})
