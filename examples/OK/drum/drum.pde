import controlP5.*;
import ddf.minim.*;
import ddf.minim.analysis.*;
import ddf.minim.ugens.*;
import java.awt.Toolkit;
import java.awt.datatransfer.*;
import java.util.*;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import processing.serial.*;
import themidibus.*;

AudioOutput out;
ControlP5 cp5;
FFT fft;
Gain kick_gain;
Gain snare_gain;
MidiBus myBus;
Minim minim;
Sampler currentSample;
Sampler kick;
Sampler snare;
Serial myPort;
boolean isMidiMode = false;
boolean showADSR = true;
boolean showLog = true;
boolean showSpec = true;
boolean showWave = true;
float fgHue = 230.0;
float masterGain = -5.0;
float trailAlpha = 100.0;
float waveScale = 2.5;
int adsrState = 0;
int adsrTimer = 0;
int pitch;
int serialBaud = 115200;
int stageBgColor;
int stageFgColor;
int velocity;

void logToScreen(String msg, int type) {
    Textarea target = (type >= 1) ? cp5.get(Textarea.class, "alertsArea") : cp5.get(Textarea.class, "consoleArea");
    if (target != null) {
      String prefix = (type == 3) ? "[ERR] " : (type == 2) ? "[WARN] " : (type == 1) ? "[!] " : "[INFO] ";
      target.append(prefix + msg + "\n");
      target.scroll(1.0); // Always scroll to bottom
    }
    println((type==3?"[ERR] ":type==2?"[WARN] ":"[INFO] ") + msg);
  }

  void midiInputDevice(int n) {
    String[] inputs = MidiBus.availableInputs();
    if (n >= 0 && n < inputs.length) {
      myBus.clearInputs();
      myBus.addInput(n);
      logToScreen("MIDI Connected: " + inputs[n], 1);
    }
  }

  void serialInputDevice(int n) {
    String[] ports = Serial.list();
    if (n >= 0 && n < ports.length) {
      if (myPort != null) { myPort.stop(); }
      try {
        myPort = new Serial(this, ports[n], serialBaud);
        logToScreen("Serial Connected: " + ports[n], 1);
      } catch (Exception e) {
        logToScreen("Serial Error: Port Busy or Unavailable", 3);
      }
    }
  }

  void scanMidi() {
    String[] inputs = MidiBus.availableInputs();
    ScrollableList sl = cp5.get(ScrollableList.class, "midiInputDevice");
    if (sl != null) {
      sl.clear();
      println("--- MIDI Scan Results ---");
      for (int i = 0; i < inputs.length; i++) {
        sl.addItem(inputs[i], i);
        println("[" + i + "] " + inputs[i]);
      }
      sl.getCaptionLabel().align(ControlP5.LEFT, ControlP5.CENTER).setPaddingX(10);
      logToScreen("MIDI Scanned: " + inputs.length + " devices found.", 1);
    }
  }

  void copyLogs() {
    Textarea console = cp5.get(Textarea.class, "consoleArea");
    Textarea alerts = cp5.get(Textarea.class, "alertsArea");
    String content = "--- ALERTS ---\n" + (alerts != null ? alerts.getText() : "") + 
                     "\n\n--- CONSOLE ---\n" + (console != null ? console.getText() : "");
    
    StringSelection selection = new StringSelection(content);
    Clipboard clipboard = Toolkit.getDefaultToolkit().getSystemClipboard();
    clipboard.setContents(selection, selection);
    logToScreen("Logs copied to clipboard.", 1);
  }

  void clearLogs() {
    Textarea console = cp5.get(Textarea.class, "consoleArea");
    Textarea alerts = cp5.get(Textarea.class, "alertsArea");
    if (console != null) console.clear();
    if (alerts != null) alerts.clear();
    logToScreen("Logs cleared.", 1);
  }

  void keyPressed() {
    // 1. System Keys (Always Active)
    if (key == CODED) {
      if (keyCode == UP) { pitchTranspose += 12; logToScreen("Octave UP: " + (pitchTranspose/12), 1); }
      else if (keyCode == DOWN) { pitchTranspose -= 12; logToScreen("Octave DOWN: " + (pitchTranspose/12), 1); }
      else if (keyCode == LEFT || keyCode == RIGHT) {
        Object[] names = instrumentMap.keySet().toArray();
        if (names.length > 0) {
          int idx = -1;
          for(int i=0; i<names.length; i++) { if(names[i].toString().equals(currentInstrument)) { idx = i; break; } }
          if (keyCode == RIGHT) idx = (idx + 1) % names.length;
          else idx = (idx - 1 + names.length) % names.length;
          currentInstrument = names[idx].toString();
          logToScreen("Instrument: " + currentInstrument + " (" + instrumentMap.get(currentInstrument) + ")", 1);
        }
      }
    } else if (key == '=' || key == '+') { pitchTranspose += 1; logToScreen("Transpose: " + pitchTranspose, 1); }
    else if (key == '-') { pitchTranspose -= 1; logToScreen("Transpose: " + pitchTranspose, 1); }
    else if (key == BACKSPACE) { pitchTranspose = 0; logToScreen("Transpose Reset", 1); }

    // 2. Built-in Piano Keys (Only if Stage Block exists)
    int p = -1;
    char k = Character.toLowerCase(key);
    if (k == 'q') p = 60;
    else if (k == '2') p = 61;
    else if (k == 'w') p = 62;
    else if (k == '3') p = 63;
    else if (k == 'e') p = 64;
    else if (k == 'r') p = 65;
    else if (k == '5') p = 66;
    else if (k == 't') p = 67;
    else if (k == '6') p = 68;
    else if (k == 'y') p = 69;
    else if (k == '7') p = 70;
    else if (k == 'u') p = 71;
    else if (k == 'i') p = 72;
    else if (k == '9') p = 73;
    else if (k == 'o') p = 74;
    else if (k == '0') p = 75;
    else if (k == 'p') p = 76;
    else p = -1;

    if (p != -1) {
      playNoteInternal(p, 100);
      logToScreen("Keyboard ON: MIDI " + p, 0);
    }
    
    // 3. Custom Event Injection Placeholder
    
  }

  void keyReleased() {
    int p = -1;
    char k = Character.toLowerCase(key);
    if (k == 'q') p = 60;
    else if (k == '2') p = 61;
    else if (k == 'w') p = 62;
    else if (k == '3') p = 63;
    else if (k == 'e') p = 64;
    else if (k == 'r') p = 65;
    else if (k == '5') p = 66;
    else if (k == 't') p = 67;
    else if (k == '6') p = 68;
    else if (k == 'y') p = 69;
    else if (k == '7') p = 70;
    else if (k == 'u') p = 71;
    else if (k == 'i') p = 72;
    else if (k == '9') p = 73;
    else if (k == 'o') p = 74;
    else if (k == '0') p = 75;
    else if (k == 'p') p = 76;
    else p = -1;

    if (p != -1) {
      stopNoteInternal(p);
      logToScreen("Keyboard OFF: MIDI " + p, 0);
    }
    
    
  }

void noteOn(int channel, int pitch, int velocity) {
  logToScreen("Note ON - Pitch: " + pitch + " Vel: " + velocity, 0);
    if (pitch == 57) {
    if (kick != null) {
      kick_gain.setValue(map(velocity, 0, 127, -40, 0));
      kick.trigger();
    }
  }
  if (pitch == 59) {
    if (snare != null) {
      snare_gain.setValue(map(velocity, 0, 127, -40, 0));
      snare.trigger();
    }
  }
  if (pitch >= 60) {
    playNoteInternal((int)pitch, (float)velocity);
  }

}

void noteOff(int channel, int pitch, int velocity) {
  logToScreen("Note OFF - Pitch: " + pitch, 0);
    if (pitch >= 60) {
    stopNoteInternal((int)pitch);
  }

}

void setup() {
  size(1600, 600);
  pixelDensity(displayDensity());
  stageBgColor = color(0, 0, 0);
  stageFgColor = color(255, 0, 150);
  minim = new Minim(this);
  out = minim.getLineOut();
  fft = new FFT(out.bufferSize(), out.sampleRate());
  cp5 = new ControlP5(this);
  cp5.setFont(createFont("Arial", 16));
  MidiBus.list();
  myBus = new MidiBus(this, 0, -1);
  
    // --- Log Textareas ---
  cp5.addTextarea("alertsArea")
     .setPosition(1200, 35)
     .setSize(400, 265)
     .setFont(createFont("Arial", 18))
     .setLineHeight(22)
     .setColor(color(255, 100, 100))
     .setColorBackground(color(40, 0, 0))
     .setColorForeground(color(100, 0, 0));
  cp5.addTextarea("consoleArea")
     .setPosition(1200, 335)
     .setSize(400, 265)
     .setFont(createFont("Arial", 18))
     .setLineHeight(22)
     .setColor(color(200))
     .setColorBackground(color(20))
     .setColorForeground(color(100));
  
    // --- Control Panel UI ---
  cp5.addToggle("showWave").setPosition(20, 430).setSize(40, 20).setCaptionLabel("WAVE");
  cp5.addToggle("showADSR").setPosition(90, 430).setSize(40, 20).setCaptionLabel("ADSR");
  cp5.addToggle("showSpec").setPosition(160, 430).setSize(40, 20).setCaptionLabel("SPEC");
  cp5.addToggle("showLog").setPosition(230, 430).setSize(40, 20).setCaptionLabel("LOG");
  cp5.addSlider("trailAlpha").setPosition(20, 495).setSize(150, 15).setRange(0, 255).setCaptionLabel("TRAIL");
  cp5.addSlider("waveScale").setPosition(20, 525).setSize(150, 15).setRange(0.1, 10).setCaptionLabel("SCALE");
  cp5.addSlider("fgHue").setPosition(20, 555).setSize(150, 15).setRange(0, 255).setValue(230.0).setCaptionLabel("FG COLOR");
  cp5.addSlider("adsrA").setPosition(320, 485).setSize(15, 80).setRange(0, 2).setCaptionLabel("A").getCaptionLabel().align(ControlP5.CENTER, ControlP5.BOTTOM_OUTSIDE).setPaddingX(0);
  cp5.addSlider("adsrD").setPosition(380, 485).setSize(15, 80).setRange(0, 1).setCaptionLabel("D").getCaptionLabel().align(ControlP5.CENTER, ControlP5.BOTTOM_OUTSIDE).setPaddingX(0);
  cp5.addSlider("adsrS").setPosition(440, 485).setSize(15, 80).setRange(0, 1).setCaptionLabel("S").getCaptionLabel().align(ControlP5.CENTER, ControlP5.BOTTOM_OUTSIDE).setPaddingX(0);
  cp5.addSlider("adsrR").setPosition(500, 485).setSize(15, 80).setRange(0, 2).setCaptionLabel("R").getCaptionLabel().align(ControlP5.CENTER, ControlP5.BOTTOM_OUTSIDE).setPaddingX(0);
  cp5.addSlider("masterGain").setPosition(580, 485).setSize(15, 80).setRange(-40, 15).setCaptionLabel("GAIN").getCaptionLabel().align(ControlP5.CENTER, ControlP5.BOTTOM_OUTSIDE).setPaddingX(0);
  String[] startInputs = MidiBus.availableInputs();
  println("--- MIDI Devices at Startup ---");
  for(String s : startInputs) println("  > " + s);
  ScrollableList sl = cp5.addScrollableList("midiInputDevice")
     .setPosition(680, 430)
     .setSize(300, 150)
     .setBarHeight(30)
     .setItemHeight(25)
     .setCaptionLabel("MIDI DEVICE");
  for (int i = 0; i < startInputs.length; i++) {
    sl.addItem(startInputs[i], i);
  }
  sl.getCaptionLabel().toUpperCase(false).getStyle().setMarginTop(4);
  sl.getCaptionLabel().setPaddingX(10);
  if (startInputs.length > 0) {
    sl.setValue(0); // This will show the device name and trigger connection
  }
  sl.close();
  
  // 7. Serial Port Selection
  String[] serialPorts = Serial.list();
  ScrollableList ssl = cp5.addScrollableList("serialInputDevice")
     .setPosition(680, 470)
     .setSize(300, 150)
     .setBarHeight(30)
     .setItemHeight(25)
     .setCaptionLabel("SERIAL PORT");
  for (int i = 0; i < serialPorts.length; i++) {
    ssl.addItem(serialPorts[i], i);
  }
  ssl.getCaptionLabel().toUpperCase(false).getStyle().setMarginTop(4);
  ssl.getCaptionLabel().setPaddingX(10);
  ssl.close();
  cp5.addButton("scanMidi")
     .setPosition(990, 430)
     .setSize(50, 30)
     .setCaptionLabel("SCAN")
     .getCaptionLabel().toUpperCase(false).getStyle().setMarginTop(4);
  cp5.addButton("copyLogs")
     .setPosition(1405, 5)
     .setSize(90, 25)
     .setCaptionLabel("COPY LOG")
     .getCaptionLabel().toUpperCase(false).getStyle().setMarginTop(2);
  cp5.addButton("clearLogs")
     .setPosition(1500, 5)
     .setSize(90, 25)
     .setCaptionLabel("CLEAR LOG")
     .getCaptionLabel().toUpperCase(false).getStyle().setMarginTop(2);
  logToScreen("System Initialized.", 0);
    kick = new Sampler("kick.wav", 4, minim);
    kick_gain = new Gain(0.f);
    kick.patch(kick_gain).patch(out);
    snare = new Sampler("snare.wav", 4, minim);
    snare_gain = new Gain(0.f);
    snare.patch(snare_gain).patch(out);
}


void draw() {
  pushStyle();
  colorMode(HSB, 255);
  stageFgColor = color(fgHue, 255, 255);
  popStyle();
  out.setGain(masterGain);
  noStroke();
  fill(30); rect(0, 400, width, 200);
  // Draw rainbow bar behind fgHue slider
  for (int i = 0; i < 150; i++) {
    colorMode(HSB, 150);
    stroke(i, 150, 150);
    line(20 + i, 555 + 15 + 2, 20 + i, 555 + 15 + 5);
  }
  colorMode(RGB, 255);
  float currentVisualW = showLog ? 1200.0 : width;
  noStroke();
  fill(stageBgColor, 255 - trailAlpha);
  rect(0, 0, currentVisualW, 400);
  int activeViews = int(showWave) + int(showADSR) + int(showSpec);
  if (activeViews > 0) {
    float viewW = currentVisualW / float(activeViews);
    float currentX = 0;
    stroke(stageFgColor);
    strokeWeight(2);
    noFill();
    if (showWave) {
      pushMatrix();
      translate(currentX, 0);
      stroke(stageFgColor);
      for(int i = 0; i < out.bufferSize() - 1; i++) {
        float x1 = map(i, 0, out.bufferSize(), 0, viewW);
        float x2 = map(i+1, 0, out.bufferSize(), 0, viewW);
        line(x1, 400/2 + out.mix.get(i) * waveScale * 100, x2, 400/2 + out.mix.get(i+1) * waveScale * 100);
      }
      stroke(50); line(viewW, 0, viewW, 400);
      popMatrix();
      currentX += viewW;
    }
    if (showADSR) {
      pushMatrix();
      translate(currentX, 0);
      pushStyle();
      colorMode(HSB, 255);
      int adsrColor = color((fgHue + 40) % 255, 200, 255);
      stroke(adsrColor);
      float totalTime = adsrA + adsrD + adsrR + 0.5;
      float xA = map(adsrA, 0, totalTime, 0, viewW);
      float xD = map(adsrA + adsrD, 0, totalTime, 0, viewW);
      float xS = map(adsrA + adsrD + 0.5, 0, totalTime, 0, viewW);
      float xR = map(totalTime, 0, totalTime, 0, viewW);
      float yPeak = 400 * 0.2;
      float ySus = 400 - (adsrS * 400 * 0.8);
      float yBase = 400 * 0.9;
      beginShape();
      vertex(0, yBase);
      vertex(xA, yPeak);
      vertex(xD, ySus);
      vertex(xS, ySus);
      vertex(xR, yBase);
      endShape();
      
      // --- State Machine Dot Movement ---
      float dotX = 0; float dotY = yBase;
      if (adsrState == 1) {
        float elapsed = (millis() - adsrTimer) / 1000.0;
        if (elapsed < adsrA) {
          dotX = map(elapsed, 0, adsrA, 0, xA);
          dotY = map(elapsed, 0, adsrA, yBase, yPeak);
        } else if (elapsed < adsrA + adsrD) {
          dotX = map(elapsed, adsrA, adsrA + adsrD, xA, xD);
          dotY = map(elapsed, adsrA, adsrA + adsrD, yPeak, ySus);
        } else {
          float sPhase = (sin(millis() * 0.005) + 1) / 2.0;
          dotX = lerp(xD, xS, sPhase);
          dotY = ySus;
        }
      } else if (adsrState == 2) {
        float relElapsed = (millis() - adsrTimer) / 1000.0;
        if (relElapsed < adsrR) {
          dotX = map(relElapsed, 0, adsrR, xS, xR);
          dotY = map(relElapsed, 0, adsrR, ySus, yBase);
        } else {
          adsrState = 0; dotX = xR; dotY = yBase;
        }
      }
      
      if (adsrState > 0) {
        noStroke();
        for(int j=8; j>0; j--) {
          fill(adsrColor, 15); ellipse(dotX, dotY, j*5, j*5);
        }
        fill(255); ellipse(dotX, dotY, 8, 8);
      }
      popStyle();
      stroke(50); line(viewW, 0, viewW, 400); 
      popMatrix();
      currentX += viewW;
    }
    if (showSpec) {
      pushMatrix();
      translate(currentX, 0);
      pushStyle();
      colorMode(HSB, 255);
      fft.forward(out.mix);
      for(int i = 0; i < fft.specSize(); i++) {
        float x = map(i, 0, fft.specSize(), 0, viewW);
        float y = map(fft.getBand(i), 0, 50, 400, 400*0.2);
        // Dynamic Gradient based on frequency index i
        float hValue = (fgHue + map(i, 0, fft.specSize(), 0, 80)) % 255;
        stroke(hValue, 200, 255);
        line(x, 400, x, y);
      }
      popStyle();
      popMatrix();
    }
  }
  Textarea areaAlerts = cp5.get(Textarea.class, "alertsArea");
  Textarea areaConsole = cp5.get(Textarea.class, "consoleArea");
  Button btnCopy = (Button)cp5.getController("copyLogs");
  Button btnClear = (Button)cp5.getController("clearLogs");
  if (areaAlerts != null && areaConsole != null) {
    if (showLog) {
      areaAlerts.show();
      areaConsole.show();
      if(btnCopy != null) btnCopy.show();
      if(btnClear != null) btnClear.show();
      pushMatrix();
      translate(1200, 0);
      float splitH = height / 2.0;
      fill(40, 0, 0); noStroke(); rect(0, 0, 400, splitH);
      fill(255, 100, 100); textSize(14); text("ALERTS (WARN/ERR)", 10, 25);
      translate(0, splitH);
      fill(20); noStroke(); rect(0, 0, 400, height - splitH);
      fill(200); textSize(14); text("SYSTEM CONSOLE", 10, 25);
      stroke(255); line(0, 0, 400, 0);
      popMatrix();
    } else {
      areaAlerts.hide();
      areaConsole.hide();
      if(btnCopy != null) btnCopy.hide();
      if(btnClear != null) btnClear.hide();
    }
  }
}