#include <ESP8266WiFi.h>
#include "./DNSServer.h"
#include <ESP8266WebServer.h>
#include "FS.h"
#include <ArduinoJson.h>

const byte        DNS_PORT = 53;
const String      messagesFile = "/messages.txt";
const char*       wifiName = "ChatWithMe";

IPAddress         apIP(10, 10, 10, 1);
DNSServer         dnsServer;
ESP8266WebServer  webServer(80);

void setup() {
  Serial.begin(115200);
  SPIFFS.begin();

  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));
  WiFi.softAP(wifiName);
  dnsServer.start(DNS_PORT, "*", apIP);
  
  webServer.on("/", HTTP_GET, []() {
  webServer.enableCORS(true);// Allow requests from any origin
  webServer.send(200, "text/html", "Welcome to the ESP8266 File Server");
});
  webServer.on("/send", HTTP_POST, handleSendMessage);
  webServer.on("/messages", HTTP_GET, showMessages);
  webServer.on("/clear", HTTP_POST, handleClearMessages);


  webServer.onNotFound(handleNotFound);
   webServer.enableCORS(true);
  webServer.begin();
}

void handleNotFound()
{
    if (webServer.method() == HTTP_OPTIONS)
    {
       
        webServer.sendHeader("Access-Control-Allow-Origin", "*");
        webServer.sendHeader("Access-Control-Max-Age", "10000");
        webServer.sendHeader("Access-Control-Allow-Methods", "PUT,POST,GET,OPTIONS");
        webServer.sendHeader("Access-Control-Allow-Headers", "*");
        webServer.enableCORS(true);
        webServer.send(204);
    }
    else
    {
        webServer.send(404, "text/plain", "");
    }
}




void handleSendMessage() {
  if (webServer.hasArg("message") && webServer.hasArg("username")) {
    String message = webServer.arg("message");
    String username = webServer.arg("username");
    
    Serial.print("Received message from ");
    Serial.print(username);
    Serial.print(": ");
    Serial.println(message);
    
    // Parse the existing JSON data from the file
    DynamicJsonDocument doc(1024);
    File file = SPIFFS.open(messagesFile, "r");
    if (file) {
      DeserializationError error = deserializeJson(doc, file);
      file.close();
      if (error) {
        webServer.send(500, "text/plain", "Error parsing existing messages");
        return;
      }
    } else {
      doc = DynamicJsonDocument(1024);
      JsonArray messages = doc.createNestedArray("messages");
    }
    
    // Create a new JSON object for the new message
    JsonObject newMessage = doc["messages"].createNestedObject();
    newMessage["id"] = doc["messages"].size() + 1; // Increment ID
    newMessage["username"] = username;
    newMessage["message"] = message;
    
    // Open the JSON file in write mode
    file = SPIFFS.open(messagesFile, "w");
    if (file) {
      // Serialize the JSON document to the file
      if (serializeJson(doc, file) == 0) {
        file.close();
        webServer.send(500, "text/plain", "Error saving message");
        return;
      }
      file.close();
      
      // Send response indicating success
      webServer.enableCORS(true);
      webServer.send(200, "text/plain", "Message Sent");
    } else {
      webServer.send(500, "text/plain", "Error saving message");
    }
  } else {
    webServer.send(400, "text/plain", "No message or username provided");
  }
} 


void handleClearMessages() {
  if (SPIFFS.remove(messagesFile)) {
    webServer.enableCORS(true);// Allow requests from any origin
    webServer.send(200, "text/plain", "Messages Cleared");
  } else {
    webServer.send(500, "text/plain", "Error clearing messages");
  }
}

void showMessages() {
  String messages;
  File file = SPIFFS.open(messagesFile, "r");
  
  if (file) {
    // Read messages from the file and store them in a String
    while (file.available()) {
      messages += file.readStringUntil('\n');
    }
    file.close();
    
    // Construct a JSON object containing the messages
    String jsonResponse = messages;
    
    // Set the appropriate headers for CORS
    webServer.enableCORS(true); // Allow requests from any origin
    webServer.sendHeader("Content-Type", "application/json");
    
    // Send the JSON response
    webServer.send(200, "application/json", jsonResponse);
  } else {
    // If there's an error reading the messages file, send a 500 error response
    webServer.send(500, "text/plain", "Error reading messages");
  }
}

void loop() {
  dnsServer.processNextRequest();
  webServer.handleClient();
}
