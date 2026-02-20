/*
 * SynthBlockly Stage - Example 15
 * TTP229 16-Key Multi-touch Drum Pad (Status String Mode)
 * 
 * 硬體需求 (TTP229 跳線設定)：
 * 1. 短接 TP2 -> 開啟 16 鍵模式
 * 2. 短接 TP3 + TP4 -> 開啟「全 16 鍵多鍵有效」模式
 * 3. 短接 TP5 -> 提高靈敏度 (採樣頻率 64Hz)
 * 
 * 接線：
 * - VCC -> 5V
 * - GND -> GND
 * - SCL -> D2
 * - SDO -> D3
 */

#define SCL_PIN 2
#define SDO_PIN 3

void setup() {
  // 高波特率減少延遲
  Serial.begin(115200); 
  
  pinMode(SCL_PIN, OUTPUT);
  pinMode(SDO_PIN, INPUT);
  digitalWrite(SCL_PIN, HIGH);
  
  // 上電穩定時間
  delay(500);
}

void loop() {
  uint16_t currentKeys = 0;

  // 1. 讀取 16 個按鍵狀態
  for (int i = 0; i < 16; i++) {
    digitalWrite(SCL_PIN, LOW);
    delayMicroseconds(50); 
    
    if (digitalRead(SDO_PIN) == LOW) {
      currentKeys |= (1 << i); 
    }
    
    digitalWrite(SCL_PIN, HIGH);
    delayMicroseconds(50); 
  }

  // 2. 將 16 鍵狀態轉化為字串輸出 (例如 "1000000000000000")
  for (int i = 0; i < 16; i++) {
    if (currentKeys & (1 << i)) {
      Serial.print("1");
    } else {
      Serial.print("0");
    }
  }
  
  Serial.println(); // 結尾換行
  
  delay(10); // 100Hz 掃描頻率
}
