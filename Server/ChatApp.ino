#include <ESP8266WiFi.h>
#include "./DNSServer.h"
#include <ESP8266WebServer.h>
#include "FS.h"
#include <ArduinoJson.h>
#include <WebSocketsServer.h>

#include <Servo.h>

#define SERVO_PIN D1   
#define LDR_PIN A0 
#define LED_PIN 2 

Servo servo;
int lastLightValue = 0;
int lightValue = 0;

// Configuration
const byte DNS_PORT = 53;
const String messagesFile = "/messages.txt";
const char* wifiName = "ChatWithMe";
const int webSocketPort = 81;

// Network
IPAddress apIP(10, 10, 10, 1);
DNSServer dnsServer;
ESP8266WebServer webServer(80);
WebSocketsServer webSocket = WebSocketsServer(webSocketPort);

// In-memory representation of messages
String messages;

// Previous modification timestamp of the messages file
unsigned long prevFileModifiedTime = 0;

unsigned long previousMillis = 0;
const long interval = 1000; // Blink interval in milliseconds
bool ledState = false; 

void setup() {
  Serial.begin(115200);
  SPIFFS.begin();
  
  if (SERVO_PIN != -1 && LDR_PIN != -1) {
    servo.attach(SERVO_PIN);
  }

  // WiFi setup
  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));
  WiFi.softAP(wifiName);

  // Start DNS server
  dnsServer.start(DNS_PORT, "*", apIP);

  // HTTP server routes
  webServer.on("/", HTTP_GET, []() {
    webServer.send(200, "text/html", "Welcome to the ESP8266 WebSocket Server");
  });
  webServer.on("/setAngle", HTTP_GET, handleSetAngle);
  webServer.on("/send", HTTP_POST, handleSendMessage);
  webServer.on("/messages", HTTP_GET, showMessages);
  webServer.on("/clear", HTTP_POST, handleClearMessages);

  // WebSocket event handler
  webSocket.begin();
  webSocket.onEvent(handleWebSocketEvent);

  // Not found handler
  webServer.onNotFound(handleNotFound);

  // Enable CORS
  webServer.enableCORS(true);

  // Start HTTP server
  webServer.begin();

  // Initialize LED pin
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  dnsServer.processNextRequest();
  webSocket.loop(); // Handle WebSocket events
  webServer.handleClient();

  // Check for file changes every 5 seconds
 
   unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    // Save the last time the LED blinked
    previousMillis = currentMillis;

    // Toggle LED state
    ledState = !ledState;

    // Apply LED state
    digitalWrite(LED_PIN, ledState ? HIGH : LOW);
  }
}

void handleSetAngle() {
  if (webServer.hasArg("angle")) {
    int targetAngle = webServer.arg("angle").toInt();
    int currentAngle = servo.read();
    if (targetAngle >= 0 && targetAngle <= 180) {
      if (targetAngle > currentAngle) {
        for (int angle = currentAngle; angle <= targetAngle; angle++) {
          servo.write(angle);
          delay(15); // Delay for smoother motion, adjust as needed
        }
      } else {
        for (int angle = currentAngle; angle >= targetAngle; angle--) {
          servo.write(angle);
          delay(15); // Delay for smoother motion, adjust as needed
        }
      }
      webServer.send(200, "text/plain", "Servo angle set to: " + String(targetAngle));
    } else {
      webServer.send(400, "text/plain", "Invalid angle value. Angle must be between 0 and 180 degrees.");
    }
  } else {
    webServer.send(400, "text/plain", "Missing angle parameter.");
  }
}



void checkFileChanges() {
  File file = SPIFFS.open(messagesFile, "r");
  if (file) {
    unsigned long currentFileModifiedTime = file.getLastWrite();
    file.close();

    if (currentFileModifiedTime != prevFileModifiedTime) {
      prevFileModifiedTime = currentFileModifiedTime;
      updateMessages();
    }
  } else {
    Serial.println("Error opening messages file");
  }
}

void updateMessages() {
  messages = ""; // Clear existing messages
  File file = SPIFFS.open(messagesFile, "r");
  if (file) {
    while (file.available()) {
      messages += file.readStringUntil('\n');
    }
    file.close();
    broadcastMessages();
  } else {
    Serial.println("Error opening messages file");
  }
}

void broadcastMessages() {
  webSocket.broadcastTXT(messages);
}

void handleWebSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_TEXT: {
      // Handle text message
      String message = String((char*)payload);
      Serial.print("Received message: ");
      Serial.println(message);

      String messages;
      // Read JSON data from messages.txt file
      File file = SPIFFS.open(messagesFile, "r");
      if (file) {
           while (file.available()) {
          messages += file.readStringUntil('\n');
          }
          file.close();
          String jsonResponse = messages;
          webServer.send(200, "application/json", jsonResponse);
          Serial.println("broadcasting");
          // Broadcast the messages via WebSocket
          webSocket.broadcastTXT(jsonResponse);
          
     
      } else {
        Serial.println("Error opening messages file");
      }
      break;
    }
    default:
      break;
  }
}

void handleSendMessage() {
  // Handle sending message via HTTP POST
  if (webServer.hasArg("message") && webServer.hasArg("username") && webServer.hasArg("receiver") && webServer.hasArg("phoneNumber")) {
    String message = webServer.arg("message");
    String username = webServer.arg("username");
    String receiver = webServer.arg("receiver");
    String phoneNumber = webServer.arg("phoneNumber");

    Serial.print("Received message from ");
    Serial.print(username);
    Serial.print(" to ");
    Serial.print(receiver);
    Serial.print(" (Phone Number: ");
    Serial.print(phoneNumber);
    Serial.print("): ");
    Serial.println(message);
    
    // Open the JSON file in write mode
    File file = SPIFFS.open(messagesFile, "a+"); // Open file in append mode or create if not exists
    if (!file) {
      Serial.println("Error opening messages file for writing");
      webServer.send(500, "text/plain", "Error opening messages file for writing");
      return;
    }
    
    // Parse the existing JSON data from the file
    DynamicJsonDocument doc(1024);
    if (file.size() == 0) {
      // If the file is empty, initialize with an empty array
      doc = DynamicJsonDocument(1024);
      JsonArray messages = doc.createNestedArray("messages");
    } else {
      DeserializationError error = deserializeJson(doc, file);
      if (error) {
        Serial.println("Error parsing existing messages: " + String(error.c_str()));
        file.close();
        webServer.send(500, "text/plain", "Error parsing existing messages");
        return;
      }
    }
    
    // Create a new JSON object for the new message
    JsonObject newMessage = doc["messages"].createNestedObject();
    newMessage["id"] = doc["messages"].size() + 1; // Increment ID
    newMessage["username"] = username;
    newMessage["receiver"] = receiver;
    newMessage["phoneNumber"] = phoneNumber;
    newMessage["message"] = message;
    
    // Serialize the JSON document to the file
    file.close();
    file = SPIFFS.open(messagesFile, "w"); // Re-open file in write mode to truncate
    if (!file) {
      Serial.println("Error reopening messages file for writing");
      webServer.send(500, "text/plain", "Error reopening messages file for writing");
      return;
    }
    if (serializeJson(doc, file) == 0) {
      file.close();
      Serial.println("Error saving message");
      webServer.send(500, "text/plain", "Error saving message");
      return;
    }
    file.close();

    // Broadcast the message via WebSocket
    webServer.enableCORS(true);
    webServer.send(200, "text/plain", "Message Sent");
//    broadcastMessages();
  } else {
    webServer.send(400, "text/plain", "Missing required parameters (message, username, receiver, phoneNumber)");
  }
   updateMessages();
}


void handleClearMessages() {
  // Handle clearing messages via HTTP POST
  if (SPIFFS.remove(messagesFile)) {
    webServer.send(200, "text/plain", "Messages Cleared");
  } else {
    webServer.send(500, "text/plain", "Error clearing messages");
  }
  
}

void showMessages() {
  // Handle showing messages via HTTP GET and WebSocket
  String messages;
  File file = SPIFFS.open(messagesFile, "r");
  if (file) {
    while (file.available()) {
      messages += file.readStringUntil('\n');
    }
    file.close();
    String jsonResponse = messages;
    webServer.send(200, "application/json", jsonResponse);

    // Broadcast the messages via WebSocket
    webSocket.broadcastTXT(jsonResponse);
  } else {
    webServer.send(500, "text/plain", "Error reading messages");
  }
}


void handleNotFound() {
  // Handle not found routes
  if (webServer.method() == HTTP_OPTIONS) {
    webServer.sendHeader("Access-Control-Allow-Origin", "*");
    webServer.sendHeader("Access-Control-Max-Age", "10000");
    webServer.sendHeader("Access-Control-Allow-Methods", "PUT,POST,GET,OPTIONS");
    webServer.sendHeader("Access-Control-Allow-Headers", "*");
    webServer.send(204);
  } else {
    webServer.send(404, "text/plain", "");
  }
}
