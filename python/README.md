<div align="center">

# Módulo Python · Consulta biométrica

**Lê a digital no sensor R307, confere no banco e registra o acesso**

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)

Desenvolvido por **Douglas Henrique Santos Xavier** e **Guilherme Moreira da Rocha**

</div>

---

## O que é

Este módulo fica junto da catraca. Ele é a parte do sistema que responde a pergunta
prática: *essa digital pode entrar aqui?*

O fluxo é:

1. A digital é lida no sensor **R307** pela porta serial (ou chega pronta, do módulo C++).
2. O template é comparado com as digitais cadastradas naquela unidade, no PostgreSQL.
3. O acesso é registrado em `BiometricLog`, autorizado ou não.
4. A resposta volta pra quem perguntou, e o Arduino libera ou barra a passagem.

É o **mesmo banco** que o backend TypeScript usa. Este módulo não tem banco próprio.

## Rodando

```bash
pip install -r requirements.txt

cp .env.example .env
# Use o MESMO DATABASE_URL do backend
```

### Testando sem o sensor

```bash
python main.py --mode simulation --unit ETE001
```

Simula leituras sem precisar de porta serial nenhuma. É a forma de ver o sistema
funcionando sem o hardware.

### Com o sensor conectado

```bash
python main.py --mode listener --unit ETE001
```

Fica escutando a porta serial e processando cada digital que chega.

## Os modos

| Modo | O que faz |
| :--- | :--- |
| `listener` | Escuta o sensor na porta serial e processa cada leitura (uso real) |
| `simulation` | Simula leituras, sem sensor nenhum (desenvolvimento e teste) |
| `query` | Consulta uma digital só e sai. É o modo que o módulo C++ chama |
| `api` | Sobe uma API HTTP local (FastAPI) pra consulta por requisição |
| `test-db` | Só testa a conexão com o banco e sai |
| `info` | Mostra a configuração carregada |

### Argumentos

| Argumento | Pra que serve |
| :--- | :--- |
| `--mode` | Obrigatório. Um dos modos da tabela acima |
| `--unit` | Código da unidade (ex: `ETE001`) |
| `--port` | Porta serial, sobrepondo o que está no `.env` |
| `--template` | Template em base64 — usado no modo `query` |
| `--finger` | Qual dedo (ex: `index_right`) — usado no modo `query` |
| `--verbose` / `-v` | Liga o log detalhado |

Exemplos:

```bash
# Consulta pontual (é como o módulo C++ chama)
python main.py --mode query --template <base64> --finger index_right --unit ETE001

# Só conferir se o banco responde
python main.py --mode test-db

# Ver a configuração que foi carregada
python main.py --mode info
```

## Como o código é organizado

```
python/
├── main.py                Entrada: lê a linha de comando e escolhe o modo
├── config.py              Carrega e valida as variáveis de ambiente
├── database.py            Conexão e gerenciamento do PostgreSQL
├── models.py              Estruturas que espelham as tabelas do banco
├── crud.py                As consultas SQL (ler e escrever)
├── biometric_service.py   A regra: compara a digital e decide o acesso
├── sensor_interface.py    Comunicação serial com o R307 (e o simulador)
├── biometric_query.py     Utilitário de consulta pontual
├── api.py                 API HTTP local em FastAPI (modo `api`)
├── test_system.py         Testes com banco
└── test_offline.py        Testes sem banco
```

## Variáveis de ambiente

Documentadas em [`.env.example`](./.env.example).

| Variável | Pra que serve |
| :--- | :--- |
| `DATABASE_URL` | Conexão com o PostgreSQL — **a mesma do backend** |
| `SENSOR_DEVICE` | Modelo do sensor (`R307`) |
| `SENSOR_PORT` | Porta serial: `/dev/ttyUSB0` no Linux, `COM3` no Windows |
| `SENSOR_BAUDRATE` | Velocidade da serial (`57600` no R307) |
| `LOG_LEVEL` | `DEBUG`, `INFO`, `WARNING` ou `ERROR` |
| `LOG_FILE` | Arquivo de log (fica fora do Git) |
| `DEFAULT_UNIT_CODE` | Unidade usada quando `--unit` não é passado |

## Testes

```bash
python test_offline.py   # não precisa de banco
python test_system.py    # precisa do banco configurado
```

## Problemas comuns

**`DATABASE_URL environment variable is required`** — falta copiar o `.env.example` pra
`.env` e preencher.

**Não acha a porta serial** — no Linux confira o nome (`ls /dev/ttyUSB*`) e se o seu
usuário está no grupo `dialout`:
`sudo usermod -a -G dialout $USER` (precisa entrar de novo na sessão). No Windows, veja o
número da porta `COM` no Gerenciador de Dispositivos.

**Toda consulta volta negada** — confira se a unidade passada em `--unit` é a mesma onde a
digital foi cadastrada. As digitais são vinculadas à unidade de registro.

**Não tenho o sensor** — use `--mode simulation`. É exatamente pra isso que ele existe.
