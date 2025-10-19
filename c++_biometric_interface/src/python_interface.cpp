#include "python_interface.h"
#include <iostream>
#include <string>
#include <cstdio>
#include <memory>
#include <stdexcept>
#include <array>
#include <algorithm> 
#include <cctype>    

// Função auxiliar para executar comandos shell e capturar a saída
std::string exec(const char* cmd) {
    std::array<char, 128> buffer;
    std::string result;
    std::unique_ptr<FILE, decltype(&pclose)> pipe(popen(cmd, "r"), pclose);
    if (!pipe) {
        throw std::runtime_error("popen() failed!");
    }
    while (fgets(buffer.data(), buffer.size(), pipe.get()) != nullptr) {
        result += buffer.data();
    }
    return result;
}

std::string sendBiometricToPython(const std::string& biometricTemplate, const std::string& fingerType) {

    std::cout << "[C++] Enviando biometria para Python (Consulta)..." << std::endl;

    std::string command = "python3 ../../python_biometric_query/biometric_query.py \"" + biometricTemplate + "\" \"" + fingerType + "\"";

    std::cout << "[C++] Comando simulado para Python: " << command << std::endl;

    std::string pythonResponse = exec(command.c_str());

    pythonResponse.erase(std::remove_if(pythonResponse.begin(), pythonResponse.end(), ::isspace), pythonResponse.end());

    std::cout << "[C++] Resposta simulada do Python: " << pythonResponse << std::endl;

    return pythonResponse;
}

