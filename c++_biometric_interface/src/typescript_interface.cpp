#include "typescript_interface.h"
#include <iostream>
#include <string>
#include <curl/curl.h>

size_t WriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    ((std::string*)userp)->append((char*)contents, size * nmemb);
    return size * nmemb;
}

bool sendBiometricToTypeScript(const std::string& biometricTemplate, const std::string& cpf, const std::string& finger, const std::string& unitCode) {
    CURL *curl;
    CURLcode res;
    std::string readBuffer;

    curl_global_init(CURL_GLOBAL_ALL);
    curl = curl_easy_init();
    if(curl) {
        std::string url = "http://localhost:2077/biometrics";
        std::string jsonPayload = "{\"cpf\": \"" + cpf + "\", \"template\": \"" + biometricTemplate + "\", \"finger\": \"" + finger + "\", \"unit_code\": \"" + unitCode + "\"}";

        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");

        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonPayload.c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);

        std::cout << "[C++] Enviando biometria para TypeScript (Cadastro)..." << std::endl;
        std::cout << "[C++] URL: " << url << std::endl;
        std::cout << "[C++] Payload: " << jsonPayload << std::endl;

        res = curl_easy_perform(curl);
        if(res != CURLE_OK) {
            std::cerr << "[C++] curl_easy_perform() falhou: " << curl_easy_strerror(res) << std::endl;
            curl_slist_free_all(headers);
            curl_easy_cleanup(curl);
            curl_global_cleanup();
            return false;
        } else {
            long http_code = 0;
            curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);
            std::cout << "[C++] Resposta do TypeScript (HTTP Status): " << http_code << std::endl;
            std::cout << "[C++] Corpo da resposta: " << readBuffer << std::endl;
            if (http_code >= 200 && http_code < 300) {
                std::cout << "[C++] Biometria enviada com sucesso para o TypeScript." << std::endl;
                curl_slist_free_all(headers);
                curl_easy_cleanup(curl);
                curl_global_cleanup();
                return true;
            } else {
                std::cerr << "[C++] Erro ao enviar biometria para o TypeScript. Status HTTP: " << http_code << std::endl;
                curl_slist_free_all(headers);
                curl_easy_cleanup(curl);
                curl_global_cleanup();
                return false;
            }
        }
    }
    curl_global_cleanup();
    return false;
}

