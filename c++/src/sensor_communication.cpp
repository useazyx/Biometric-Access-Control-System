#include "sensor_communication.h"
#include <iostream>
#include <string>
#include <cstdlib>
#include <vector>
#ifdef _WIN32
#include <windows.h>
#endif

static std::string readLineFromSerial(HANDLE h) {
#ifdef _WIN32
    std::string line;
    char ch;
    DWORD bytesRead;
    for (;;) {
        if (!ReadFile(h, &ch, 1, &bytesRead, NULL) || bytesRead == 0) {
            continue;
        }
        if (ch == '\n') break;
        if (ch != '\r') line.push_back(ch);
    }
    return line;
#else
    return std::string();
#endif
}

static HANDLE openSerialPort() {
#ifdef _WIN32
    std::string com = std::getenv("BIO_SENSOR_COM") ? std::getenv("BIO_SENSOR_COM") : std::string("COM3");
    std::string device = std::string("\\\\.\\") + com;
    HANDLE h = CreateFileA(device.c_str(), GENERIC_READ | GENERIC_WRITE, 0, NULL, OPEN_EXISTING, 0, NULL);
    if (h == INVALID_HANDLE_VALUE) {
        std::cerr << "[C++] Falha ao abrir porta serial " << com << std::endl;
        return INVALID_HANDLE_VALUE;
    }
    DCB dcb = {0};
    dcb.DCBlength = sizeof(DCB);
    GetCommState(h, &dcb);
    dcb.BaudRate = CBR_57600;
    dcb.ByteSize = 8;
    dcb.Parity = NOPARITY;
    dcb.StopBits = ONESTOPBIT;
    SetCommState(h, &dcb);
    COMMTIMEOUTS timeouts = {0};
    timeouts.ReadIntervalTimeout = 50;
    timeouts.ReadTotalTimeoutConstant = 50;
    timeouts.ReadTotalTimeoutMultiplier = 10;
    SetCommTimeouts(h, &timeouts);
    return h;
#else
    return (HANDLE)0;
#endif
}

bool initializeSensor() {
#ifdef _WIN32
    std::cout << "[C++] Inicializando conexão com Arduino (serial)..." << std::endl;
    return true;
#else
    return true;
#endif
}

std::string captureBiometricTemplate(const std::string& mode, const std::string& finger) {
#ifdef _WIN32
    HANDLE h = openSerialPort();
    if (h == INVALID_HANDLE_VALUE) {
        std::cerr << "[C++] Usando template simulado (porta serial indisponível)." << std::endl;
        return "BASE64_TEMPLATE_SIMULADO_PARA_CADASTRO_1234567890";
    }
    if (mode != "AUTO") {
        std::string cmd = mode + ":" + finger + "\n";
        DWORD written;
        WriteFile(h, cmd.c_str(), (DWORD)cmd.size(), &written, NULL);
    }
    std::cout << "[C++] Aguardando template do Arduino..." << std::endl;
    std::string line = readLineFromSerial(h);
    CloseHandle(h);
    auto first = line.find(':');
    auto last = line.rfind(':');
    if (first == std::string::npos || last == std::string::npos || last <= first) {
        std::cerr << "[C++] Formato inválido recebido: " << line << std::endl;
        return std::string();
    }
    std::string b64 = line.substr(first + 1, last - first - 1);
    std::cout << "[C++] Template capturado: " << (b64.size() > 30 ? b64.substr(0, 30) + "..." : b64) << std::endl;
    return b64;
#else
    return "BASE64_TEMPLATE_SIMULADO_PARA_CADASTRO_1234567890";
#endif
}

std::string waitForArduinoLine() {
#ifdef _WIN32
    HANDLE h = openSerialPort();
    if (h == INVALID_HANDLE_VALUE) {
        return std::string();
    }
    std::string line = readLineFromSerial(h);
    CloseHandle(h);
    return line;
#else
    return std::string();
#endif
}

void sendResultToArduino(bool ok) {
#ifdef _WIN32
    HANDLE h = openSerialPort();
    if (h == INVALID_HANDLE_VALUE) return;
    std::string msg = std::string("RESULT:") + (ok ? "OK" : "ERR") + "\n";
    DWORD written;
    WriteFile(h, msg.c_str(), (DWORD)msg.size(), &written, NULL);
    CloseHandle(h);
#endif
}
