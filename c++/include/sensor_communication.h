#ifndef SENSOR_COMMUNICATION_H
#define SENSOR_COMMUNICATION_H

#include <string>

bool initializeSensor();

std::string captureBiometricTemplate(const std::string& mode, const std::string& finger);
std::string waitForArduinoLine();
void sendResultToArduino(bool ok);

#endif 
