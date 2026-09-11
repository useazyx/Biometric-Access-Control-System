/**
 * python_interface.cpp - Pergunta pro módulo Python se a digital lida tem acesso
 * # Pra que serve?
 * - Chamar o main.py em modo de consulta passando o template lido no sensor
 * - Devolver a resposta ("GRANTED"/"DENIED") pro main decidir se libera a catraca
 * Feito por: Guilherme Silveira Fernandes
 * Versão: 1.1.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-10): Chamada do script Python via popen
 * - v1.1.0 (2026-09-09): O comando era montado grudando o template direto na linha de
 *                        shell. Um template com aspas, ponto e vírgula ou acento grave
 *                        virava comando executado na máquina: era injeção de comando.
 *                        Agora cada argumento passa por quoteShellArg(), e o que não é
 *                        caractere esperado num template é recusado antes de montar nada.
 *                        A unidade e o caminho do Python também saíram do código fixo
 *                        pra variável de ambiente.
 */

#include "python_interface.h"
#include <iostream>
#include <string>
#include <sstream>
#include <cstdio>
#include <cstdlib>
#include <memory>
#include <stdexcept>
#include <array>
#include <algorithm>
#include <cctype>

// No Windows as funções de pipe têm underscore na frente
#ifdef _WIN32
  #define POPEN  _popen
  #define PCLOSE _pclose
#else
  #define POPEN  popen
  #define PCLOSE pclose
#endif

static const char* DEFAULT_PYTHON_BIN = "python";
static const char* DEFAULT_SCRIPT_PATH = "../python/main.py";
static const char* DEFAULT_UNIT_CODE = "ETE001";

// Lê uma variável de ambiente, caindo no padrão quando ela não existe
static std::string envOr(const char* name, const std::string& fallback) {
    const char* value = std::getenv(name);
    if (value == nullptr || value[0] == '\0') {
        return fallback;
    }
    return std::string(value);
}

// Roda um comando e captura a saída dele
std::string exec(const char* cmd) {
    std::array<char, 128> buffer;
    std::string result;

    std::unique_ptr<FILE, decltype(&PCLOSE)> pipe(POPEN(cmd, "r"), PCLOSE);
    if (!pipe) {
        throw std::runtime_error("Não consegui abrir o processo do Python (popen falhou)");
    }

    while (fgets(buffer.data(), buffer.size(), pipe.get()) != nullptr) {
        result += buffer.data();
    }

    return result;
}

/**
 * Diz se o valor só tem caracteres que a gente espera num argumento
 * (letra, número, base64 e alguns separadores).
 *
 * Esta é a primeira barreira: em vez de tentar limpar uma entrada estranha,
 * a gente simplesmente não monta comando nenhum com ela.
 */
static bool isSafeArgument(const std::string& value) {
    if (value.empty()) return false;

    for (unsigned char c : value) {
        const bool allowed =
            std::isalnum(c) ||
            c == '_' || c == '-' || c == '.' ||
            c == '+' || c == '/' || c == '='; // base64 usa + / =

        if (!allowed) return false;
    }

    return true;
}

/**
 * Envolve o argumento em aspas do jeito que o shell da plataforma entende.
 *
 * Serve de segunda barreira, pro caso de um argumento legítimo trazer algum
 * caractere que o shell interpretaria (um espaço no caminho, por exemplo).
 */
static std::string quoteShellArg(const std::string& value) {
#ifdef _WIN32
    // No cmd.exe, aspas duplas e a barra invertida antes delas precisam ser dobradas
    std::string escaped;
    for (char c : value) {
        if (c == '"') escaped += "\\\"";
        else escaped += c;
    }
    return "\"" + escaped + "\"";
#else
    // Em shell POSIX, aspas simples protegem tudo; a única fuga é a própria aspa simples
    std::string escaped;
    for (char c : value) {
        if (c == '\'') escaped += "'\\''";
        else escaped += c;
    }
    return "'" + escaped + "'";
#endif
}

std::string sendBiometricToPython(const std::string& biometricTemplate, const std::string& fingerType) {
    std::cout << "[C++] Consultando a digital no módulo Python..." << std::endl;

    const std::string unitCode = envOr("BIOACCESS_UNIT_CODE", DEFAULT_UNIT_CODE);

    // Recusa antes de montar o comando: template ou dedo com caractere estranho
    // não é erro de digitação, é tentativa de injetar comando
    if (!isSafeArgument(biometricTemplate) || !isSafeArgument(fingerType) || !isSafeArgument(unitCode)) {
        std::cerr << "[C++] Argumento com caractere inesperado. Consulta recusada." << std::endl;
        return "DENIED";
    }

    const std::string pythonBin = envOr("BIOACCESS_PYTHON_BIN", DEFAULT_PYTHON_BIN);
    const std::string scriptPath = envOr("BIOACCESS_PYTHON_SCRIPT", DEFAULT_SCRIPT_PATH);

    // Cada pedaço vai entre aspas, então o shell trata tudo como argumento
    std::ostringstream command;
    command << quoteShellArg(pythonBin) << " "
            << quoteShellArg(scriptPath)
            << " --mode query"
            << " --template " << quoteShellArg(biometricTemplate)
            << " --finger " << quoteShellArg(fingerType)
            << " --unit " << quoteShellArg(unitCode);

    // O comando não é impresso porque carrega o template, que é dado biométrico

    std::string response;
    try {
        response = exec(command.str().c_str());
    } catch (const std::exception& error) {
        std::cerr << "[C++] Falha ao consultar o Python: " << error.what() << std::endl;
        // Na dúvida, nega: é mais seguro barrar alguém do que abrir a catraca por erro
        return "DENIED";
    }

    // Tira espaço e quebra de linha que o Python deixa na saída
    response.erase(std::remove_if(response.begin(), response.end(),
                                  [](unsigned char c) { return std::isspace(c); }),
                   response.end());

    std::cout << "[C++] Resposta do Python: " << response << std::endl;
    return response;
}
