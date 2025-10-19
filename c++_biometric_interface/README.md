<div align="center">

| <img src="../frontend/public/placeholder.svg" width="80" alt="BioAccess C++ Icon" align="center"> | <h1 align="center">C++ Biometric Interface</h1> |
|----------------------------------------------------------------------------|:---------------------------------:|

---

</div>

<div>
<img src="https://img.shields.io/badge/C++-00599C?style=for-the-badge&logo=cplusplus&logoColor=white">
<img src="https://img.shields.io/badge/Arduino-00979D?style=for-the-badge&logo=arduino&logoColor=white">
</div>

---

## 💻 Nome do Projeto
**C++ Biometric Interface**

## 📋 Descrição do Projeto
Este módulo em C++ é a camada de interface de baixo nível do **Biometric Access System**, responsável por intermediar a comunicação entre o sensor biométrico R307 e os sistemas de backend (TypeScript e Python). Ele atua como um tradutor e roteador de dados biométricos, garantindo que as informações do sensor cheguem ao destino correto para cadastro ou verificação.

---

## 🛠️ Tecnologias Utilizadas
- **Linguagem:** C++
- **Hardware:** Sensor Biométrico R307, Arduino (ou microcontrolador similar)
- **Comunicação:** Serial (para o sensor), HTTP Client (para TypeScript), Socket/IPC (para Python)

---

## ⚙️ Instruções de Setup (A ser Implementado/Compilado)

### Requisitos
- **Compilador C++**: g++ (ou similar)
- **Bibliotecas de Comunicação Serial**: Ex: `Boost.Asio` ou `libserialport`
- **Biblioteca HTTP Client**: Ex: `cpprestsdk` (Casablanca) ou `cpr`
- **Biblioteca Socket/IPC**: Ex: `Boost.Asio` ou sockets POSIX
- **Arduino IDE** (se utilizando Arduino como intermediário)

### 1. Navegar para o diretório
```bash
cd biometricaccesssystem-project/biometricaccesssystem-project/c++_biometric_interface
```

### 2. Compilação (Exemplo com CMake)
```bash
mkdir build
cd build
cmake ..
make
```

### 3. Configuração e Execução

Este módulo requer integração com um microcontrolador (como Arduino) para ler o sensor R307 e rotear os dados. A lógica principal deve ser implementada para:

*   **Modo de Cadastro:** O C++ recebe o template do sensor e o envia para o **Backend TypeScript** (endpoint `POST /biometrics`).
*   **Modo de Verificação:** O C++ recebe o template do sensor e o envia para o **Sistema Python** (via socket/IPC). O Python retorna `YES` ou `NO`, e o C++ usa essa resposta para controlar o acesso (ex: liberar catraca via Arduino).

**O código C++ neste diretório ainda precisa ser implementado para realizar estas funções.**

---

## 🔗 Integração com o Ecossistema BioAccess

Este módulo C++ é a ponte entre o hardware (sensor R307) e os softwares de backend (TypeScript e Python).

### Fluxo de Dados da Biometria

#### 1. Cadastro de Biometria
1.  **Sensor R307** captura o template biométrico.
2.  **Arduino/C++** recebe o template do sensor via comunicação serial.
3.  **Arduino/C++** (no modo de cadastro) envia o template (provavelmente codificado em Base64) via HTTP POST para o endpoint `POST /biometrics` do **Backend TypeScript**.
4.  **Backend TypeScript** processa e salva a biometria no banco de dados.

#### 2. Consulta de Biometria (Verificação de Acesso)
1.  **Sensor R307** captura o template biométrico.
2.  **Arduino/C++** recebe o template do sensor via comunicação serial.
3.  **Arduino/C++** (no modo de verificação) envia o template (provavelmente codificado em Base64) via socket/IPC para o **Sistema Python**.
4.  **Sistema Python** consulta o banco de dados com o template recebido e retorna `YES` (acesso concedido) ou `NO` (acesso negado) para o C++.
5.  **Arduino/C++** recebe a resposta do Python e atua no hardware (ex: libera uma catraca ou acende um LED) com base nessa resposta.

---

## 🚨 Troubleshooting

### Problemas Comuns (Após Implementação)

1.  **Sensor não responde:**
    *   Verificar a conexão física do sensor R307 com o Arduino/C++.
    *   Verificar a configuração da porta serial e baud rate no código C++.

2.  **Comunicação C++ com TypeScript/Python falha:**
    *   Verificar se os servidores TypeScript e Python estão em execução.
    *   Verificar URLs/endereços de socket e portas configuradas no código C++.
    *   Verificar firewalls ou configurações de rede que possam bloquear a comunicação.

---

## 📄 Licença
Este projeto é proprietário. Todos os direitos reservados.

---

**Desenvolvido por**: Guilherme Silveira Fernandes

