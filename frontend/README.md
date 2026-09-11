<div align="center">

<img src="./public/favicon.svg" width="64" alt="BioAccess">

# Frontend · BioAccess

**Interface web de administração do controle de acesso biométrico**

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=flat-square&logo=shadcnui&logoColor=white)

</div>

---

## O que é

A tela por onde a coordenação administra o sistema: cadastra pessoas e digitais, gerencia
unidades e consulta o histórico de quem entrou e saiu.

Tudo que aparece aqui é filtrado pela **unidade do usuário logado** — cada Etec ou Fatec
administra o próprio pessoal.

## Rodando

```bash
npm install

cp .env.example .env   # já aponta pra API em localhost:2077
npm run dev
```

Interface em `http://localhost:5173`. Precisa da API rodando ([`../backend`](../backend)).
Entre com o e-mail e a senha que o seed do backend imprimiu.

| Comando | O que faz |
| :--- | :--- |
| `npm run dev` | Sobe em modo de desenvolvimento |
| `npm run build` | Confere os tipos e gera a versão de produção |
| `npm run preview` | Serve a versão de produção localmente |
| `npm run typecheck` | Só confere os tipos |
| `npm run lint` | Roda o ESLint |

## Como o código é organizado

```
src/
├── main.tsx              Entrada da aplicação
├── App.tsx               Provedores e o mapa de rotas (carregadas por demanda)
├── index.css             O design system: todas as cores, em tokens HSL
├── contexts/
│   └── AuthContext.tsx   Sessão, login, logout e o unit_code do usuário
├── services/
│   └── api.ts            Cliente axios: token, erros e barra de progresso
├── components/
│   ├── ui/               Componentes do shadcn/ui
│   ├── layout/           AppLayout, Header, AppSidebar, PageFallback
│   ├── dashboard/        StatCard
│   ├── theme/            Alternador de tema claro/escuro e de paleta
│   ├── navigation/       Breadcrumbs
│   └── visual/           Animação da digital e barra de carregamento
├── pages/                Uma pasta por domínio
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── people/  students/  employees/  teachers/  visitors/
│   ├── biometrics/  units/  logs/
│   ├── settings/  profile/
│   └── marketing/        Sobre, Recursos e Perguntas frequentes
├── hooks/
│   ├── use-confirm.tsx   Confirmação de ação sem volta
│   ├── use-toast.ts
│   └── use-mobile.ts
├── types/                Tipos que espelham o modelo do backend
└── utils/
```

## Coisas que vale saber antes de mexer

### A unidade vem do contexto, nunca chumbada

Praticamente toda listagem precisa do `unit_code` pra filtrar. Ele vem do perfil do
usuário logado, e existe um atalho pra isso:

```tsx
import { useUnitCode } from "@/contexts/AuthContext"

const unitCode = useUnitCode()

useEffect(() => {
  // Enquanto o perfil não chegou, a gente não sabe qual unidade consultar
  if (!unitCode) return
  carregar()
}, [unitCode])
```

O `AuthContext` busca `/me` depois do login justamente pra ter esse dado, porque o
`/login` não devolve o código da unidade. **Não escreva o código da unidade no arquivo:**
isso trava o sistema numa unidade só.

### O erro da API já é tratado no interceptor

O `services/api.ts` intercepta a resposta e já mostra o toast com a mensagem certa
(sessão expirada, acesso negado, campo inválido, servidor fora do ar). Na tela, o `catch`
só precisa registrar pra debug:

```tsx
try {
  await api.post("/people", dados)
} catch (error) {
  // O interceptor já avisou a pessoa; aqui é só pra debug
  console.error("Erro ao cadastrar:", error)
}
```

### Cor sempre em token, nunca escrita na mão

Toda cor mora em `index.css` como token HSL, e o `tailwind.config.ts` expõe cada uma como
classe. Componente não escreve cor.

Além dos tokens normais do shadcn, existem os **tokens com significado no domínio** — um
acesso é *autorizado* ou *negado*, não "verde" ou "vermelho":

| Token | Classe | Pra quê |
| :--- | :--- | :--- |
| `--authorized` | `bg-authorized`, `.badge-authorized` | Acesso liberado, cadastro ativo |
| `--denied` | `bg-denied`, `.badge-denied` | Acesso negado |
| `--pending` | `bg-pending`, `.badge-pending` | Aguardando, expirando |
| `--entry` / `--exit` | `text-entry`, `text-exit` | Entrada e saída no histórico |

Usar o token faz a cor significar a mesma coisa em toda tela e acompanhar o tema claro e
o escuro de graça.

### Identificador é monoespaçado

CPF, RM, código de unidade e template usam a classe `.identifier`, que aplica JetBrains
Mono com números tabulares — a pessoa vai comparar caractere por caractere.

### Confirmação de ação sem volta

Exclusão em cascata não pergunta com `confirm()` do navegador. Use o hook:

```tsx
const { confirmar, ConfirmDialog } = useConfirm()

const apagar = async () => {
  const ok = await confirmar({
    title: "Excluir João da Silva?",
    description: "Isso apaga as digitais e o histórico de acesso. Não tem como desfazer.",
    confirmLabel: "Excluir",
  })
  if (!ok) return
  // ...apaga
}

// E no JSX, uma vez só:
<ConfirmDialog />
```

### As telas são carregadas por demanda

Toda rota em `App.tsx` usa `lazy()` + `Suspense`, então cada tela vira um arquivo próprio
no build e só desce quando a pessoa navega pra ela. Ao criar uma tela nova, siga o mesmo
padrão — importar direto joga tudo de volta no arquivo principal.

## Temas

Dois eixos independentes, os dois no cabeçalho:

- **Claro / escuro / sistema** — via `next-themes`, com a classe `.dark` na raiz.
- **Paleta** — `Padrão` (o ciano da marca), `Violeta`, `Esmeralda` ou `Rose`. Só troca a
  cor da marca; o resto do sistema fica igual.

Quem tiver "reduzir movimento" ligado no sistema operacional recebe a interface
praticamente sem animação — isso está no `index.css` e não é enfeite: animação demais
causa desconforto real em algumas pessoas.

## Problemas comuns

**As listas ficam vazias e não dá erro.** O perfil ainda não carregou, então o
`unitCode` está `undefined` e a busca nem sai. Confira se o `/me` respondeu.

**"Não consegui falar com o servidor".** A API não está rodando, ou o `VITE_API_URL` do
`.env` aponta pro lugar errado.

**O login funciona mas toda requisição depois volta 401.** O token expirou (padrão de 8
horas) ou o `JWT_SECRET` do backend mudou. Entre de novo.

**Mudei o `.env` e nada aconteceu.** O Vite lê o `.env` na subida: pare e rode
`npm run dev` outra vez.

**Um campo existe na API mas chega `undefined` na tela.** O Fastify descarta o que não
está declarado no schema de resposta da rota. Acrescente o campo em
`backend/src/routes/*.routes.ts`.
