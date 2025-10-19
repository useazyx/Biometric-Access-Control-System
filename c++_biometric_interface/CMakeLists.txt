cmake_minimum_required(VERSION 3.10)
project(BiometricInterface CXX)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED TRUE)

include_directories(include)

add_executable(biometric_interface
    src/main.cpp
    src/sensor_communication.cpp
    src/typescript_interface.cpp
    src/python_interface.cpp
)

find_package(CURL REQUIRED)
target_link_libraries(biometric_interface curl)

