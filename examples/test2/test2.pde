import controlP5.*;
import ddf.minim.*;
import ddf.minim.analysis.*;
import ddf.minim.ugens.*;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import themidibus.*;

AudioOutput out;
ControlP5 cp5;
FFT fft;
HashMap<Integer, ADSR> activeNotes = new HashMap<Integer, ADSR>();
MidiBus myBus;
Minim minim;
Sampler currentSample;
boolean isMidiMode = false;
boolean showADSR = true;
boolean showLog = true;
boolean showSpec = true;
boolean showWave = true;
float adsrA = 0.01;
float adsrD = 0.1;
float adsrR = 0.5;
float adsrS = 0.5;
float fgHue = 230.0;
float masterGain = -5.0;
float trailAlpha = 100.0;
float waveScale = 2.5;
int adsrState = 0;
int adsrTimer = 0;
int pitchTranspose = 0;
int stageBgColor;
int stageFgColor;

void logToScreen(String msg, int type) {
    Textarea target = (type >= 1) ? cp5.get(Textarea.class, "alertsArea") : cp5.get(Textarea.class, "consoleArea");
    if (target != null) {
      String prefix = (type == 3) ? "[ERR] " : (type == 2) ? "[WARN] " : (type == 1) ? "[!] " : "[INFO] ";
      target.append(prefix + msg + "\n");
      target.scroll(1.0); // Always scroll to bottom
    }
    println((type==3?"[ERR] ":type==2?"[WARN] ":"[INFO] ") + msg);
  }

  float mtof(float note) {
    return 440.0 * pow(2.0, (note + (float)pitchTranspose - 69.0) / 12.0);
  }

  void midiInputDevice(int n) {
    String[] inputs = MidiBus.availableInputs();
    if (n >= 0 && n < inputs.length) {
      myBus.clearInputs();
      myBus.addInput(n);
      logToScreen("MIDI Connected: " + inputs[n], 1);
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
      // Refresh UI state and alignment
      sl.getCaptionLabel().align(ControlP5.LEFT, ControlP5.CENTER).setPaddingX(10);
      logToScreen("MIDI Scanned: " + inputs.length + " devices found.", 1);
      if (inputs.length <= 1) {
        logToScreen("Tip: If device not found, try plugging it in BEFORE starting.", 2);
      }
    }
  }

  void keyPressed() {
    int p = -1;
    if (key == 'q' || key == 'Q') p = 60; // C4
    else if (key == '2') p = 61;
    else if (key == 'w' || key == 'W') p = 62;
    else if (key == '3') p = 63;
    else if (key == 'e' || key == 'E') p = 64;
    else if (key == 'r' || key == 'R') p = 65;
    else if (key == '5') p = 66;
    else if (key == 't' || key == 'T') p = 67;
    else if (key == '6') p = 68;
    else if (key == 'y' || key == 'Y') p = 69;
    else if (key == '7') p = 70;
    else if (key == 'u' || key == 'U') p = 71;
    else if (key == 'i' || key == 'I') p = 72; // C5
    else if (key == '9') p = 73;
    else if (key == 'o' || key == 'O') p = 74;
    else if (key == '0') p = 75;
    else if (key == 'p' || key == 'P') p = 76;
    else if (key == '[') p = 77;
    else if (key == ']') p = 79; 
    else if (key == (char)92) p = 81;

    if (p != -1) {
      if (!activeNotes.containsKey(p)) {
        float frequency = mtof((float)p);
        // Using TRIANGLE wave for better audibility on low notes
        Oscil wave = new Oscil(frequency, 0.6f, Waves.TRIANGLE);
        ADSR adsr = new ADSR(1.0, adsrA, adsrD, adsrS, adsrR);
        wave.patch(adsr).patch(out);
        adsr.noteOn();
        activeNotes.put(p, adsr);
        adsrTimer = millis(); adsrState = 1;
        logToScreen("Keyboard ON: MIDI " + p + " (" + nf(frequency, 0, 1) + " Hz)", 0);
      }
    }

    // Transposition Controls
    if (key == CODED) {
      if (keyCode == UP) { pitchTranspose += 12; logToScreen("Octave UP: " + (pitchTranspose/12), 1); }
      else if (keyCode == DOWN) { pitchTranspose -= 12; logToScreen("Octave DOWN: " + (pitchTranspose/12), 1); }
    } else if (key == '=' || key == '+') { pitchTranspose += 1; logToScreen("Transpose: " + pitchTranspose, 1); }
    else if (key == '-') { pitchTranspose -= 1; logToScreen("Transpose: " + pitchTranspose, 1); }
    else if (key == BACKSPACE) { pitchTranspose = 0; logToScreen("Transpose Reset", 1); }
    
    if (p != -1 || key == CODED || key == '+' || key == '-' || key == BACKSPACE) {
       println("Key: " + key + " p: " + p + " Trans: " + pitchTranspose);
    }
  }

  void keyReleased() {
    int p = -1;
    if (key == 'q' || key == 'Q') p = 60;
    else if (key == '2') p = 61;
    else if (key == 'w' || key == 'W') p = 62;
    else if (key == '3') p = 63;
    else if (key == 'e' || key == 'E') p = 64;
    else if (key == 'r' || key == 'R') p = 65;
    else if (key == '5') p = 66;
    else if (key == 't' || key == 'T') p = 67;
    else if (key == '6') p = 68;
    else if (key == 'y' || key == 'Y') p = 69;
    else if (key == '7') p = 70;
    else if (key == 'u' || key == 'U') p = 71;
    else if (key == 'i' || key == 'I') p = 72;
    else if (key == '9') p = 73;
    else if (key == 'o' || key == 'O') p = 74;
    else if (key == '0') p = 75;
    else if (key == 'p' || key == 'P') p = 76;
    else if (key == '[') p = 77;
    else if (key == ']') p = 79;
    else if (key == (char)92) p = 81;

    if (p != -1) {
      ADSR adsr = activeNotes.get(p);
      if (adsr != null) {
        adsr.unpatchAfterRelease(out);
        adsr.noteOff();
        activeNotes.remove(p);
        adsrTimer = millis(); adsrState = 2;
        logToScreen("Keyboard OFF: MIDI " + p, 0);
      }
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
  cp5.addButton("scanMidi")
     .setPosition(990, 430)
     .setSize(50, 30)
     .setCaptionLabel("SCAN")
     .getCaptionLabel().toUpperCase(false).getStyle().setMarginTop(4);
  logToScreen("System Initialized.", 0);
    stageBgColor = color(255, 0, 0);
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
      for(int i = 0; i < out.bufferSize() - 1; i++) {
        float x1 = map(i, 0, out.bufferSize(), 0, viewW);
        float x2 = map(i+1, 0, out.bufferSize(), 0, viewW);
        line(x1, 400/2 + out.mix.get(i) * waveScale * 100, x2, 400/2 + out.mix.get(i+1) * waveScale * 100);
      }
      stroke(50); line(viewW, 0, viewW, 400); stroke(stageFgColor);
      popMatrix();
      currentX += viewW;
    }
    if (showADSR) {
      pushMatrix();
      translate(currentX, 0);
      float totalTime = adsrA + adsrD + adsrR + 0.5;
      float xA = map(adsrA, 0, totalTime, 0, viewW);
      float xD = map(adsrA + adsrD, 0, totalTime, 0, viewW);
      float xS = map(adsrA + adsrD + 0.5, 0, totalTime, 0, viewW);
      float xR = map(totalTime, 0, totalTime, 0, viewW);
      float yPeak = 400 * 0.2;
      float ySus = 400 - (adsrS * 400 * 0.8);
      float yBase = 400 * 0.9;
      stroke(stageFgColor);
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
          // Pulsing Sustain: move between xD and xS
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
      
      // Glow Layers (Neon Effect)
      if (adsrState > 0) {
        noStroke();
        for(int j=8; j>0; j--) {
          fill(stageFgColor, 15); ellipse(dotX, dotY, j*5, j*5);
        }
        fill(255); ellipse(dotX, dotY, 8, 8);
      }
      
      stroke(50); line(viewW, 0, viewW, 400); 
      popMatrix();
      currentX += viewW;
    }
    if (showSpec) {
      pushMatrix();
      translate(currentX, 0);
      stroke(stageFgColor); // Fix color
      fft.forward(out.mix);
      for(int i = 0; i < fft.specSize(); i++) {
        float x = map(i, 0, fft.specSize(), 0, viewW);
        float y = map(fft.getBand(i), 0, 50, 400, 400*0.2);
        line(x, 400, x, y);
      }
      popMatrix();
    }
  }
  Textarea areaAlerts = cp5.get(Textarea.class, "alertsArea");
  Textarea areaConsole = cp5.get(Textarea.class, "consoleArea");
  if (areaAlerts != null && areaConsole != null) {
    if (showLog) {
      areaAlerts.show();
      areaConsole.show();
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
    }
  }
}