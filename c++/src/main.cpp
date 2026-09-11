/**
 * main.cpp - Ponto de entrada da interface C++ com o sensor R307
 * # Pra que serve?
 * - Ler a linha de comando e decidir o modo: cadastro, consulta ou auto
 * - Capturar a digital no sensor e mandar pra API (cadastro) ou pro Python (consulta)
 * - Devolver pro Arduino se libera ou não a passagem
 * Feito por: Guilherme Silveira Fernandes
 * Versão: 1.1.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-10): Implementação inicial dos três modos
 * - v1.1.0 (2026-09-09): A libcurl passou a ser inicializada uma vez por processo, aqui,
 *                        e não a cada requisição dentro do typescript_interface (que é o
 *                        que a documentação da própria libcurl pede). A finalização usa
 *                        um guarda RAII, então acontece em qualquer caminho de saída sem
 *                        precisar repetir cleanup antes de cada return.
 *                        Cada modo também virou uma função, porque o main tinha 130 linhas
 *                        de if encadeado e ficava difícil enxergar os três fluxos.
 */

#include "sensor_communication.h"
#include "typescript_interface.h"
#include "python_interface.h"
#include <iostream>
#include <string>
#include <curl/curl.h>

// Resposta do Python que significa "pode entrar"
static const char* GRANTED_RESPONSE = "YES";

/**
 * Guarda a inicialização da libcurl.
 *
 * O destrutor roda sozinho quando o objeto sai de escopo, então o
 * curl_global_cleanup() acontece em qualquer saída do programa: return normal,
 * return de erro ou exceção. Sem isso, cada novo return no main viraria mais um
 * lugar pra esquecer de finalizar a biblioteca.
 */
struct CurlGlobalGuard {
    CurlGlobalGuard() { curl_global_init(CURL_GLOBAL_ALL); }
    ~CurlGlobalGuard() { curl_global_cleanup(); }
};

void printUsage() {
    std::cout << "Uso: biometric_interface <modo> [parametros]" << std::endl;
    std::cout << "Modos disponíveis:" << std::endl;
    std::cout << "  cadastro <cpf> <tipo_dedo> <codigo_unidade>" << std::endl;
    std::cout << "  consulta <tipo_dedo> [template_simulado]" << std::endl;
    std::cout << "  auto <cpf> <tipo_dedo> <codigo_unidade>" << std::endl;
    std::cout << std::endl;
    std::cout << "Exemplos:" << std::endl;
    std::cout << "  biometric_interface cadastro 12345678909 index_right ETE001" << std::endl;
    std::cout << "  biometric_interface consulta index_right" << std::endl;
    std::cout << "  biometric_interface consulta index_right SIMULATED_GRANTED_TEMPLATE" << std::endl;
    std::cout << std::endl;
    std::cout << "Variáveis de ambiente:" << std::endl;
    std::cout << "  BIOACCESS_API_URL        endereço da API (padrão: http://127.0.0.1:2077)" << std::endl;
    std::cout << "  BIOACCESS_API_TOKEN      token JWT, obrigatório pra cadastrar" << std::endl;
    std::cout << "  BIOACCESS_UNIT_CODE      unidade usada na consulta (padrão: ETE001)" << std::endl;
    std::cout << "  BIOACCESS_PYTHON_BIN     executável do Python (padrão: python)" << std::endl;
    std::cout << "  BIOACCESS_PYTHON_SCRIPT  caminho do main.py (padrão: ../python/main.py)" << std::endl;
}

/**
 * Modo cadastro: captura a digital e manda pra API guardar no banco.
 * Retorna o código de saída do programa (0 = deu certo).
 */
static int runEnroll(int argc, char* argv[]) {
    if (argc != 5) {
        std::cerr << "[C++] Erro: modo cadastro requer CPF, tipo de dedo e código da unidade." << std::endl;
        printUsage();
        return 1;
    }

    const std::string cpf = argv[2];
    const std::string fingerType = argv[3];
    const std::string unitCode = argv[4];

    std::cout << "[C++] Modo: cadastro" << std::endl;

    const std::string biometricTemplate = captureBiometricTemplate("ENROLL", fingerType);
    if (biometricTemplate.empty()) {
        std::cerr << "[C++] Não consegui capturar a digital. Encerrando." << std::endl;
        return 1;
    }

    const bool ok = sendBiometricToTypeScript(biometricTemplate, cpf, fingerType, unitCode);

    // O Arduino precisa saber o resultado nos dois casos, pra acender o LED certo
    sendResultToArduino(ok);

    if (!ok) {
        std::cerr << "[C++] Falha no cadastro da biometria." << std::endl;
        return 1;
    }

    std::cout << "[C++] Cadastro concluído com sucesso!" << std::endl;
    return 0;
}

/**
 * Modo consulta: captura a digital e pergunta pro Python se ela tem acesso.
 * Aceita um template simulado no lugar da leitura, pra testar sem o sensor.
 */
static int runQuery(int argc, char* argv[]) {
    if (argc < 3 || argc > 4) {
        std::cerr << "[C++] Erro: modo consulta requer o tipo de dedo (e opcionalmente um template simulado)." << std::endl;
        printUsage();
        return 1;
    }

    const std::string fingerType = argv[2];
    std::string biometricTemplate;

    if (argc == 4) {
        // Template passado na mão: é assim que a gente testa sem o sensor plugado
        biometricTemplate = argv[3];
        std::cout << "[C++] Usando template simulado para a consulta." << std::endl;
    } else {
        biometricTemplate = captureBiometricTemplate("QUERY", fingerType);
        if (biometricTemplate.empty()) {
            std::cerr << "[C++] Não consegui capturar a digital. Encerrando." << std::endl;
            return 1;
        }
    }

    std::cout << "[C++] Modo: consulta" << std::endl;

    const std::string pythonResponse = sendBiometricToPython(biometricTemplate, fingerType);

    if (pythonResponse.empty()) {
        std::cerr << "[C++] O módulo Python não respondeu." << std::endl;
        // Sem resposta, nega: é mais seguro barrar do que abrir por erro
        sendResultToArduino(false);
        return 1;
    }

    const bool granted = (pythonResponse == GRANTED_RESPONSE);
    sendResultToArduino(granted);

    std::cout << "[C++] Acesso " << (granted ? "liberado" : "negado") << "." << std::endl;
    return 0;
}

/**
 * Modo auto: fica esperando o Arduino mandar uma linha "TAG:template:dedo"
 * e trata como cadastro ou consulta, conforme a tag.
 */
static int runAuto(int argc, char* argv[]) {
    std::cout << "[C++] Aguardando linha do Arduino (ENROLL/QUERY)..." << std::endl;

    const std::string line = waitForArduinoLine();
    if (line.empty()) {
        std::cerr << "[C++] Não consegui ler a linha do Arduino." << std::endl;
        return 1;
    }

    // A linha vem no formato TAG:template_base64:tipo_do_dedo
    const auto first = line.find(':');
    const auto last = line.rfind(':');

    if (first == std::string::npos || last == std::string::npos || last <= first) {
        std::cerr << "[C++] Linha em formato inesperado. Esperado TAG:template:dedo." << std::endl;
        return 1;
    }

    const std::string tag = line.substr(0, first);
    const std::string biometricTemplate = line.substr(first + 1, last - first - 1);
    const std::string fingerType = line.substr(last + 1);

    if (tag == "ENROLL") {
        if (argc < 5) {
            std::cerr << "[C++] Modo auto com ENROLL precisa de: cpf tipo_dedo codigo_unidade" << std::endl;
            printUsage();
            return 1;
        }

        const std::string cpf = argv[2];
        const std::string unitCode = argv[4];

        const bool ok = sendBiometricToTypeScript(biometricTemplate, cpf, fingerType, unitCode);
        sendResultToArduino(ok);
        std::cout << (ok ? "[C++] ENROLL OK" : "[C++] ENROLL FAIL") << std::endl;
        return ok ? 0 : 1;
    }

    if (tag == "QUERY") {
        const std::string response = sendBiometricToPython(biometricTemplate, fingerType);
        const bool granted = (response == GRANTED_RESPONSE);
        sendResultToArduino(granted);
        std::cout << "[C++] QUERY " << (granted ? "YES" : "NO") << std::endl;
        return 0;
    }

    std::cerr << "[C++] Tag desconhecida: " << tag << std::endl;
    return 1;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        printUsage();
        return 1;
    }

    // Inicializa a libcurl agora e finaliza sozinho na saída, qualquer que ela seja
    CurlGlobalGuard curlGuard;

    const std::string mode = argv[1];

    if (!initializeSensor()) {
        std::cerr << "[C++] Falha ao inicializar o sensor. Encerrando." << std::endl;
        return 1;
    }

    if (mode == "cadastro") return runEnroll(argc, argv);
    if (mode == "consulta") return runQuery(argc, argv);
    if (mode == "auto") return runAuto(argc, argv);

    std::cerr << "[C++] Modo inválido: " << mode << std::endl;
    printUsage();
    return 1;
}
