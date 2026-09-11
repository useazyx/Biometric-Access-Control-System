#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>

// Pin definitions
#define FINGERPRINT_RX 2
#define FINGERPRINT_TX 3
#define ENROLL_BUTTON 4
#define VERIFY_BUTTON 5
#define GREEN_LED 12
#define RED_LED 13

// Button debounce
unsigned long lastDebounceTime = 0;
unsigned long debounceDelay = 50;

SoftwareSerial mySerial(FINGERPRINT_RX, FINGERPRINT_TX);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

void setup() {
  Serial.begin(9600);
  while (!Serial); // Aguarda a conexão serial no Leonardo/Pro Micro
  
  // Inicializa os pinos
  pinMode(ENROLL_BUTTON, INPUT_PULLUP);
  pinMode(VERIFY_BUTTON, INPUT_PULLUP);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  
  // Inicializa o sensor
  finger.begin(57600);
  
  // Verifica se o sensor está conectado
  if (finger.verifyPassword()) {
    Serial.println("R307 Ready");
    // Pisca o LED verde para indicar inicialização
    digitalWrite(GREEN_LED, HIGH);
    delay(500);
    digitalWrite(GREEN_LED, LOW);
    delay(500);
    digitalWrite(GREEN_LED, HIGH);
    delay(500);
    digitalWrite(GREEN_LED, LOW);
  } else {
    Serial.println("Sensor não encontrado!");
    // Pisca o LED vermelho em caso de erro
    while (1) {
      digitalWrite(RED_LED, HIGH);
      delay(200);
      digitalWrite(RED_LED, LOW);
      delay(200);
    }
  }
}

void loop() {
  // Verifica se o botão de cadastro foi pressionado
  if (digitalRead(ENROLL_BUTTON) == LOW) {
    if (debounceButton(ENROLL_BUTTON)) {
      enrollFingerprint();
    }
  }
  
  // Verifica se o botão de verificação foi pressionado
  if (digitalRead(VERIFY_BUTTON) == LOW) {
    if (debounceButton(VERIFY_BUTTON)) {
      verifyFingerprint();
    }
  }
  
  // Verifica se há dados na porta serial
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command == "ENROLL") {
      enrollFingerprint();
    } else if (command == "VERIFY") {
      verifyFingerprint();
    }
  }
}

// Função para evitar ruído nos botões
bool debounceButton(int button) {
  if ((millis() - lastDebounceTime) > debounceDelay) {
    lastDebounceTime = millis();
    return true;
  }
  return false;
}

void enrollFingerprint() {
  Serial.println("MODE:ENROLL");
  digitalWrite(GREEN_LED, HIGH);
  delay(100);
  digitalWrite(GREEN_LED, LOW);
  
  // Primeira captura
  Serial.println("Coloque o dedo no sensor...");
  int p = -1;
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    switch (p) {
      case FINGERPRINT_OK:
        Serial.println("Imagem capturada");
        break;
      case FINGERPRINT_NOFINGER:
        Serial.print(".");
        break;
      default:
        Serial.println("Erro na captura");
        errorFeedback();
        return;
    }
    delay(50);
  }
  
  // Converte a imagem
  p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) {
    Serial.println("Erro no processamento da imagem");
    errorFeedback();
    return;
  }
  
  Serial.println("Remova o dedo do sensor");
  digitalWrite(GREEN_LED, HIGH);
  delay(2000);
  
  // Segunda captura
  Serial.println("Coloque o mesmo dedo novamente...");
  p = -1;
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    if (p == FINGERPRINT_NOFINGER) {
      continue;
    }
    if (p != FINGERPRINT_OK) {
      Serial.println("Erro na segunda captura");
      errorFeedback();
      return;
    }
    Serial.println("Imagem capturada");
  }
  
  // Converte a segunda imagem
  p = finger.image2Tz(2);
  if (p != FINGERPRINT_OK) {
    Serial.println("Erro no processamento da segunda imagem");
    errorFeedback();
    return;
  }
  
  // Cria o modelo
  p = finger.createModel();
  if (p != FINGERPRINT_OK) {
    Serial.println("As digitais não conferem");
    errorFeedback();
    return;
  }
  
  // Armazena o modelo
  p = finger.storeModel(1);
  if (p != FINGERPRINT_OK) {
    Serial.println("Erro ao armazenar a digital");
    errorFeedback();
    return;
  }
  
  Serial.println("Digital cadastrada com sucesso!");
  successFeedback();
}

void verifyFingerprint() {
  Serial.println("MODE:VERIFY");
  digitalWrite(RED_LED, HIGH);
  delay(100);
  digitalWrite(RED_LED, LOW);
  
  // Captura a digital
  Serial.println("Coloque o dedo no sensor...");
  int p = -1;
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    if (p == FINGERPRINT_NOFINGER) {
      continue;
    }
    if (p != FINGERPRINT_OK) {
      Serial.println("Erro na captura");
      errorFeedback();
      return;
    }
    Serial.println("Imagem capturada");
  }
  
  // Converte a imagem
  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) {
    Serial.println("Erro no processamento da imagem");
    errorFeedback();
    return;
  }
  
  // Procura por correspondência
  p = finger.fingerSearch();
  if (p == FINGERPRINT_OK) {
    Serial.println("Digital reconhecida!");
    Serial.print("ID: "); Serial.println(finger.fingerID);
    Serial.print("Confiança: "); Serial.println(finger.confidence);
    successFeedback();
  } else {
    Serial.println("Digital não reconhecida");
    errorFeedback();
  }
}

void successFeedback() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(GREEN_LED, HIGH);
    delay(200);
    digitalWrite(GREEN_LED, LOW);
    delay(200);
  }
}

void errorFeedback() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(RED_LED, HIGH);
    delay(200);
    digitalWrite(RED_LED, LOW);
    delay(200);
  }
}