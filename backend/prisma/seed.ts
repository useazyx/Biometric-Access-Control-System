/**
 * seed.ts - Enche o banco com dados iniciais pra dar pra usar o sistema na hora
 * # Pra que serve?
 * - Criar a unidade, os cargos e o usuário administrador do zero
 * - Deixar alguns registros de exemplo pra dashboard e listagens não nascerem vazias
 * - Substituir os arquivos .txt de INSERT que a gente rodava na mão no pgAdmin
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2026-09-09): Convertido dos SQLs manuais pra um seed idempotente do Prisma
 *
 * Como rodar:
 *   npm run db:seed
 * Pode rodar quantas vezes quiser: usa upsert, então não duplica nada.
 */

import { PrismaClient, PersonType, UnitType, Period, EventType, Finger } from "@prisma/client"
import bcrypt from "bcrypt"
import { randomBytes } from "node:crypto"

const prisma = new PrismaClient()

// A senha do admin vem do .env pra não ficar chumbada aqui dentro.
// Se não configurar, o seed gera uma aleatória e imprime ela uma única vez no final.
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@etec001.com.br"
const ADMIN_CPF = "44504487829"
const ADMIN_REGISTRATION = "ADM001"
const UNIT_CODE = "ETE001"
const BCRYPT_ROUNDS = 12

// Os cargos do sistema, do mais pro menos poderoso
const ROLES = [
  { name: "Administrador", permission_level: 10, description: "Acesso total ao sistema" },
  { name: "Diretor", permission_level: 9, description: "Diretor da unidade" },
  { name: "Coordenador", permission_level: 8, description: "Coordenador de curso" },
  { name: "Inspetor", permission_level: 7, description: "Controle de acesso" },
  { name: "Professor", permission_level: 6, description: "Corpo docente" },
  { name: "Funcionário", permission_level: 5, description: "Equipe administrativa" },
]

// Cria (ou reaproveita) a unidade onde tudo vai ficar pendurado
async function seedUnit() {
  const unit = await prisma.unit.upsert({
    where: { unit_code: UNIT_CODE },
    update: {},
    create: {
      name: "ETEC de São Paulo",
      unit_type: UnitType.Etec,
      address: "Rua da Etec, 123 - Centro",
      phone: "(11) 9999-8888",
      unit_code: UNIT_CODE,
      is_extension: false,
    },
  })

  console.log(`🏫 Unidade: ${unit.name} (${unit.unit_code})`)
  return unit
}

// Cria os cargos, um por um, sem duplicar quem já existe
async function seedRoles() {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { permission_level: role.permission_level, description: role.description },
      create: role,
    })
  }

  console.log(`👔 ${ROLES.length} cargos garantidos`)

  // Devolve o cargo de Administrador, que é o que o admin vai usar
  return prisma.role.findUniqueOrThrow({ where: { name: "Administrador" } })
}

// Cria o administrador: é com ele que você vai conseguir entrar no sistema web
async function seedAdmin(unitId: number, roleId: number, password: string) {
  // A senha nunca vai pro banco em texto puro, só o hash
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  const person = await prisma.person.upsert({
    where: { cpf: ADMIN_CPF },
    update: { system_access_hash: passwordHash, registration_unit_id: unitId },
    create: {
      full_name: "Administrador do Sistema",
      birth_date: new Date("1990-01-01"),
      cpf: ADMIN_CPF,
      email: ADMIN_EMAIL,
      phone: "(11) 99999-9999",
      type: PersonType.employee,
      main_unit_type: UnitType.Etec,
      system_access_hash: passwordHash,
      registration_unit_id: unitId,
    },
  })

  await prisma.employee.upsert({
    where: { person_id: person.id },
    update: { role_id: roleId, active: true },
    create: {
      registration_number: ADMIN_REGISTRATION,
      admission_date: new Date("2025-01-01"),
      active: true,
      person_id: person.id,
      role_id: roleId,
    },
  })

  console.log(`🔑 Administrador: ${person.email}`)
  return person
}

// Cria um aluno de exemplo, pra listagem de alunos não abrir vazia
async function seedExampleStudent(unitId: number) {
  const person = await prisma.person.upsert({
    where: { cpf: "12345678909" },
    update: {},
    create: {
      full_name: "Aluno de Exemplo",
      birth_date: new Date("2006-05-20"),
      cpf: "12345678909",
      email: "aluno.exemplo@etec001.com.br",
      phone: "(11) 98888-7777",
      type: PersonType.student,
      main_unit_type: UnitType.Etec,
      registration_unit_id: unitId,
    },
  })

  await prisma.student.upsert({
    where: { person_id: person.id },
    update: {},
    create: {
      rm: "23130",
      period: Period.morning,
      course: "Desenvolvimento de Sistemas",
      class: "3 DS",
      responsible: "Responsável de Exemplo",
      person_id: person.id,
    },
  })

  console.log("🎓 Aluno de exemplo criado")
  return person
}

// Cria uma digital de exemplo e liga ela no administrador
async function seedExampleBiometric(unitId: number, personId: number) {
  // Já existe alguma digital pra essa pessoa? Então não precisa criar de novo
  const alreadyThere = await prisma.peopleBiometrics.findFirst({ where: { person_id: personId } })
  if (alreadyThere) {
    console.log("👆 Digital de exemplo já existia")
    return
  }

  const biometric = await prisma.biometric.create({
    data: {
      // Template de mentirinha, só pra ter algo no banco (o de verdade vem do sensor R307)
      template: Buffer.from("TemplateDeExemploParaTestes"),
      finger: Finger.index_right,
      registration_unit_id: unitId,
      device: "R307",
    },
  })

  await prisma.peopleBiometrics.create({
    data: { person_id: personId, biometric_id: biometric.id },
  })

  console.log("👆 Digital de exemplo criada")
}

// Cria uns registros de acesso pra dashboard ter o que mostrar
async function seedExampleLogs(unitId: number, personId: number) {
  const alreadyThere = await prisma.biometricLog.findFirst({ where: { person_id: personId } })
  if (alreadyThere) {
    console.log("📋 Logs de exemplo já existiam")
    return
  }

  await prisma.biometricLog.create({
    data: {
      event_type: EventType.entry,
      biometric_device: "R307",
      is_authorized: true,
      person_id: personId,
      unit_id: unitId,
    },
  })

  await prisma.webAccessLog.create({
    data: {
      login_time: new Date(),
      event_type: EventType.entry,
      person_id: personId,
      unit_id: unitId,
    },
  })

  console.log("📋 Logs de exemplo criados")
}

// Descobre qual senha usar pro admin: a do .env ou uma aleatória que a gente mostra no final
function resolveAdminPassword(): { password: string; wasGenerated: boolean } {
  const fromEnv = process.env.SEED_ADMIN_PASSWORD

  if (fromEnv) return { password: fromEnv, wasGenerated: false }

  // Sem SEED_ADMIN_PASSWORD no .env, gera uma na hora (via crypto) e imprime uma única vez.
  // O sufixo fixo garante maiúscula, número e símbolo, que é o que o schema de senha exige.
  const generated = `Etec${randomBytes(6).toString("hex")}A1!`
  return { password: generated, wasGenerated: true }
}

async function main() {
  console.log("🌱 Populando o banco...\n")

  const { password, wasGenerated } = resolveAdminPassword()

  const unit = await seedUnit()
  const adminRole = await seedRoles()
  const admin = await seedAdmin(unit.id, adminRole.id, password)
  await seedExampleStudent(unit.id)
  await seedExampleBiometric(unit.id, admin.id)
  await seedExampleLogs(unit.id, admin.id)

  console.log("\n✅ Banco populado com sucesso!")
  console.log("\n📌 Pra entrar no sistema:")
  console.log(`   E-mail:  ${ADMIN_EMAIL}`)
  console.log(`   Unidade: ${UNIT_CODE}`)

  if (wasGenerated) {
    console.log(`   Senha:   ${password}`)
    console.log("\n⚠️  Essa senha foi gerada agora e não vai aparecer de novo.")
    console.log("   Anota ela, ou define SEED_ADMIN_PASSWORD no .env e roda o seed outra vez.")
  } else {
    console.log("   Senha:   a que você colocou em SEED_ADMIN_PASSWORD no .env")
  }
}

main()
  .catch((error) => {
    console.error("❌ Deu ruim no seed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
