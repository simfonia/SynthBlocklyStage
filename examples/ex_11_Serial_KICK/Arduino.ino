/*
 * SynthBlockly Stage - Universal Controller
 * 
 * 這是一個「全能版」的 Arduino 程式，同時支援以下範例：
 * 1. 11_Serial_KICK (按鈕 -> KICK)
 * 2. 12_wah-wah     (光敏 -> LDR:數值)
 * 3. 13_Chord_Pad   (TTP229 -> KEY:1~16)
 * 4. 14_Drum_Pad    (TTP229 -> KEY:1~16)
 * 
 * ==========================================
 * 接線說明 (Wiring Guide)
 * ==========================================
 * 
 * [1. TTP229 觸控板] (16鍵模式需將 TP2 跳線接地)
 * - VCC  -> 5V
 * - GND  -> GND
 * - SCL  -> D2
 * - SDO  -> D3
 * 
 * [2. 按鈕 (Button)]
 * - 一腳  -> D4
 * - 一腳  -> GND (程式已啟用內建上拉電阻)
 * 
 * [3. 光敏電阻 (LDR)]
 * - VCC  -> LDR 一腳
 * - A0   -> LDR 另一腳 & 10k電阻一腳
 * - GND  -> 10k電阻另一腳 (分壓電路)
 * 
 * ==========================================
 */

// --- 腳位設定 ---
#define TTP229_SCL_PIN 2
#define TTP229_SDO_PIN 3
#define BUTTON_PIN     4
#define LDR_PIN        A0

// --- 變數宣告 ---

// 1. TTP229 相關
uint16_t currentKeys = 0;
uint16_t lastKeys = 0;

// 2. 按鈕相關 (音樂優化版防抖)
int buttonState = HIGH;         
int lastReading = HIGH;     
unsigned long lastDebounceTime = 0;
unsigned long debounceDelay = 5; // 音樂觸發只需 5ms 防抖

// 3. LDR 相關
unsigned long lastLdrTime = 0;
unsigned long ldrInterval = 20; // 提高 LDR 取樣率至 50Hz (20ms)

void setup() {
  Serial.begin(115200); // 確保高波特率
  
  // TTP229 初始化
  pinMode(TTP229_SCL_PIN, OUTPUT);
  pinMode(TTP229_SDO_PIN, INPUT);
  digitalWrite(TTP229_SCL_PIN, HIGH);
  
  // 按鈕 初始化
  pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void loop() {
  unsigned long now = millis();

  // ==========================================
  // 任務 1: 讀取 TTP229 (保持相容性)
  // ==========================================
  uint16_t currentKeys = 0;
  for (int i = 0; i < 16; i++) {
    digitalWrite(TTP229_SCL_PIN, LOW);
    delayMicroseconds(50); 
    if (digitalRead(TTP229_SDO_PIN) == LOW) {
      currentKeys |= (1 << i); 
    }
    digitalWrite(TTP229_SCL_PIN, HIGH);
    delayMicroseconds(50);
  }

  for (int i = 0; i < 16; i++) {
    bool isPressed = bitRead(currentKeys, i);
    bool wasPressed = bitRead(lastKeys, i);
    if (isPressed && !wasPressed) {
      Serial.print("KEY:");
      Serial.println(i + 1); 
    }
  }
  lastKeys = currentKeys;

  // ==========================================
  // 任務 2: 處理按鈕 (KICK) - 立即觸發邏輯
  // ==========================================
  int reading = digitalRead(BUTTON_PIN);

  if (reading != lastReading) {
    lastDebounceTime = now;
  }

  if ((now - lastDebounceTime) > debounceDelay) {
    if (reading != buttonState) {
      buttonState = reading;
      // 偵測按下 (立即觸發)
      if (buttonState == LOW) {
        Serial.println("KICK");
      }
    }
  }
  lastReading = reading;

  // ==========================================
  // 任務 3: 讀取光敏電阻 (LDR)
  // ==========================================
  if (now - lastLdrTime >= ldrInterval) {
    lastLdrTime = now;
    int val = analogRead(LDR_PIN);
    // 只在數值有顯著變化或為了持續更新時發送？
    // 為了 wah-wah 效果流暢，我們持續發送
    Serial.print("LDR:");
    Serial.println(val);
  }
  
  // 短暫休息避免過熱，同時配合 TTP229 的掃描節奏
  delay(10); 
}
