import themidibus.*;
import ddf.minim.*;
import controlP5.*;

// 全域變數
Minim minim;
AudioSample kick, snare, closedHat, openHat, tom, currentSample;
MidiBus myBus;
ControlP5 cp5;

// UI 控制變數
float masterGain = -10.0;
float waveScale = 2.5;
int trailAlpha = 60;
boolean isMidiMode = true; // 模式開關
int manualVelocity = 100;  // 鍵盤模式下的模擬力度

void setup() {
  size(1000, 400);
  background(0);

  // 初始化音訊
  minim = new Minim(this);
  kick = minim.loadSample("kick.wav", 512);
  snare = minim.loadSample("snare.wav", 512);
  closedHat = minim.loadSample("ch.wav", 512);
  openHat = minim.loadSample("oh.wav", 512);
  tom = minim.loadSample("tom.wav", 512);
  currentSample = kick;

  // 初始化 MIDI
  myBus = new MidiBus(this, 0, -1); 

  // 初始化 UI
  cp5 = new ControlP5(this);
  
  // 模式切換開關 (Toggle)
  cp5.addToggle("isMidiMode")
     .setPosition(820, 30)
     .setSize(50, 20)
     .setCaptionLabel("MIDI MODE")
     .setState(true);

  // 鍵盤模式下的模擬力度滑桿
  cp5.addSlider("manualVelocity")
     .setPosition(820, 80)
     .setRange(1, 127)
     .setValue(100)
     .setSize(100, 15)
     .setCaptionLabel("KBD VELOCITY");

  // 原有的音量與視覺滑桿
  cp5.addSlider("masterGain").setPosition(820, 130).setRange(-40, 6).setValue(-10).setCaptionLabel("MASTER GAIN");
  cp5.addSlider("waveScale").setPosition(820, 180).setRange(0.5, 10.0).setValue(2.5).setCaptionLabel("WAVE SCALE");
  cp5.addSlider("trailAlpha").setPosition(820, 230).setRange(5, 255).setValue(60).setCaptionLabel("TRAIL INTENSITY");
}

void draw() {
  // 繪圖區域背景
  fill(0, trailAlpha); 
  noStroke();
  rect(0, 0, 800, height); 

  // UI 區域背景
  fill(30);
  rect(800, 0, 200, height);

  // 顯示目前模式文字
  fill(255);
  textSize(12);
  text("CURRENT MODE: " + (isMidiMode ? "MIDI" : "KEYBOARD"), 820, 20);

  // 繪製波形
  stroke(255, 0, 150); 
  strokeWeight(3);     
  int bufferSize = currentSample.bufferSize();
  for (int i = 0; i < bufferSize - 1; i++) {
    float x1 = map(i, 0, bufferSize, 0, 800);
    float x2 = map(i + 1, 0, bufferSize, 0, 800);
    float y1 = height/2 + currentSample.mix.get(i) * height * waveScale;
    float y2 = height/2 + currentSample.mix.get(i + 1) * height * waveScale;
    line(x1, y1, x2, y2);
  }
}

// 核心觸發函數
void triggerDrum(int pitch, int velocity) {
  float gainValue = map(velocity, 1, 127, -40, masterGain);
  
  if (pitch == 60) currentSample = kick;
  else if (pitch == 62) currentSample = snare;
  else if (pitch == 64) currentSample = closedHat;
  else if (pitch == 65) currentSample = openHat;
  else if (pitch == 67) currentSample = tom;
  
  if (currentSample != null) {
    currentSample.setGain(gainValue);
    currentSample.trigger();
  }
}

// MIDI 輸入
void noteOn(int channel, int pitch, int velocity) {
  if (isMidiMode && velocity > 0) {
    triggerDrum(pitch, velocity);
  }
}

// 鍵盤輸入
void keyPressed() {
  if (!isMidiMode) {
    if (key == 'a' || key == 'A') triggerDrum(60, manualVelocity);
    if (key == 's' || key == 'S') triggerDrum(62, manualVelocity);
    if (key == 'd' || key == 'D') triggerDrum(64, manualVelocity);
    if (key == 'f' || key == 'F') triggerDrum(65, manualVelocity);
    if (key == 'g' || key == 'G') triggerDrum(67, manualVelocity);
  }
}
