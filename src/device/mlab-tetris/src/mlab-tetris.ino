UDP Udp;
// We will be using D1 to control our LED
int ledPin = D5;

int bufferLength = 4;


String UDP_IP = "192.168.0.101";
int UDP_PORT = 9000;

String keys[] = { "68" };
int buttonPins[] = { D2 };
bool buttonStates[sizeof(keys)];

void setup() {
  pinMode( ledPin , OUTPUT ); // sets pin as output

  for(int i = 0; i < sizeof(keys); i++) {
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
    for(int i = 0; i < sizeof(keys); i++) {
      int currentButtonState = digitalRead( buttonPins[i] ) == LOW;

      if(currentButtonState != buttonStates[i]) {
        buttonStates[i] = currentButtonState;
        digitalWrite( ledPin, buttonStates[i] ? HIGH : LOW);
        Udp.beginPacket(UDP_IP, UDP_PORT);
        String msg = (keys[i] + ":" + (buttonStates[i] ? "1" : "0"));
        char msgArr[bufferLength];
        for(int j = 0; j <= bufferLength; j++) {
          msgArr[j] = msg[j];
        }
    		Udp.write(msgArr);
    		Udp.endPacket();
      }
    }
  }
}
