<div align="center">

| <img src="./frontend/public/placeholder.svg" width="80" alt="BioAccess Icon" align="center"> | <h1 align="center">Biometric Access System</h1> |
|----------------------------------------------------------------------------|:---------------------------------:|

---

</div>

<div>
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white">
<img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white">
<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black">
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
<img src="https://img.shields.io/badge/C++-00599C?style=for-the-badge&logo=cplusplus&logoColor=white">
<img src="https://img.shields.io/badge/Python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54">
<img src="https://img.shields.io/badge/Fastify-%23000000.svg?style=for-the-badge&logo=fastify&logoColor=white">
<img src="https://img.shields.io/badge/Prisma-%2314BF96.svg?style=for-the-badge&logo=Prisma&logoColor=white">
<img src="https://img.shields.io/badge/Zod-%233068b7.svg?style=for-the-badge&logo=zod&logoColor=white">
<img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens">
<img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white">
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">
</div>

---

## 💻 Nome do Projeto
**Biometric Access System**

## 🏫 Instituição
ETEC Dr. Geraldo José Rodrigues Alckmin - Taubaté

## 👥 Integrantes da Equipe
- Arthur Roberto Weege Pontes (Backend TypeScript e Frontend React (TSX))
- Douglas Henrique Santos Xavier & Guilherme Moreira da Rocha (Sistema Python)
- Guilherme Silveira Fernandes (Interface C++)

## 📋 Descrição do Projeto
O **Biometric Access System** é um sistema completo de controle de acesso biométrico desenvolvido para instituições de ensino. Ele integra diversas tecnologias para o cadastro, verificação e gerenciamento de biometrias, utilizando o sensor R307. A solução oferece uma interface web intuitiva para administração e módulos de backend para processamento de dados e comunicação com hardware.

> Trabalho de Conclusão de Curso (TCC) - ETEC Dr. Geraldo José Rodrigues Alckmin

---

## 🎥 Vídeo Sobre o Projeto

*   **A ser adicionado:** Link para vídeo de demonstração do projeto.

---

## 🛠️ Tecnologias Utilizadas

### Backend TypeScript
- **Linguagem:** Node.js (TypeScript)
- **Framework:** Fastify
- **Banco de Dados:** PostgreSQL
- **ORM:** Prisma
- **Validações:** Zod
- **Autenticação:** JWT
- **Criptografia:** bcrypt

### Sistema Python
- **Linguagem:** Python
- **Conexão DB:** psycopg2
- **Comunicação Serial:** pyserial (para sensor)
- **Codificação:** base64
- **Logs:** logging

### Frontend React (TSX)
- **Framework:** React
- **Build Tool:** Vite
- **Estilização:** Tailwind CSS
- **UI Library:** shadcn/ui
- **Roteamento:** React Router
- **Ícones:** Lucide Icons

### Interface C++
- **Comunicação Serial:** Para sensor R307
- **Comunicação HTTP:** Para interagir com o Backend TypeScript
- **Comunicação Interprocessos (IPC) / Socket:** Para interagir com o Sistema Python

---

## ⚙️ Instruções de Setup

### Requisitos
- **Node.js**: versão `18+`
- **Python**: versão `3.11+`
- **PostgreSQL**
- **Sensor R307** (para produção e testes físicos)

### 1. Clonar repositório
```bash
git clone https://github.com/TCCpanthers/biometricaccesssystem.git
cd biometricaccesssystem
```

### 2. Configurar banco de dados
```bash
# No diretório principal do projeto
pnpm install # Instala dependências do backend TypeScript
npx prisma generate
npx prisma db push
```

### 3. Backend TypeScript (API)
```bash
# No diretório principal do projeto
pnpm run dev
```
Servidor disponível em `http://localhost:3000` (ou porta configurada no `.env`)

### 4. Sistema Python (Consulta Biométrica)
```bash
# No diretório python_biometric_query
cd python_biometric_query
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações de banco de dados e sensor

# Executar em modo simulação (para testes sem sensor físico)
python main.py --mode simulation --unit ETEC01

# Executar em modo produção (com sensor R307 real)
python main.py --mode listener --unit ETEC01
```

### 5. Frontend React (TSX)
```bash
# No diretório frontend
cd frontend
pnpm install
pnpm run dev
```
Interface disponível em `http://localhost:5173` (ou porta configurada no `.env`)

### 6. Interface C++ (A ser implementada/compilada)
```bash
# No diretório c++_biometric_interface
cd c++_biometric_interface
# Siga as instruções específicas no README.md deste módulo para compilação e execução.
```

---

## 🌐 Variáveis de Ambiente

### Backend TypeScript (`.env` no diretório raiz)
```env
# Configurações do Servidor
PORT=3000
HOST=0.0.0.0

# Banco de Dados
DATABASE_URL="postgresql://user:password@localhost:5432/biometric_access_system"

# Autenticação JWT
JWT_SECRET="sua_chave_secreta_jwt_aqui"

# Email (para notificações, ex: recuperação de senha)
EMAIL_USER="seu_email_aqui@example.com"
EMAIL_PASS="sua_senha_de_aplicativo_ou_app_password"

# URL do servidor Python (se aplicável para comunicação direta)
PYTHON_SERVER_URL="http://localhost:5000"

# URL do Frontend (para CORS, se não for '*')
FRONTEND_URL="http://localhost:5173"
```

### Sistema Python (`python_biometric_query/.env`)
```env
# Banco de Dados (deve ser o mesmo do TypeScript)
DATABASE_URL="postgresql://user:password@localhost:5432/biometric_access_system"

# Configuração do Sensor R307
SENSOR_DEVICE=R307
SENSOR_PORT=/dev/ttyUSB0  # Porta serial onde o sensor está conectado
SENSOR_BAUDRATE=57600     # Taxa de comunicação do sensor

# Configuração de Logs
LOG_LEVEL=INFO            # Nível de detalhe dos logs (DEBUG, INFO, WARNING, ERROR)
LOG_FILE=biometric_query.log # Nome do arquivo de log

# Unidade escolar padrão para operações do sensor
DEFAULT_UNIT_CODE=ETEC01
```

### Frontend React (`frontend/.env`)
```env
# URL da API do Backend TypeScript
VITE_API_URL="http://localhost:3000/api"
```

---

## 📄 Documentação da API

A documentação interativa da API (Swagger UI) pode ser acessada ao iniciar o servidor TypeScript, visitando a rota `/docs` em seu navegador:

`http://localhost:3000/docs`

Você pode importar as rotas para o seu cliente API (como Insomnia ou Postman) utilizando o arquivo:

- <u><a href="./insomnia.json">Rotas API em arquivo .json</a></u>

---

## 🚨 Troubleshooting

### Problemas Comuns

1.  **Erro de conexão com o banco de dados:**
    *   Verifique se a `DATABASE_URL` está correta em ambos os arquivos `.env` (TypeScript e Python).
    *   Confirme se o servidor PostgreSQL está em execução.
    *   Verifique as credenciais de acesso ao banco de dados.

2.  **Sensor R307 não conecta/não responde:**
    *   Verifique a porta serial configurada em `python_biometric_query/.env` (`SENSOR_PORT`).
    *   Verifique as permissões de acesso à porta serial (ex: `sudo chmod 666 /dev/ttyUSB0`).
    *   Certifique-se de que o sensor está corretamente conectado e alimentado.

3.  **Frontend não carrega ou não se comunica com o backend:**
    *   Verifique se o backend TypeScript está rodando (`pnpm run dev`).
    *   Confirme se `VITE_API_URL` em `frontend/.env` aponta para o endereço correto do backend.
    *   Verifique as configurações de CORS no backend (atualmente configurado para `*`, mas pode ser restrito).

---

## ❓ Perguntas Frequentes

**Q: Como testar o sistema sem um dispositivo biométrico físico?**
R: Utilize o modo de simulação do sistema Python. No diretório `python_biometric_query`, execute: `python main.py --mode simulation --unit ETEC01`

**Q: Como resetar o banco de dados e aplicar novas migrações?**
R: No diretório principal do projeto, execute: `npx prisma migrate reset`

**Q: Onde posso encontrar mais detalhes técnicos sobre a arquitetura e implementação?**
R: Consulte os arquivos `README.md` específicos de cada módulo (`frontend`, `python_biometric_query`, `c++_biometric_interface`) e a documentação gerada pelo Swagger UI (`/docs`).

---

> Desenvolvido com ❤️ para o TCC do curso de Análise e Desenvolvimento de Sistemas  
> ETEC Dr. Geraldo José Rodrigues Alckmin - 2025  
> Contato: tccpanthersoficial@gmail.com

