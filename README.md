<div align="center">

<img src="./frontend/public/favicon.svg" width="72" alt="BioAccess">

# BioAccess

**Controle de acesso por biometria para Etecs e Fatecs**

Trabalho de Conclusão de Curso · ETEC Dr. Geraldo José Rodrigues Alckmin · Taubaté/SP

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat-square&logo=fastify&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![C++](https://img.shields.io/badge/C++-00599C?style=flat-square&logo=cplusplus&logoColor=white)
![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-informational?style=flat-square)

</div>

---

## O que é

O BioAccess substitui o crachá pela digital. Um sensor **R307** instalado na catraca
identifica a pessoa, o sistema confere se ela tem acesso àquela unidade e registra a
entrada ou a saída na hora.

Crachá se perde, se esquece em casa e é emprestado pra quem não deveria entrar. E quando
o controle é feito em papel ou planilha, saber quem estava na escola numa determinada
hora vira uma investigação. A digital resolve as duas coisas: não se empresta, e o
registro é automático.

A coordenação administra tudo por uma interface web: cadastra alunos, professores,
funcionários e visitantes, registra as digitais e consulta o histórico completo — sempre
no escopo da própria unidade.

## Como as partes se encaixam

```
                  ┌──────────────────────────┐
   Catraca        │  Arduino + sensor R307   │
                  └────────────┬─────────────┘
                               │ serial
                  ┌────────────▼─────────────┐
                  │   Interface C++          │  lê a digital, decide o fluxo
                  └──────┬────────────┬──────┘
                 HTTP    │            │   linha de comando
        (cadastrar)      │            │   (consultar)
                  ┌──────▼─────┐  ┌───▼──────────────┐
                  │  API       │  │  Módulo Python   │  compara a digital
                  │ TypeScript │◄─┤                  │  e grava o acesso
                  └──────┬─────┘  └───┬──────────────┘
                         │            │
                    ┌────▼────────────▼────┐
                    │     PostgreSQL       │
                    └────┬─────────────────┘
                         │
                  ┌──────▼───────────┐
                  │ Interface web    │  administração e consulta
                  │ React            │
                  └──────────────────┘
```

| Módulo | Tecnologia | O que faz | Autor |
| :--- | :--- | :--- | :--- |
| [`backend/`](./backend) | TypeScript · Fastify · Prisma | API REST, regras de negócio e acesso ao banco | Arthur Roberto Weege Pontes |
| [`frontend/`](./frontend) | React · Vite · Tailwind | Interface de administração e consulta | Arthur Roberto Weege Pontes |
| [`python/`](./python) | Python · psycopg2 · pyserial | Compara a digital lida e registra o acesso | Douglas Henrique Santos Xavier e Guilherme Moreira da Rocha |
| [`c++/`](./c++) | C++ · libcurl | Comunicação serial com o sensor R307 | Guilherme Silveira Fernandes |

## O que o sistema faz

- **Cadastro por perfil.** Aluno, professor, funcionário, coordenador, inspetor e
  visitante. O cadastro é em duas etapas: primeiro a **pessoa** (nome, CPF validado,
  e-mail, unidade), depois os dados do perfil dela. Assim ninguém aparece duplicado
  quando é aluno e depois vira funcionário.
- **Registro de digitais.** Até dez digitais por pessoa, uma por dedo. O template vem do
  sensor e fica vinculado à unidade onde foi registrado.
- **Histórico de acessos.** Toda passagem pela catraca fica registrada com pessoa,
  horário, dispositivo e se o acesso foi autorizado ou negado.
- **Auditoria de login.** Quem entrou no sistema web, quando saiu e quanto tempo ficou.
- **Várias unidades.** Cada Etec ou Fatec tem código próprio e pode ser sede ou extensão.
  O usuário vê e administra só o cadastro da unidade dele.
- **Acesso e senha.** Quem faz parte da equipe recebe uma senha temporária por e-mail e
  define a definitiva no primeiro acesso.

---

## Rodando o projeto

### O que você precisa

| | Versão |
| :--- | :--- |
| Node.js | 18 ou mais novo |
| Python | 3.11 ou mais novo |
| PostgreSQL | 14 ou mais novo |
| CMake + compilador C++ | só pro módulo C++ (opcional) |
| Sensor R307 | só pra uso real; dá pra testar sem ele |

### 1. Clonar e criar o banco

```bash
git clone https://github.com/<seu-usuario>/biometric-access-control-system.git
cd biometric-access-control-system

# Crie um banco vazio no PostgreSQL
createdb biometric_access
```

### 2. Backend (a API)

```bash
cd backend
npm install

cp .env.example .env
# Abra o .env e preencha o DATABASE_URL e o JWT_SECRET.
# Pra gerar um JWT_SECRET aleatório:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

npm run db:deploy   # aplica as migrações
npm run db:seed     # cria a unidade, os cargos e o usuário administrador
npm run dev
```

O seed imprime no terminal o e-mail e a senha do administrador. **Anote a senha:** ela
aparece uma vez só. Se preferir escolher a senha, defina `SEED_ADMIN_PASSWORD` no `.env`
antes de rodar o seed.

- API: `http://localhost:2077`
- Documentação interativa (Swagger): `http://localhost:2077/docs`

### 3. Frontend (a interface web)

```bash
cd frontend
npm install

cp .env.example .env   # já vem apontando pra API em localhost:2077
npm run dev
```

Interface em `http://localhost:5173`. Entre com o e-mail e a senha que o seed imprimiu.

### 4. Módulo Python (a consulta biométrica)

```bash
cd python
pip install -r requirements.txt

cp .env.example .env
# Use o MESMO DATABASE_URL do backend

# Sem o sensor, em modo de simulação:
python main.py --mode simulation --unit ETE001

# Com o sensor R307 conectado:
python main.py --mode listener --unit ETE001
```

### 5. Interface C++ (opcional, precisa do sensor)

```bash
cd c++
cmake -S . -B build
cmake --build build

# O endereço da API e o token vêm do ambiente
export BIOACCESS_API_URL=http://127.0.0.1:2077
export BIOACCESS_API_TOKEN=<token JWT obtido no login>
export BIOACCESS_UNIT_CODE=ETE001

./build/biometric_interface consulta index_right
```

> O `sensor_communication.cpp` usa a API serial do Windows, então hoje este módulo
> compila só no Windows.

---

## Testando sem o sensor R307

Não precisa do hardware pra ver o sistema funcionando:

1. **Template gerado pela API.** A rota `GET /biometrics/generate/:finger` devolve um
   template biométrico aleatório e válido. A tela de cadastro de digital usa ela.
2. **Modo de simulação do Python.** `python main.py --mode simulation --unit ETE001`
   simula leituras sem porta serial.
3. **Template simulado no C++.**
   `biometric_interface consulta index_right SIMULATED_GRANTED_TEMPLATE`

---

## Comandos úteis

**Backend** (`cd backend`)

| Comando | O que faz |
| :--- | :--- |
| `npm run dev` | Sobe a API recarregando a cada alteração |
| `npm run build` | Compila pra `dist/` |
| `npm start` | Roda a versão compilada |
| `npm run typecheck` | Confere os tipos sem gerar arquivo |
| `npm run smoke` | Testa se as rotas respondem o esperado (não precisa de banco) |
| `npm run db:migrate` | Cria uma migração nova a partir do schema |
| `npm run db:deploy` | Aplica as migrações existentes |
| `npm run db:seed` | Popula o banco com os dados iniciais |
| `npm run db:studio` | Abre o Prisma Studio pra olhar o banco |

**Frontend** (`cd frontend`)

| Comando | O que faz |
| :--- | :--- |
| `npm run dev` | Sobe a interface em modo de desenvolvimento |
| `npm run build` | Gera a versão de produção |
| `npm run preview` | Serve a versão de produção localmente |
| `npm run typecheck` | Confere os tipos |
| `npm run lint` | Roda o ESLint |

---

## Variáveis de ambiente

Nenhum `.env` vai pro repositório. Cada módulo tem um `.env.example` documentado, campo
por campo — copie e preencha:

| Módulo | Arquivo modelo |
| :--- | :--- |
| Backend | [`backend/.env.example`](./backend/.env.example) |
| Frontend | [`frontend/.env.example`](./frontend/.env.example) |
| Python | [`python/.env.example`](./python/.env.example) |

> No frontend, só variáveis com prefixo `VITE_` chegam ao navegador — e justamente por
> isso **nunca** coloque segredo lá: tudo que está nesse arquivo vira código público.

---

## Problemas comuns

**A API não sobe e reclama do banco.**
Confira se o PostgreSQL está rodando e se o `DATABASE_URL` do `.env` está certo. Teste na
mão: `psql "postgresql://usuario:senha@localhost:5432/biometric_access"`.

**O frontend carrega mas nenhuma lista aparece.**
Ou a API não está rodando, ou o CORS está bloqueando. O `CORS_ORIGIN` do backend precisa
incluir o endereço do frontend (por padrão `http://localhost:5173`).

**Login diz "Acesso restrito à coordenação e funcionários".**
Só coordenador, funcionário e inspetor têm login no sistema web. Aluno e visitante são
cadastrados e passam pela catraca, mas não administram nada.

**Cadastrei a pessoa e ela não aparece na lista de alunos.**
Falta a segunda etapa. Vá em *Alunos → Cadastrar* e informe o CPF dela junto com o RM, o
período e o curso.

**Não consigo excluir uma unidade.**
O sistema não deixa apagar unidade que ainda tem gente cadastrada, pra não deixar pessoas
e digitais órfãs. Remova ou transfira as pessoas primeiro.

**Quero começar o banco de novo.**
`npx prisma migrate reset` dentro de `backend/`. Isso **apaga todos os dados**.

---

## Equipe

| Integrante | Módulo |
| :--- | :--- |
| Arthur Roberto Weege Pontes | Backend TypeScript e Frontend React |
| Douglas Henrique Santos Xavier | Sistema Python |
| Guilherme Moreira da Rocha | Sistema Python |
| Guilherme Silveira Fernandes | Interface C++ |

## Licença

[MIT](./LICENSE).

<div align="center">

Desenvolvido para o TCC do curso técnico — ETEC Dr. Geraldo José Rodrigues Alckmin, 2025

</div>
