UDP Udp;

int bufferLength = 4;

String UDP_IP = "172.20.10.7";
int UDP_PORT = 9000;

String buttonKeys[] = { "65", "87", "68", "37", "38", "39" }; //"65", "87", "68", "37"
int buttonPins[] = { D1, D2, D3, D4, D5, D6 };
bool buttonStates[6];

void setup() {
  for(int i = 0; i < 6; i++) {
    pinMode( buttonPins[i] , INPUT_PULLUP); // sets pin as input
    buttonStates[i] = false;
  }

  Udp.begin(UDP_PORT);

  Particle.variable("UDP_IP", UDP_IP);
  Particle.publish("UDP_IP", UDP_IP);
  Particle.variable("UDP_PORT", UDP_PORT);
  Particle.publish("UDP_PORT", UDP_PORT);
}

void loop() {
  if(WiFi.ready() && millis() >= 5000) {  // This will start after 5secs from reset
    for(int i = 0; i < 6; i++) {
      int currentButtonState = digitalRead( buttonPins[i] ) == LOW;

      if(currentButtonState != buttonStates[i]) {
        buttonStates[i] = currentButtonState;
        Udp.beginPacket(UDP_IP, UDP_PORT);
        String msg = (buttonKeys[i] + ":" + (buttonStates[i] ? "1" : "0"));
        char msgArr[bufferLength];
        for(int j = 0; j <= bufferLength; j++) {
          msgArr[j] = msg[j];
        }
    		Udp.write(msgArr);
    		Udp.endPacket();
      }
    }
  }
  delay(10);
}
