<div align="center">

| <img src="../frontend/public/placeholder.svg" width="80" alt="BioAccess Python Icon" align="center"> | <h1 align="center">Python Biometric Query System</h1> |
|----------------------------------------------------------------------------|:---------------------------------:|

---

</div>

<div>
<img src="https://img.shields.io/badge/Python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54">
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
<img src="https://img.shields.io/badge/psycopg2-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
</div>

---

## 💻 Nome do Projeto
**Python Biometric Query System**

## 📋 Descrição do Projeto
Este módulo Python é o coração da funcionalidade de consulta e verificação biométrica do **Biometric Access System**. Ele se integra diretamente com o sensor biométrico R307 e o banco de dados PostgreSQL para validar acessos em tempo real, registrar logs e fornecer um modo de simulação para testes sem hardware físico.

---

## 🛠️ Tecnologias Utilizadas
- **Linguagem:** Python 3.11+
- **Banco de Dados:** PostgreSQL
- **Driver DB:** psycopg2
- **Comunicação Serial:** pyserial (para interface com sensor R307)
- **Codificação:** base64 (para templates biométricos)
- **Logs:** Módulo `logging` padrão do Python

---

## ⚙️ Instruções de Setup

### Requisitos
- **Python**: versão `3.11+`
- **PostgreSQL** (o mesmo banco de dados usado pelo Backend TypeScript)
- **Sensor R307** (necessário para o modo `listener`)
- **Porta Serial** disponível e com permissões adequadas (ex: `/dev/ttyUSB0` no Linux)

### 1. Navegar para o diretório
```bash
cd biometricaccesssystem-project/biometricaccesssystem-project/python_biometric_query
```

### 2. Instalar dependências
```bash
pip install -r requirements.txt
```

### 3. Configurar variáveis de ambiente
Copie o arquivo `.env.example` para `.env` e configure as variáveis:
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas configurações:
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

### 4. Executar o sistema

#### Modo Listener (Produção com sensor físico)
```bash
python main.py --mode listener --unit ETEC01
```

#### Modo Simulação (Testes sem sensor físico)
```bash
python main.py --mode simulation --unit ETEC01
```

---

## 🌐 Modos de Operação

Este sistema pode ser executado em diferentes modos, controlados por argumentos de linha de comando:

-   `--mode listener`: Inicia a escuta da porta serial para interagir com o sensor R307 em tempo real.
-   `--mode simulation`: Permite simular a interação com o sensor, útil para desenvolvimento e testes.
-   `--mode query`: Realiza uma consulta biométrica única com um template fornecido.
-   `--mode test-db`: Testa a conexão com o banco de dados.
-   `--mode info`: Exibe as configurações atuais do sistema.

Exemplo de uso para consulta única:
```bash
python main.py --mode query --template "VGVzdCBiaW9tZXRyaWMgZGF0YQ==" --finger index_right --unit ETEC01
```

---

## 🔗 Integração com o Ecossistema BioAccess

Este módulo Python trabalha em conjunto com o Backend TypeScript e a Interface C++ para fornecer a funcionalidade completa de controle de acesso:

-   **Backend TypeScript:** Responsável pelo cadastro inicial de biometrias e gerenciamento de dados.
-   **Interface C++:** Atua como intermediário entre o sensor e os sistemas Python/TypeScript.
-   **Banco de Dados:** Compartilhado entre todos os módulos para consistência de dados.

### Fluxo de Dados (Consulta de Biometria)

1.  **Sensor R307:** Captura o template biométrico.
2.  **Interface C++:** Recebe o template do sensor e o encaminha para o sistema Python.
3.  **Sistema Python:** Recebe o template, consulta o banco de dados PostgreSQL para verificar a existência e permissão da biometria.
4.  **Sistema Python:** Retorna `YES` ou `NO` para a Interface C++.
5.  **Interface C++:** Controla a liberação do acesso (ex: catraca) com base na resposta do Python.

---

## 🚨 Troubleshooting

### Problemas Comuns

1.  **Erro de conexão com o banco de dados:**
    *   Verifique se a `DATABASE_URL` no arquivo `.env` está correta.
    *   Confirme se o servidor PostgreSQL está em execução.

2.  **Sensor não conecta/não responde:**
    *   Verifique a `SENSOR_PORT` e `SENSOR_BAUDRATE` no arquivo `.env`.
    *   Verifique as permissões de acesso à porta serial (ex: `sudo chmod 666 /dev/ttyUSB0`).
    *   Certifique-se de que o sensor está corretamente conectado e alimentado.

3.  **Template biométrico inválido:**
    *   Certifique-se de que o template fornecido (em modo `query`) ou recebido do sensor está em formato base64 válido.

---

## 📄 Licença
Este projeto é proprietário. Todos os direitos reservados.

---

**Desenvolvido por**: Douglas Henrique Santos Xavier & Guilherme Moreira da Rocha

