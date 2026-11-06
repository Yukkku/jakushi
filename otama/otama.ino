#include <Adafruit_MCP4728.h>
#include <Wire.h>

Adafruit_MCP4728 mcp;

const int FREQS_STEP = 50;
int freqs[57];
const int THRESHOLD = 600;
float err = 0;

void freqs_set() {
  int llst = 0;
  int nidx = 0;
  digitalWrite(8, HIGH);
  for (int i = 0; i < 57; ++i) {
    mcp.setChannelValue(MCP4728_CHANNEL_A, i * FREQS_STEP);
    delay(100);
    int count = 0;
    bool last = false;
    const unsigned long deadline = millis() + 1000;
    while (millis() < deadline) {
      bool v = analogRead(A0) < THRESHOLD;
      if (v && !last) count++;
      last = v;
    }
    Serial.println(count);
    freqs[i] = count;
  }
  digitalWrite(8, LOW);
}

int target_freq;
int now_out;
int dif;

void set_status(int f) {
  target_freq = f;
  if (f == 0) {
    digitalWrite(8, LOW);
    return;
  }
  digitalWrite(8, HIGH);
  for (int i = 1; i < 57; ++i) {
    if (f + err < freqs[i]) continue;
    dif = freqs[i] - freqs[i - 1];
    now_out = (i - 1) * FREQS_STEP + (f + err - freqs[i - 1]) * FREQS_STEP / dif;
    if (now_out < 0) now_out = 0;
    break;
  }
  mcp.setChannelValue(MCP4728_CHANNEL_A, now_out);
  count_reset();
}

unsigned long count_start;
int count;
bool last_status = false;

void count_reset() {
  count = 0;
  count_start = millis();
}

void setup() {
  pinMode(8, OUTPUT);
  Serial.begin(9600);
  while (!Serial) delay(10);
  mcp.begin();
  freqs_set();
  set_status(0);
}

void loop() {
  if (Serial.available()) {
    int f = Serial.parseInt();
    while (Serial.available()) Serial.read();
    set_status(f);
  }
  if (target_freq > 0) {
    int now_status = analogRead(A0) < THRESHOLD;
    if (now_status && !last_status) ++count;
    last_status = now_status;
    unsigned long now = millis();
    int ideal = target_freq * (now - count_start) / 1000;
    if (now - count_start >= 1000 || ideal + 2 < count || count + 2 < ideal) {
      double qls = (target_freq - (double)count * 1000 / (now - count_start)) / 1.5;
      err += max(-10.0, min(10.0, qls));
      set_status(target_freq);
    }
  }
}
