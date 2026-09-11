/**
 * typescript_interface.cpp - Manda a digital lida pelo sensor pra API TypeScript
 * # Pra que serve?
 * - Fazer o POST /biometrics na API, pra cadastrar a digital no banco
 * - Ler o endereço da API e o token do ambiente, em vez de deixar fixo no código
 * Feito por: Guilherme Silveira Fernandes
 * Versão: 1.1.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-10): Envio da biometria via libcurl
 * - v1.1.0 (2026-09-09): O JSON era montado grudando string, sem escapar nada: um dado
 *                        com aspas ou barra invertida quebrava o corpo da requisição.
 *                        Agora passa por escapeJson(). A URL saiu de "localhost:2077"
 *                        fixo pra variável de ambiente, e o cabeçalho Authorization
 *                        entrou (a rota /biometrics exige token e sempre devolvia 401).
 *                        O curl_global_init/cleanup também saiu daqui: agora é uma vez
 *                        só, no main, como a libcurl manda.
 */

#include "typescript_interface.h"
#include <iostream>
#include <string>
#include <sstream>
#include <cstdlib>
#include <cstdio>   // std::snprintf, usado no escape de caractere de controle
#include <curl/curl.h>

// Valores usados quando a variável de ambiente não está definida
static const char* DEFAULT_API_URL = "http://127.0.0.1:2077";

// Junta os pedaços da resposta HTTP numa string
size_t WriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    ((std::string*)userp)->append((char*)contents, size * nmemb);
    return size * nmemb;
}

// Lê uma variável de ambiente, caindo no padrão quando ela não existe
static std::string envOr(const char* name, const std::string& fallback) {
    const char* value = std::getenv(name);
    if (value == nullptr || value[0] == '\0') {
        return fallback;
    }
    return std::string(value);
}

/**
 * Escapa uma string pra ela poder entrar num campo de texto JSON.
 *
 * Sem isso, um valor com aspas fecha a string no meio e o corpo inteiro vira
 * JSON inválido (ou, pior, um JSON diferente do que a gente quis mandar).
 */
static std::string escapeJson(const std::string& input) {
    std::ostringstream out;

    for (unsigned char c : input) {
        switch (c) {
            case '"':  out << "\\\""; break;
            case '\\': out << "\\\\"; break;
            case '\b': out << "\\b";  break;
            case '\f': out << "\\f";  break;
            case '\n': out << "\\n";  break;
            case '\r': out << "\\r";  break;
            case '\t': out << "\\t";  break;
            default:
                // Caractere de controle não pode ir cru dentro de JSON
                if (c < 0x20) {
                    char buffer[7];
                    std::snprintf(buffer, sizeof(buffer), "\\u%04x", c);
                    out << buffer;
                } else {
                    out << c;
                }
        }
    }

    return out.str();
}

bool sendBiometricToTypeScript(const std::string& biometricTemplate,
                               const std::string& cpf,
                               const std::string& finger,
                               const std::string& unitCode) {
    CURL* curl = curl_easy_init();
    if (curl == nullptr) {
        std::cerr << "[C++] Não consegui inicializar o curl." << std::endl;
        return false;
    }

    // Endereço da API e token vêm do ambiente, pra funcionar em qualquer máquina
    const std::string url = envOr("BIOACCESS_API_URL", DEFAULT_API_URL) + "/biometrics";
    const std::string token = envOr("BIOACCESS_API_TOKEN", "");

    // Todo campo passa pelo escape antes de entrar no JSON
    std::ostringstream payload;
    payload << "{"
            << "\"cpf\":\"" << escapeJson(cpf) << "\","
            << "\"template\":\"" << escapeJson(biometricTemplate) << "\","
            << "\"finger\":\"" << escapeJson(finger) << "\","
            << "\"unit_code\":\"" << escapeJson(unitCode) << "\""
            << "}";
    const std::string jsonPayload = payload.str();

    struct curl_slist* headers = nullptr;
    headers = curl_slist_append(headers, "Content-Type: application/json");

    // A rota /biometrics é privada: sem este cabeçalho a API responde 401
    if (!token.empty()) {
        const std::string authHeader = "Authorization: Bearer " + token;
        headers = curl_slist_append(headers, authHeader.c_str());
    } else {
        std::cerr << "[C++] Aviso: BIOACCESS_API_TOKEN não definido. "
                  << "A API vai recusar o cadastro com 401." << std::endl;
    }

    std::string readBuffer;
    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonPayload.c_str());
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);
    // Sem timeout, uma API fora do ar deixa o programa parado pra sempre
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 15L);

    std::cout << "[C++] Enviando biometria para a API (cadastro)..." << std::endl;
    std::cout << "[C++] URL: " << url << std::endl;
    // O template não é impresso de propósito: é dado biométrico, não vai pro log

    const CURLcode res = curl_easy_perform(curl);

    bool success = false;

    if (res != CURLE_OK) {
        std::cerr << "[C++] Falha na requisição: " << curl_easy_strerror(res) << std::endl;
    } else {
        long httpCode = 0;
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &httpCode);
        std::cout << "[C++] Status HTTP: " << httpCode << std::endl;

        if (httpCode >= 200 && httpCode < 300) {
            std::cout << "[C++] Biometria cadastrada com sucesso." << std::endl;
            success = true;
        } else {
            std::cerr << "[C++] A API recusou o cadastro. Resposta: " << readBuffer << std::endl;
        }
    }

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    return success;
}
