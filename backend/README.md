<div align="center">

# Backend · BioAccess API

**API REST do sistema de controle de acesso biométrico**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat-square&logo=fastify&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white)

</div>

---

## O que é

A API que guarda e serve tudo: pessoas, digitais, unidades, cargos e o histórico de
acesso. É ela que o frontend consome, que o módulo C++ chama pra cadastrar uma digital e
que o módulo Python usa pra registrar quem passou pela catraca.

Escrita à mão em TypeScript, sem gerador de código: Fastify pro servidor, Zod pra validar
tudo que entra e sai, Prisma pro banco e JWT pra autenticação.

## Como o código é organizado

O caminho de uma requisição é sempre o mesmo — **rota → controller → service → banco**:

```
src/
├── server.ts              Monta o servidor, os plugins e liga tudo
├── routes/
│   ├── index.ts           Junta os módulos e separa público de privado
│   ├── auth.routes.ts     Um arquivo por domínio, com os schemas Zod dele
│   ├── people.routes.ts
│   ├── ...
│   └── schemas/shared.ts  Validações reusadas (CPF, data, senha, paginação)
├── controllers/           Recebe a requisição, valida o caso de uso, responde HTTP
│   ├── auth/
│   ├── people/
│   └── ...
├── services/              A regra de negócio e o acesso ao banco
│   ├── auth/
│   ├── people/
│   └── ...
├── middlewares/
│   └── authMiddleware.ts  O porteiro: confere o token e monta o request.user
├── lib/
│   └── errorHandler.ts    Tratamento de erro centralizado
├── config/
│   ├── app.ts             Todas as variáveis de ambiente, num lugar só
│   └── prisma.ts          Uma única instância do Prisma pro app inteiro
└── utils/                 CPF, gerador de senha, envio de e-mail
```

**Quem faz o quê:**

- **Rota** define o caminho e o schema Zod (o que entra e o que sai). O handler é uma
  linha só: `return new XxxController().handle(request, reply)`.
- **Controller** tem um único método público, `handle`. Ele orquestra e delega; cada
  responsabilidade dele vira um método privado (`validateBirthDate`, `findUnit`,
  `handleServiceError`). O `handle` fica legível como um roteiro de passos.
- **Service** tem um único método público, `execute`. É onde mora a regra de negócio e a
  conversa com o Prisma, também com métodos privados pra cada pedaço.
- **Erro** o service joga (`throw new Error("mensagem")`), o controller traduz pro HTTP
  no formato `{ error: "CodigoEmPascalCase", message: "mensagem amigável" }`.

Todo arquivo começa com um cabeçalho que diz pra que ele serve, quem escreveu e o
histórico de versões dele. Ao mexer num arquivo, incremente a versão e acrescente uma
linha em `Alterações:`.

## Rodando

```bash
npm install
cp .env.example .env   # já vem preenchido pra um PostgreSQL local padrão
npm run dev
```

É só isso. O `npm run dev` chama o `scripts/setup-db.ts` antes de ligar a API, e ele:

1. cria o banco do `DATABASE_URL` se ele ainda não existir;
2. aplica as migrações pendentes (`prisma migrate deploy`);
3. roda o seed, que usa `upsert` e por isso pode rodar toda vez sem duplicar nada.

O login sai do próprio `.env`: `SEED_ADMIN_EMAIL` (padrão `admin@etec01.com.br`) e
`SEED_ADMIN_PASSWORD` (padrão `Admin@123`). Como o seed roda a cada subida, trocar a senha
no `.env` e subir de novo já reescreve a senha do administrador. Se você apagar o
`SEED_ADMIN_PASSWORD`, o seed gera uma aleatória e imprime ela no terminal uma vez só.

O que o PostgreSQL precisa é estar instalado e rodando — o banco em si o script cria.

- API: `http://localhost:2077`
- Swagger: `http://localhost:2077/docs`
- Saúde: `GET /health`

## Comandos

| Comando | O que faz |
| :--- | :--- |
| `npm run dev` | Prepara o banco e sobe a API recarregando a cada alteração |
| `npm run dev:only` | Sobe só a API, pulando a preparação do banco |
| `npm run db:setup` | Só a preparação do banco: cria, migra e popula |
| `npm run build` | Compila pra `dist/` |
| `npm start` | Roda a versão compilada |
| `npm run typecheck` | Confere os tipos sem gerar arquivo |
| `npm run smoke` | Sobe a API em memória e confere as respostas (sem banco) |
| `npm run db:generate` | Gera o client do Prisma |
| `npm run db:migrate` | Cria uma migração a partir do schema |
| `npm run db:deploy` | Aplica as migrações existentes |
| `npm run db:seed` | Popula o banco |
| `npm run db:studio` | Abre o Prisma Studio |

### O smoke test

`npm run smoke` monta o servidor em memória com o `inject()` do Fastify — sem abrir porta
e **sem precisar de banco** — e confere que:

- o servidor sobe e todas as rotas registram;
- o Swagger gera a especificação;
- corpo inválido devolve `400` com a lista de campos errados;
- rota privada sem token devolve `401`.

Sai com código 1 se algum caso falhar, então dá pra usar em CI.

---

## Autenticação

Login em `POST /login` devolve um JWT. Toda rota privada exige o cabeçalho:

```
Authorization: Bearer <token>
```

Quem passa pelo porteiro: **coordenador, funcionário e inspetor**. Aluno e visitante são
cadastrados no sistema mas não têm login — eles não administram nada. Funcionário com a
conta desativada também é barrado.

O `authMiddleware` coloca em `request.user` o id, o nome, o e-mail, o tipo, a unidade e o
nível de permissão do cargo. O formato desse objeto é declarado num lugar só, em
`src/@types/fastify.d.ts`.

## O modelo de dados

`Person` é a raiz: **tudo é uma pessoa antes de ser qualquer outra coisa.** Os perfis
específicos pendem dela numa relação 1-para-1:

```
Unit ─┬─< Person ─┬─< Student
      │           ├─< Employee ──< Teacher
      │           ├─< Visitor
      │           ├─< PeopleBiometrics >── Biometric
      │           ├─< BiometricLog
      │           ├─< WebAccessLog
      │           └─< Token
      └─< Biometric

Role ──< Employee
```

Por isso o cadastro é em duas etapas: primeiro `POST /people`, depois
`POST /students` (ou `/employees`, `/visitors`) informando o CPF que já existe. Assim
ninguém aparece duplicado quando é aluno e depois vira funcionário.

Apagar uma pessoa apaga em cascata as digitais, o perfil e o histórico de acesso dela.

## Rotas

Toda rota tem schema Zod, e a documentação completa (com os campos de cada uma) fica no
Swagger em `/docs`.

**Públicas**

| Método | Rota | O que faz |
| :--- | :--- | :--- |
| `POST` | `/login` | Autentica e devolve o token |
| `POST` | `/forgot-password` | Manda uma senha temporária por e-mail |
| `GET` | `/health` | Diz se a API está no ar |

**Privadas** (exigem `Authorization: Bearer <token>`)

| Método | Rota | O que faz |
| :--- | :--- | :--- |
| `GET` | `/me` | Dados completos de quem está logado |
| `POST` | `/logout` | Encerra a sessão e calcula a duração |
| `POST` | `/change-password` | Troca a senha |
| `GET` | `/dashboard/statistics` | Totais gerais |
| `GET` | `/dashboard/people-breakdown` | Pessoas por tipo |
| `GET` | `/dashboard/unit-breakdown` | Unidades por tipo |
| `GET` | `/roles` | Cargos disponíveis |
| `POST` `GET` `DELETE` | `/people` | Cria, lista e apaga pessoas |
| `POST` | `/people/get-people` | Busca uma pessoa pelo CPF (no corpo) |
| `PATCH` | `/people/:cpf` | Atualiza uma pessoa |
| `POST` `GET` | `/students` | Cria e lista alunos |
| `PATCH` | `/students/:rm` | Atualiza um aluno |
| `POST` `GET` | `/employees` | Cria e lista funcionários |
| `POST` | `/employees/get-by-registration` | Busca pelo número de registro |
| `PATCH` | `/employees/:cpf` | Atualiza um funcionário |
| `POST` `GET` | `/teachers` | Cria e lista professores |
| `PATCH` | `/teachers/:id` | Atualiza um professor |
| `POST` `GET` | `/visitors` | Cria e lista visitantes |
| `PATCH` | `/visitors/:id` | Atualiza um visitante |
| `POST` `GET` | `/units` | Cria e lista unidades |
| `PATCH` `DELETE` | `/units/:id` | Atualiza e apaga uma unidade |
| `POST` `GET` `DELETE` | `/biometrics` | Cria, lista e apaga digitais |
| `GET` | `/biometrics/generate/:finger` | Gera um template aleatório pra teste |
| `GET` | `/biometric-access-logs` | Histórico de acessos pela catraca |
| `GET` | `/web-access-logs` | Histórico de logins no sistema |

## Formato das respostas de erro

Erro de validação (`400`):

```json
{
  "error": "ValidationError",
  "message": "Alguns campos vieram errados, confere a lista aí",
  "details": [{ "path": "email", "message": "Email com formato errado" }]
}
```

Qualquer outro erro:

```json
{ "error": "DuplicateCPF", "message": "CPF já cadastrado!" }
```

Erro de servidor (`5xx`) nunca expõe a mensagem interna: o detalhe vai pro log, e o
cliente recebe uma mensagem genérica.

---

## Variáveis de ambiente

Todas estão documentadas campo por campo em [`.env.example`](./.env.example).

| Variável | Pra que serve |
| :--- | :--- |
| `NODE_ENV` | `development`, `staging` ou `production` |
| `PORT` / `HOST` | Onde a API escuta |
| `DATABASE_URL` | Conexão com o PostgreSQL |
| `JWT_SECRET` | Segredo que assina o token (mínimo 32 caracteres) |
| `JWT_EXPIRES_IN` | Validade do token (ex: `8h`) |
| `CORS_ORIGIN` | Endereços do front que podem chamar a API, separados por vírgula |
| `EMAIL_USER` / `EMAIL_PASS` / `EMAIL_FROM` | Conta que envia os e-mails |
| `FRONTEND_URL` | Endereço usado nos links dentro dos e-mails |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Credenciais do admin criado pelo seed |

Em **produção** a API se recusa a subir se faltar `DATABASE_URL`, se o `JWT_SECRET` for o
padrão ou tiver menos de 32 caracteres, ou se o `CORS_ORIGIN` estiver como `*`. Falhar na
subida é melhor do que rodar inseguro.

## Problemas comuns

**`P1000: Authentication failed`** — usuário ou senha errados no `DATABASE_URL`.

**`P1001: Can't reach database server`** — o PostgreSQL não está rodando, ou o host e a
porta estão errados.

**A API sobe mas o frontend não recebe nada** — `CORS_ORIGIN` precisa incluir o endereço
do front (`http://localhost:5173` por padrão).

**Login devolve 403** — o tipo do usuário não tem acesso ao sistema web, ou a conta de
funcionário está desativada.

**Um campo que o service devolve não chega no frontend** — o serializer do Fastify joga
fora o que não está declarado no schema de resposta da rota. Acrescente o campo no
schema, em `src/routes/*.routes.ts`.

**Quero recomeçar o banco** — `npx prisma migrate reset`. Isso **apaga todos os dados**.
