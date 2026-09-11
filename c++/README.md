<div align="center">

# Interface C++ · Sensor R307

**A ponte entre o hardware biométrico e o resto do sistema**

![C++](https://img.shields.io/badge/C++-00599C?style=flat-square&logo=cplusplus&logoColor=white)
![CMake](https://img.shields.io/badge/CMake-064F8C?style=flat-square&logo=cmake&logoColor=white)
![Arduino](https://img.shields.io/badge/Arduino-00878F?style=flat-square&logo=arduino&logoColor=white)

Desenvolvido por **Guilherme Silveira Fernandes**

</div>

---

## O que é

Este é o módulo que fala com o hardware. Ele conversa com o Arduino pela porta serial, e
o Arduino é quem controla o sensor biométrico **R307**.

Depois de ler a digital, ele segue por um de dois caminhos:

- **Cadastro** — faz `POST /biometrics` na API TypeScript, pra guardar a digital no banco.
- **Consulta** — chama o módulo Python, que compara a digital e diz se libera a passagem.

Em qualquer um dos dois, o resultado volta pro Arduino, que acende o LED e libera (ou não)
a catraca.

> **Plataforma:** o `sensor_communication.cpp` usa a API serial do Windows (`windows.h`),
> então hoje este módulo compila apenas no Windows.

## Compilando

Você precisa de CMake 3.15+, um compilador com C++17 e a **libcurl** instalada.

```bash
cmake -S . -B build
cmake --build build
```

O executável sai em `build/biometric_interface` (ou `build/Debug/biometric_interface.exe`
com MSVC).

## Usando

```bash
# Cadastrar uma digital nova
biometric_interface cadastro <cpf> <tipo_dedo> <codigo_unidade>
biometric_interface cadastro 12345678909 index_right ETE001

# Consultar uma digital (lê no sensor)
biometric_interface consulta <tipo_dedo>
biometric_interface consulta index_right

# Consultar com um template simulado, sem o sensor
biometric_interface consulta index_right SIMULATED_GRANTED_TEMPLATE
biometric_interface consulta index_right SIMULATED_DENIED_TEMPLATE

# Ficar esperando o Arduino mandar a operação
biometric_interface auto <cpf> <tipo_dedo> <codigo_unidade>
```

Rodar sem argumento nenhum imprime a ajuda com todos os modos e variáveis.

## Configuração

Nada de endereço ou token escrito no código: tudo vem do ambiente.

| Variável | Padrão | Pra que serve |
| :--- | :--- | :--- |
| `BIOACCESS_API_URL` | `http://127.0.0.1:2077` | Endereço da API TypeScript |
| `BIOACCESS_API_TOKEN` | *(vazio)* | Token JWT. **Obrigatório pra cadastrar** |
| `BIOACCESS_UNIT_CODE` | `ETE001` | Unidade usada na consulta |
| `BIOACCESS_PYTHON_BIN` | `python` | Executável do Python |
| `BIOACCESS_PYTHON_SCRIPT` | `../python/main.py` | Caminho do script de consulta |

```bash
export BIOACCESS_API_URL=http://127.0.0.1:2077
export BIOACCESS_API_TOKEN=<token obtido no POST /login>
export BIOACCESS_UNIT_CODE=ETE001
```

O token sai do login na API:

```bash
curl -X POST http://127.0.0.1:2077/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@etec001.com.br","password":"<sua senha>"}'
```

**A rota `/biometrics` é privada.** Sem o `BIOACCESS_API_TOKEN` definido, a API responde
`401` e o cadastro não acontece — o programa avisa isso no terminal antes de tentar.

## Como o código é organizado

```
c++/
├── CMakeLists.txt
├── include/
│   ├── sensor_communication.h    Leitura da digital pela serial
│   ├── typescript_interface.h    Envio pra API
│   └── python_interface.h        Consulta no módulo Python
├── src/
│   ├── main.cpp                  Uma função por modo: cadastro, consulta e auto
│   ├── sensor_communication.cpp  Serial do Windows
│   ├── typescript_interface.cpp  HTTP com libcurl
│   └── python_interface.cpp      Chama o script Python
└── arduino/
    └── R307_BioAccess/
        └── R307_BioAccess.ino    O firmware que roda no Arduino
```

### O protocolo com o Arduino

No modo `auto`, o Arduino manda uma linha assim:

```
TAG:template_base64:tipo_do_dedo
```

Onde `TAG` é `ENROLL` (cadastrar) ou `QUERY` (consultar). O C++ interpreta a linha,
executa a operação e devolve o resultado pro Arduino.

## Sobre segurança neste módulo

Duas coisas foram endurecidas aqui e vale saber por quê, pra não voltarem:

**O JSON é escapado.** O corpo da requisição passa por `escapeJson()`. Antes ele era
montado grudando string, então um valor com aspas ou barra invertida quebrava o JSON — ou
mandava um JSON diferente do pretendido.

**O comando do Python é validado e citado.** O `sendBiometricToPython` monta uma linha de
shell. Antes ele interpolava o template direto: um template com `;` ou `` ` `` viraria
comando executado na máquina. Agora todo argumento passa por `isSafeArgument()` (recusa o
que não é letra, número ou base64) e depois por `quoteShellArg()`.

Se precisar mexer nessas duas funções, mantenha as duas barreiras.

O template biométrico também **não é impresso no log**, de propósito: é dado biométrico.

## Problemas comuns

**`Could NOT find CURL`** — a libcurl não está instalada ou o CMake não acha.
No Windows com vcpkg: `vcpkg install curl:x64-windows` e passe o toolchain file pro CMake.
No Debian/Ubuntu (para portar): `sudo apt install libcurl4-openssl-dev`.

**`windows.h: No such file or directory`** — você está compilando fora do Windows. O
módulo serial é específico de Windows hoje.

**A API responde 401** — falta definir o `BIOACCESS_API_TOKEN`, ou o token expirou
(a validade padrão é de 8 horas). Faça login de novo.

**"Argumento com caractere inesperado. Consulta recusada."** — o template ou o tipo do
dedo tem caractere fora do esperado. É a validação fazendo o trabalho dela; confira o que
está sendo passado.

**Falha ao inicializar o sensor** — confira o cabo, se o Arduino está na porta esperada e
se nenhum outro programa (a IDE do Arduino, por exemplo) está com a porta serial aberta.
