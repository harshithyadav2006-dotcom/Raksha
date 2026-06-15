#include <SoftwareSerial.h>

SoftwareSerial sim800(10, 11); // RX, TX

const char* PHONE_NUMBER = "+91XXXXXXXXXX";

void setup() {
  Serial.begin(9600);     // USB serial to PC (COM8)
  sim800.begin(9600);     // Serial to SIM800L
  delay(3000);

  sim800.println("AT");
  delay(1000);
  sim800.println("AT+CMGF=1"); // text mode for SMS
  delay(1000);
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd == "SOS") {
      sendSMS("SOS Alert! Emergency button triggered on website.");
      delay(2000);
      makeCall();
      Serial.println("SOS_DONE");
    }
  }

  if (sim800.available()) {
    Serial.write(sim800.read());
  }
}

void sendSMS(String message) {
  sim800.print("AT+CMGS=\"");
  sim800.print(PHONE_NUMBER);
  sim800.println("\"");
  delay(1000);
  sim800.print(message);
  delay(500);
  sim800.write(26); // Ctrl+Z to send
  delay(3000);
}

void makeCall() {
  sim800.print("ATD");
  sim800.print(PHONE_NUMBER);
  sim800.println(";");
  delay(1000);
}
