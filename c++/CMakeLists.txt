# ==========================================================
# CMakeLists.txt - Como compilar a interface C++ com o sensor
# Pra que serve?
# - Montar o executável biometric_interface
# - Achar e ligar a libcurl, usada pra falar com a API
# Feito por: Guilherme Silveira Fernandes
# Versão: 1.1.0
# Data: 2026-09-09
# Alterações:
# - v1.0.0 (2025-10): Build inicial com include_directories global
# - v1.1.0 (2026-09-09): C++17 no lugar do 11, include só no alvo (em vez de global),
#                        e a libcurl passou a ser ligada pelo alvo importado
#                        CURL::libcurl, que já traz os headers e as dependências dela.
#
# Como compilar:
#   cmake -S . -B build
#   cmake --build build
#
# Atenção: o sensor_communication.cpp usa a API serial do Windows (windows.h),
# então este módulo só compila no Windows como está hoje.
# ==========================================================

cmake_minimum_required(VERSION 3.15)

project(BiometricInterface
    VERSION 1.1.0
    DESCRIPTION "Interface C++ entre o sensor biometrico R307 e o sistema BioAccess"
    LANGUAGES CXX
)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
# Sem extensão de compilador: mantém o código portátil
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(biometric_interface
    src/main.cpp
    src/sensor_communication.cpp
    src/typescript_interface.cpp
    src/python_interface.cpp
)

# O include vale só pra este alvo, e não pro projeto inteiro
target_include_directories(biometric_interface PRIVATE include)

find_package(CURL REQUIRED)
# O alvo importado já traz os headers e as bibliotecas que a libcurl precisa
target_link_libraries(biometric_interface PRIVATE CURL::libcurl)

# Avisos ligados: erro de C++ que passa calado costuma virar bug de execução
if(MSVC)
    target_compile_options(biometric_interface PRIVATE /W4)
else()
    target_compile_options(biometric_interface PRIVATE -Wall -Wextra -Wpedantic)
endif()
