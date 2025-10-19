#include "sensor_communication.h"
#include "typescript_interface.h"
#include "python_interface.h"
#include <iostream>
#include <string>

void printUsage() {
    std::cout << "Uso: biometric_interface <modo> [parametros]" << std::endl;
    std::cout << "Modos disponíveis:" << std::endl;
    std::cout << "  cadastro <cpf> <tipo_dedo> <codigo_unidade>" << std::endl;
    std::cout << "  consulta <tipo_dedo>" << std::endl;
    std::cout << "Exemplo cadastro: biometric_interface cadastro 123.456.789-00 index_right ETEC01" << std::endl;
    std::cout << "Exemplo consulta: biometric_interface consulta index_right" << std::endl;
    std::cout << "Exemplo consulta simulada (concedido): biometric_interface consulta index_right SIMULATED_GRANTED_TEMPLATE" << std::endl;
    std::cout << "Exemplo consulta simulada (negado): biometric_interface consulta index_right SIMULATED_DENIED_TEMPLATE" << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        printUsage();
        return 1;
    }

    std::string mode = argv[1];
    std::string biometricTemplate;
    std::string fingerType;

    if (!initializeSensor()) {
        std::cerr << "[C++] Falha ao inicializar o sensor. Encerrando." << std::endl;
        return 1;
    }

    if (mode == "cadastro") {
        if (argc != 5) {
            std::cerr << "[C++] Erro: Modo cadastro requer CPF, tipo de dedo e código da unidade." << std::endl;
            printUsage();
            return 1;
        }
        std::string cpf = argv[2];
        fingerType = argv[3];
        std::string unitCode = argv[4];

        biometricTemplate = captureBiometricTemplate();
        if (biometricTemplate.empty()) {
            std::cerr << "[C++] Falha ao capturar o template biométrico para cadastro. Encerrando." << std::endl;
            return 1;
        }

        std::cout << "[C++] Modo: Cadastro" << std::endl;
        if (sendBiometricToTypeScript(biometricTemplate, cpf, fingerType, unitCode)) {
            std::cout << "[C++] Cadastro de biometria concluído com sucesso!" << std::endl;
        } else {
            std::cerr << "[C++] Falha no cadastro de biometria." << std::endl;
            return 1;
        }
    } else if (mode == "consulta") {
        if (argc < 3 || argc > 4) { 
            std::cerr << "[C++] Erro: Modo consulta requer tipo de dedo e opcionalmente um template simulado." << std::endl;
            printUsage();
            return 1;
        }
        fingerType = argv[2];

        if (argc == 4) {

            biometricTemplate = argv[3];
            std::cout << "[C++] Usando template simulado para consulta: " << biometricTemplate << std::endl;
        } else {

            biometricTemplate = captureBiometricTemplate();
            if (biometricTemplate.empty()) {
                std::cerr << "[C++] Falha ao capturar o template biométrico para consulta. Encerrando." << std::endl;
                return 1;
            }
        }

        std::cout << "[C++] Modo: Consulta" << std::endl;
        std::string pythonResponse = sendBiometricToPython(biometricTemplate, fingerType);
        if (!pythonResponse.empty()) {
            std::cout << "[C++] Resposta da consulta Python: " << pythonResponse << std::endl;
            std::cout << "[C++] Consulta de biometria concluída." << std::endl;
        } else {
            std::cerr << "[C++] Falha na consulta de biometria." << std::endl;
            return 1;
        }
    } else {
        std::cerr << "[C++] Modo inválido: " << mode << std::endl;
        printUsage();
        return 1;
    }

    return 0;
}

