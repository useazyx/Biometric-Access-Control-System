#include "sensor_communication.h"
#include <iostream>
#include <chrono>
#include <thread>

bool initializeSensor() {
    std::cout << "[C++] Inicializando sensor biométrico..." << std::endl;
    std::this_thread::sleep_for(std::chrono::seconds(1));
    std::cout << "[C++] Sensor biométrico inicializado com sucesso." << std::endl;
    return true;
}

std::string captureBiometricTemplate() {
    std::cout << "[C++] Capturando template biométrico..." << std::endl;
    std::this_thread::sleep_for(std::chrono::seconds(2));
    std::string simulatedTemplate = "BASE64_TEMPLATE_SIMULADO_PARA_CADASTRO_1234567890";
    std::cout << "[C++] Template capturado: " << simulatedTemplate.substr(0, 30) << "..." << std::endl;
    return simulatedTemplate;
}

