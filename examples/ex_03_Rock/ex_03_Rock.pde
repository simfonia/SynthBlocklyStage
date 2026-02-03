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
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import processing.serial.*;
import themidibus.*;

AudioOutput out;
ControlP5 cp5;
FFT fft;
HashMap<Integer, ADSR> activeNotes = new HashMap<Integer, ADSR>();
HashMap<String, Gain> samplerGainMap = new HashMap<String, Gain>();
HashMap<String, List<SynthComponent>> additiveConfigs = new HashMap<String, List<SynthComponent>>();
HashMap<String, Sampler> samplerMap = new HashMap<String, Sampler>();
HashMap<String, String[]> chords = new HashMap<String, String[]>();
HashMap<String, float[]> harmonicPartials = new HashMap<String, float[]>();
HashSet<Integer> pcKeysHeld = new HashSet<Integer>();
LinkedHashMap<String, String> instrumentMap = new LinkedHashMap<String, String>();
LinkedHashMap<String, float[]> instrumentADSR = new LinkedHashMap<String, float[]>();
MidiBus myBus;
Minim minim;
Sampler currentSample;
Sampler kick;
Sampler snare;
Serial myPort;
String currentInstrument = "default";
String lastInstrument = "";
boolean isMidiMode = false;
boolean showADSR = true;
boolean showLog = true;
boolean showSpec = true;
boolean showWave = true;
final Object melodyLock = new Object();
float adsrA = 0.01;
float adsrD = 0.1;
float adsrR = 0.5;
float adsrS = 0.5;
float bpm = 120.0;
float defAdsrA = 0.01;
float defAdsrD = 0.1;
float defAdsrR = 0.5;
float defAdsrS = 0.5;
float fgHue = 119.0;
float masterGain = -5.0;
float trailAlpha = 100.0;
float waveScale = 2.5;
int activeMelodyCount = 0;
int adsrState = 0;
int adsrTimer = 0;
int serialBaud = 115200;
int stageBgColor;
int stageFgColor;
volatile boolean isCountingIn = false;

int pitchTranspose = 0;

  class SynthComponent {
    String waveType; float ratio; float amp;
    SynthComponent(String w, float r, float a) { waveType = w; ratio = r; amp = a; }
  }

  float mtof(float note) {
    return 440.0f * (float)Math.pow(2.0, (double)((note + (float)pitchTranspose - 69.0f) / 12.0f));
  }

  int noteToMidi(String note) {
    String n = note.toUpperCase();
    if (n.equals("R")) return -1;
    int octave = 4;
    if (n.length() > 1 && Character.isDigit(n.charAt(n.length()-1))) {
      octave = Character.getNumericValue(n.charAt(n.length()-1));
      n = n.substring(0, n.length()-1);
    }
    int pc = 0;
    if (n.startsWith("C")) pc = 0;
    else if (n.startsWith("D")) pc = 2;
    else if (n.startsWith("E")) pc = 4;
    else if (n.startsWith("F")) pc = 5;
    else if (n.startsWith("G")) pc = 7;
    else if (n.startsWith("A")) pc = 9;
    else if (n.startsWith("B")) pc = 11;
    if (n.contains("#") || n.contains("S")) pc++;
    if (n.contains("B") && n.length() > 1 && !n.equals("B")) pc--;
    return (octave + 1) * 12 + pc;
  }

  Wavetable getWaveform(String type) {
    if (type.equals("SINE")) return Waves.SINE;
    if (type.equals("SQUARE")) return Waves.SQUARE;
    if (type.equals("SAW")) return Waves.SAW;
    return Waves.TRIANGLE;
  }

  void playNoteInternal(int p, float vel) {
    if (p < 0) return;
    if (activeNotes.containsKey(p)) stopNoteInternal(p);
    
    float masterAmp = map(vel, 0, 127, 0, 0.6f);
    float baseFreq = mtof((float)p);
    
    // Use LIVE values from UI Sliders for active performance
    ADSR adsr = new ADSR(1.0, adsrA, adsrD, adsrS, adsrR);
    
    Summer mixer = new Summer(); 
    String type = instrumentMap.getOrDefault(currentInstrument, "TRIANGLE");
    
    if (type.equals("HARMONIC")) {
      float[] partials = harmonicPartials.get(currentInstrument);
      if (partials != null) {
        for (int i = 0; i < partials.length; i++) {
          if (partials[i] > 0) {
            Oscil osc = new Oscil(baseFreq * (i + 1), partials[i] * masterAmp, Waves.SINE);
            osc.patch(mixer);
          }
        }
      }
      mixer.patch(adsr);
    } else if (type.equals("ADDITIVE")) {
      List<SynthComponent> configs = additiveConfigs.get(currentInstrument);
      if (configs != null) {
        for (SynthComponent comp : configs) {
          Oscil osc = new Oscil(baseFreq * comp.ratio, comp.amp * masterAmp, getWaveform(comp.waveType));
          osc.patch(mixer);
        }
      }
      mixer.patch(adsr);
    } else {
      Oscil wave = new Oscil(baseFreq, masterAmp, getWaveform(type));
      wave.patch(adsr);
    }
    
    adsr.patch(out);
    adsr.noteOn();
    activeNotes.put(p, adsr);
    adsrTimer = millis(); adsrState = 1;
  }

  void stopNoteInternal(int p) {
    ADSR adsr = activeNotes.get(p);
    if (adsr != null) {
      adsr.unpatchAfterRelease(out);
      adsr.noteOff();
      activeNotes.remove(p);
      adsrTimer = millis(); adsrState = 2;
    }
  }

  void updateInstrumentUISync() {
    if (!currentInstrument.equals(lastInstrument)) {
      // 1. Save manual adjustments of the OLD instrument before switching
      if (!lastInstrument.equals("")) {
        instrumentADSR.put(lastInstrument, new float[]{adsrA, adsrD, adsrS, adsrR});
      }

      // 2. Load settings for the NEW instrument
      float[] params = instrumentADSR.get(currentInstrument);
      if (params == null) {
        params = new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR};
      }
      
      adsrA = params[0]; adsrD = params[1]; adsrS = params[2]; adsrR = params[3];
      
      if (cp5 != null) {
        if (cp5.getController("adsrA") != null) cp5.getController("adsrA").setValue(adsrA);
        if (cp5.getController("adsrD") != null) cp5.getController("adsrD").setValue(adsrD);
        if (cp5.getController("adsrS") != null) cp5.getController("adsrS").setValue(adsrS);
        if (cp5.getController("adsrR") != null) cp5.getController("adsrR").setValue(adsrR);
      }
      logToScreen("Instrument Switched: " + currentInstrument, 1);
      lastInstrument = currentInstrument;
    }
  }

  void playNoteForDuration(int p, float vel, final float durationMs) {
    if (p < 0) return;
    playNoteInternal(p, vel);
    final int pitch = p;
    new Thread(new Runnable() {
      public void run() {
        try { Thread.sleep((long)durationMs); } catch (Exception e) {}
        stopNoteInternal(pitch);
      }
    }).start();
  }

  void playChordByNameInternal(String name, float durationMs, float vel) {
    String[] notes = chords.get(name);
    if (notes != null) {
      for (String n : notes) {
        int midi = noteToMidi(n);
        if (midi >= 0) playNoteForDuration(midi, vel, durationMs);
      }
    }
  }

  class MelodyPlayer extends Thread {
    String melody; String inst;
    MelodyPlayer(String m, String i) { melody = m; inst = i; }
    public void run() {
      try { Thread.sleep(200); } catch(Exception e) {} // Wait for UI
      synchronized(melodyLock) {
        activeMelodyCount++;
        String[] tokens = splitTokens(melody, ", \t\n\r");
        for (String t : tokens) {
          parseAndPlayNote(inst, t, 100);
        }
        activeMelodyCount--;
      }
    }
  }

  void playMelodyInternal(String m, String i) {
    new MelodyPlayer(m, i).start();
  }

  void parseAndPlayNote(String name, String token, float vel) {
    token = token.trim(); if (token.length() < 2) return;
    activeMelodyCount++;
    float totalMs = 0;
    String noteName = "";
    String[] parts = token.split("\\+");
    for (int j = 0; j < parts.length; j++) {
      String p = parts[j].trim();
      if (p.length() == 0) continue;
      float multiplier = 1.0f;
      if (p.endsWith(".")) { multiplier = 1.5f; p = p.substring(0, p.length() - 1); }
      else if (p.endsWith("_T")) { multiplier = 2.0f / 3.0f; p = p.substring(0, p.length() - 2); }
      char durChar = p.charAt(p.length() - 1);
      String prefix = p.substring(0, p.length() - 1);
      if (j == 0) noteName = prefix;
      float baseMs = 0;
      if (durChar == 'W') baseMs = (60000.0f / bpm) * 4.0f;
      else if (durChar == 'H') baseMs = (60000.0f / bpm) * 2.0f;
      else if (durChar == 'Q') baseMs = (60000.0f / bpm);
      else if (durChar == 'E') baseMs = (60000.0f / bpm) / 2.0f;
      else if (durChar == 'S') baseMs = (60000.0f / bpm) / 4.0f;
      totalMs += (baseMs * multiplier);
    }
    
    if (noteName.length() > 0) {
      String type = instrumentMap.getOrDefault(name, "DRUM");
      if (type.equals("DRUM")) {
        if (!noteName.equalsIgnoreCase("R") && samplerMap.containsKey(name)) {
          samplerGainMap.get(name).setValue(map(vel, 0, 127, -40, 0));
          samplerMap.get(name).trigger();
        }
      } else {
        String oldInst = currentInstrument;
        currentInstrument = name;
        if (!noteName.equalsIgnoreCase("R")) {
          if (chords.containsKey(noteName)) playChordByNameInternal(noteName, totalMs * 0.95f, vel);
          else { int midi = noteToMidi(noteName); if (midi >= 0) playNoteForDuration(midi, vel, totalMs * 0.95f); }
        }
        currentInstrument = oldInst;
      }
      try { Thread.sleep((long)totalMs); } catch(Exception e) {}
    }
    activeMelodyCount--;
  }

  float durationToMs(String iv) {
    float ms = 500;
    try {
      if (iv.endsWith("m")) {
        float count = iv.length() > 1 ? Float.parseFloat(iv.substring(0, iv.length()-1)) : 1.0f;
        ms = (60000/bpm) * 4 * count;
      } else if (iv.endsWith("n")) {
        float den = Float.parseFloat(iv.substring(0, iv.length()-1));
        ms = (60000/bpm) * (4.0f / den);
      }
    } catch(Exception e) {}
    return ms;
  }

  void playClick(float freq, float v) {
    if (out == null) return;
    float amp = map(v, 0, 127, 0, 0.8f);
    // Use SQUARE wave for a more sharp, percussive click
    Oscil wave = new Oscil(freq, amp, Waves.SQUARE);
    ADSR adsr = new ADSR(1.0, 0.001f, 0.02f, 0.0f, 0.02f);
    wave.patch(adsr).patch(out);
    adsr.noteOn();
    // Since this is called from the count-in thread, a short sleep here is safe and necessary
    try { Thread.sleep(50); } catch(Exception e) {} 
    adsr.noteOff();
    adsr.unpatchAfterRelease(out);
  }

void logToScreen(String msg, int type) {
    Textarea target = (type >= 1) ? cp5.get(Textarea.class, "alertsArea") : cp5.get(Textarea.class, "consoleArea");
    if (target != null) {
      String prefix = (type == 3) ? "[ERR] " : (type == 2) ? "[WARN] " : (type == 1) ? "[!] " : "[INFO] ";
      target.append(prefix + msg + "\n");
      target.scroll(1.0);
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
      for (int i = 0; i < inputs.length; i++) {
        sl.addItem(inputs[i], i);
      }
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
    if (key == CODED) {
      if (keyCode == UP) { pitchTranspose += 12; logToScreen("Octave UP", 1); }
      else if (keyCode == DOWN) { pitchTranspose -= 12; logToScreen("Octave DOWN", 1); }
      else if (keyCode == LEFT || keyCode == RIGHT) {
        Object[] names = instrumentMap.keySet().toArray();
        if (names.length > 0) {
          int idx = -1;
          for(int i=0; i<names.length; i++) { if(names[i].toString().equals(currentInstrument)) { idx = i; break; } }
          if (idx == -1) idx = 0; 
          else if (keyCode == RIGHT) idx = (idx + 1) % names.length;
          else idx = (idx - 1 + names.length) % names.length;
          currentInstrument = names[idx].toString();
        }
      }
    } else if (key == BACKSPACE) { pitchTranspose = 0; logToScreen("Transpose Reset", 1); }

    int p = -1;
    char k = Character.toLowerCase(key);
    if (k == 'q') p = 60; else if (k == '2') p = 61; else if (k == 'w') p = 62;
    else if (k == '3') p = 63; else if (k == 'e') p = 64; else if (k == 'r') p = 65;
    else if (k == '5') p = 66; else if (k == 't') p = 67; else if (k == '6') p = 68;
    else if (k == 'y') p = 69; else if (k == '7') p = 70; else if (k == 'u') p = 71;
    else if (k == 'i') p = 72; else if (k == '9') p = 73; else if (k == 'o') p = 74;
    else if (k == '0') p = 75; else if (k == 'p') p = 76;

    if (p != -1) {
      if (!pcKeysHeld.contains(p)) {
        playNoteInternal(p, 100);
        pcKeysHeld.add(p);
        logToScreen("Keyboard ON: MIDI " + p, 0);
      }
    }
    
  }

  void keyReleased() {
    int p = -1;
    char k = Character.toLowerCase(key);
    if (k == 'q') p = 60; else if (k == '2') p = 61; else if (k == 'w') p = 62;
    else if (k == '3') p = 63; else if (k == 'e') p = 64; else if (k == 'r') p = 65;
    else if (k == '5') p = 66; else if (k == 't') p = 67; else if (k == '6') p = 68;
    else if (k == 'y') p = 69; else if (k == '7') p = 70; else if (k == 'u') p = 71;
    else if (k == 'i') p = 72; else if (k == '9') p = 73; else if (k == 'o') p = 74;
    else if (k == '0') p = 75; else if (k == 'p') p = 76;

    if (p != -1) {
      stopNoteInternal(p);
      pcKeysHeld.remove(p);
      logToScreen("Keyboard OFF: MIDI " + p, 0);
    }
    
  }

void setup() {
  if (!instrumentMap.containsKey("Kick")) instrumentMap.put("Kick", "TRIANGLE");
  if (!instrumentADSR.containsKey("Kick")) instrumentADSR.put("Kick", new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR});
    if (minim == null) { minim = new Minim(this); out = minim.getLineOut(); }
    samplerMap.put("Kick", new Sampler("drum/kick.wav", 4, minim));
    samplerGainMap.put("Kick", new Gain(0.f));
    samplerMap.get("Kick").patch(samplerGainMap.get("Kick")).patch(out);
    instrumentMap.put("Kick", "DRUM");
    instrumentADSR.put("Kick", new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR});
    if (!instrumentMap.containsKey("Snare")) instrumentMap.put("Snare", "TRIANGLE");
  if (!instrumentADSR.containsKey("Snare")) instrumentADSR.put("Snare", new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR});
    if (minim == null) { minim = new Minim(this); out = minim.getLineOut(); }
    samplerMap.put("Snare", new Sampler("drum/snare.wav", 4, minim));
    samplerGainMap.put("Snare", new Gain(0.f));
    samplerMap.get("Snare").patch(samplerGainMap.get("Snare")).patch(out);
    instrumentMap.put("Snare", "DRUM");
    instrumentADSR.put("Snare", new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR});
    if (!instrumentMap.containsKey("HiHat")) instrumentMap.put("HiHat", "TRIANGLE");
  if (!instrumentADSR.containsKey("HiHat")) instrumentADSR.put("HiHat", new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR});
    if (minim == null) { minim = new Minim(this); out = minim.getLineOut(); }
    samplerMap.put("HiHat", new Sampler("drum/ch.wav", 4, minim));
    samplerGainMap.put("HiHat", new Gain(0.f));
    samplerMap.get("HiHat").patch(samplerGainMap.get("HiHat")).patch(out);
    instrumentMap.put("HiHat", "DRUM");
    instrumentADSR.put("HiHat", new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR});
    if (!instrumentMap.containsKey("Synth")) instrumentMap.put("Synth", "TRIANGLE");
  if (!instrumentADSR.containsKey("Synth")) instrumentADSR.put("Synth", new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR});
    instrumentMap.put("Synth", "SAW");
    instrumentADSR.put("Synth", new float[]{(float)0.02, (float)0.1, (float)0.3, (float)0.4});
    minim = new Minim(this);
  out = minim.getLineOut();
  currentInstrument = "";
    size(1600, 600);
  pixelDensity(displayDensity());
  stageBgColor = color(0, 0, 0);
  stageFgColor = color(0, 255, 204);
  minim = new Minim(this);
  out = minim.getLineOut();
  fft = new FFT(out.bufferSize(), out.sampleRate());
  cp5 = new ControlP5(this);
  cp5.setFont(createFont("Arial", 16));
  MidiBus.list();
  myBus = new MidiBus(this, 0, -1);
  
    // --- Log Textareas ---
  cp5.addTextarea("alertsArea").setPosition(1200, 35).setSize(400, 265)
     .setFont(createFont("Arial", 18)).setLineHeight(22).setColor(color(255, 100, 100))
     .setColorBackground(color(40, 0, 0));
  cp5.addTextarea("consoleArea").setPosition(1200, 335)
     .setSize(400, 265).setFont(createFont("Arial", 18))
     .setLineHeight(22).setColor(color(200)).setColorBackground(color(20));
  
    // --- Control Panel UI ---
  cp5.addToggle("showWave").setPosition(20, 430).setSize(40, 20).setCaptionLabel("WAVE");
  cp5.addToggle("showADSR").setPosition(90, 430).setSize(40, 20).setCaptionLabel("ADSR");
  cp5.addToggle("showSpec").setPosition(160, 430).setSize(40, 20).setCaptionLabel("SPEC");
  cp5.addToggle("showLog").setPosition(230, 430).setSize(40, 20).setCaptionLabel("LOG");
  cp5.addSlider("trailAlpha").setPosition(20, 495).setSize(150, 15).setRange(0, 255).setCaptionLabel("TRAIL");
  cp5.addSlider("waveScale").setPosition(20, 525).setSize(150, 15).setRange(0.1, 10).setCaptionLabel("SCALE");
  cp5.addSlider("fgHue").setPosition(20, 555).setSize(150, 15).setRange(0, 255).setValue(119.0).setCaptionLabel("FG COLOR");
  cp5.addSlider("adsrA").setPosition(320, 485).setSize(15, 80).setRange(0, 2).setDecimalPrecision(2).setCaptionLabel("A");
  cp5.addSlider("adsrD").setPosition(380, 485).setSize(15, 80).setRange(0, 1).setDecimalPrecision(2).setCaptionLabel("D");
  cp5.addSlider("adsrS").setPosition(440, 485).setSize(15, 80).setRange(0, 1).setDecimalPrecision(2).setCaptionLabel("S");
  cp5.addSlider("adsrR").setPosition(500, 485).setSize(15, 80).setRange(0, 2).setDecimalPrecision(2).setCaptionLabel("R");
  cp5.addSlider("masterGain").setPosition(560, 485).setSize(15, 80).setRange(-40, 15).setCaptionLabel("GAIN");
  String[] startInputs = MidiBus.availableInputs();
  println("--- MIDI Devices ---");
  for(String s : startInputs) println("  > " + s);
  ScrollableList sl = cp5.addScrollableList("midiInputDevice").setPosition(660, 430).setSize(300, 150).setBarHeight(30).setItemHeight(25).setCaptionLabel("MIDI DEVICE");
  for (int i = 0; i < startInputs.length; i++) { sl.addItem(startInputs[i], i); }
  if (startInputs.length > 0) sl.setValue(0);
  sl.close();
  String[] serialPorts = Serial.list();
  ScrollableList ssl = cp5.addScrollableList("serialInputDevice").setPosition(660, 470).setSize(300, 150).setBarHeight(30).setItemHeight(25).setCaptionLabel("SERIAL PORT");
  for (int i = 0; i < serialPorts.length; i++) { ssl.addItem(serialPorts[i], i); }
  ssl.close();
  cp5.addButton("scanMidi").setPosition(970, 430).setSize(50, 30).setCaptionLabel("SCAN");
  cp5.addButton("copyLogs").setPosition(1405, 5).setSize(90, 25).setCaptionLabel("COPY LOG");
  cp5.addButton("clearLogs").setPosition(1500, 5).setSize(90, 25).setCaptionLabel("CLEAR LOG");
  logToScreen("System Initialized.", 0);
    isCountingIn = true;
    new Thread(new Runnable() {
      public void run() {
        try {
          Thread.sleep(1000); 
          logToScreen("--- COUNT IN START ---", 1);
          for (int m=0; m<1; m++) {
            for (int b=0; b<4; b++) {
              playClick((b==0 ? 880.0f : 440.0f), (float)100);
              Thread.sleep((long)(60000.0f/bpm));
            }
          }
        } catch (Exception e) {
        } finally {
          isCountingIn = false;
          logToScreen("--- PLAY ---", 1);
        }
      }
    }).start();
    currentInstrument = "Synth";
    bpm = (float)95;
    new Thread(new Runnable() {
      public void run() {
        activeMelodyCount++;
        try { Thread.sleep(200); } catch(Exception e) {}
        int timeout = 0;
        while(isCountingIn && timeout < 500) { try { Thread.sleep(10); timeout++; } catch(Exception e) {} }
        while (true) {
          float ms = 2000;
          String iv = "1m";
          try {
            if (iv.endsWith("m")) {
              float count = iv.length() > 1 ? Float.parseFloat(iv.substring(0, iv.length()-1)) : 1.0f;
              ms = (60000/bpm) * 4 * count;
            } else if (iv.endsWith("n")) {
              float den = Float.parseFloat(iv.substring(0, iv.length()-1));
              ms = (60000/bpm) * (4.0f / den);
            }
          } catch(Exception e) { ms = (60000/bpm) * 4; }
          
            new Thread(new Runnable() {
              public void run() {
                int timeout = 0;
                while(isCountingIn && timeout < 500) { try { Thread.sleep(10); timeout++; } catch(Exception e) {} }
                try { Thread.sleep((long)(((1-1) * 4 * 60000) / bpm)); } catch(Exception e) {}
                String rawPattern = "x--- .... x--- ....";
                String[] steps;
                if (rawPattern.contains(",")) {
                  steps = rawPattern.split(",");
                } else {
                  String p = rawPattern.replace("|", "").replace(" ", "");
                  steps = new String[p.length()];
                  for(int i=0; i<p.length(); i++) steps[i] = String.valueOf(p.charAt(i));
                }
                float stepMs = (60000 / bpm) / 4;
                for (int i=0; i<Math.min(steps.length, 16); i++) {
                  String token = steps[i].trim();
                  if (token.equals(".")) {
                    try { Thread.sleep((long)stepMs); } catch(Exception e) {}
                    continue;
                  }
                  int sustainSteps = 1;
                  for (int j=i+1; j<Math.min(steps.length, 16); j++) {
                    String nextToken = steps[j].trim();
                    if (nextToken.equals("-")) sustainSteps++;
                    else break;
                  }
                  float noteDur = stepMs * sustainSteps;
                  if (!token.equals("-")) {
                    if (instrumentMap.getOrDefault("Kick", "").equals("DRUM")) {
                      if (token.equalsIgnoreCase("x")) {
                         samplerGainMap.get("Kick").setValue(map(110, 0, 127, -40, 0));
                         samplerMap.get("Kick").trigger();
                      }
                    } else {
                      String oldInst = currentInstrument;
                      currentInstrument = "Kick";
                      if (false) {
                        if (token.equals("x")) token = "C";
                        if (chords.containsKey(token)) playChordByNameInternal(token, noteDur * 0.9f, (float)110);
                        else { int midi = noteToMidi(token); if (midi >= 0) playNoteForDuration(midi, (float)110, noteDur * 0.9f); }
                      } else {
                        if (token.equalsIgnoreCase("x")) playNoteForDuration(60, (float)110, noteDur * 0.8f);
                        else { int midi = noteToMidi(token); if (midi >= 0) playNoteForDuration(midi, (float)110, noteDur * 0.9f); }
                      }
                      currentInstrument = oldInst;
                    }
                  }
                  try { Thread.sleep((long)stepMs); } catch(Exception e) {}
                }
              }
            }).start();
            new Thread(new Runnable() {
              public void run() {
                int timeout = 0;
                while(isCountingIn && timeout < 500) { try { Thread.sleep(10); timeout++; } catch(Exception e) {} }
                try { Thread.sleep((long)(((1-1) * 4 * 60000) / bpm)); } catch(Exception e) {}
                String rawPattern = ".... x--- .... x---";
                String[] steps;
                if (rawPattern.contains(",")) {
                  steps = rawPattern.split(",");
                } else {
                  String p = rawPattern.replace("|", "").replace(" ", "");
                  steps = new String[p.length()];
                  for(int i=0; i<p.length(); i++) steps[i] = String.valueOf(p.charAt(i));
                }
                float stepMs = (60000 / bpm) / 4;
                for (int i=0; i<Math.min(steps.length, 16); i++) {
                  String token = steps[i].trim();
                  if (token.equals(".")) {
                    try { Thread.sleep((long)stepMs); } catch(Exception e) {}
                    continue;
                  }
                  int sustainSteps = 1;
                  for (int j=i+1; j<Math.min(steps.length, 16); j++) {
                    String nextToken = steps[j].trim();
                    if (nextToken.equals("-")) sustainSteps++;
                    else break;
                  }
                  float noteDur = stepMs * sustainSteps;
                  if (!token.equals("-")) {
                    if (instrumentMap.getOrDefault("Snare", "").equals("DRUM")) {
                      if (token.equalsIgnoreCase("x")) {
                         samplerGainMap.get("Snare").setValue(map(100, 0, 127, -40, 0));
                         samplerMap.get("Snare").trigger();
                      }
                    } else {
                      String oldInst = currentInstrument;
                      currentInstrument = "Snare";
                      if (false) {
                        if (token.equals("x")) token = "C";
                        if (chords.containsKey(token)) playChordByNameInternal(token, noteDur * 0.9f, (float)100);
                        else { int midi = noteToMidi(token); if (midi >= 0) playNoteForDuration(midi, (float)100, noteDur * 0.9f); }
                      } else {
                        if (token.equalsIgnoreCase("x")) playNoteForDuration(60, (float)100, noteDur * 0.8f);
                        else { int midi = noteToMidi(token); if (midi >= 0) playNoteForDuration(midi, (float)100, noteDur * 0.9f); }
                      }
                      currentInstrument = oldInst;
                    }
                  }
                  try { Thread.sleep((long)stepMs); } catch(Exception e) {}
                }
              }
            }).start();
            new Thread(new Runnable() {
              public void run() {
                int timeout = 0;
                while(isCountingIn && timeout < 500) { try { Thread.sleep(10); timeout++; } catch(Exception e) {} }
                try { Thread.sleep((long)(((1-1) * 4 * 60000) / bpm)); } catch(Exception e) {}
                String rawPattern = "x-x- x-x- x-x- x-x-";
                String[] steps;
                if (rawPattern.contains(",")) {
                  steps = rawPattern.split(",");
                } else {
                  String p = rawPattern.replace("|", "").replace(" ", "");
                  steps = new String[p.length()];
                  for(int i=0; i<p.length(); i++) steps[i] = String.valueOf(p.charAt(i));
                }
                float stepMs = (60000 / bpm) / 4;
                for (int i=0; i<Math.min(steps.length, 16); i++) {
                  String token = steps[i].trim();
                  if (token.equals(".")) {
                    try { Thread.sleep((long)stepMs); } catch(Exception e) {}
                    continue;
                  }
                  int sustainSteps = 1;
                  for (int j=i+1; j<Math.min(steps.length, 16); j++) {
                    String nextToken = steps[j].trim();
                    if (nextToken.equals("-")) sustainSteps++;
                    else break;
                  }
                  float noteDur = stepMs * sustainSteps;
                  if (!token.equals("-")) {
                    if (instrumentMap.getOrDefault("HiHat", "").equals("DRUM")) {
                      if (token.equalsIgnoreCase("x")) {
                         samplerGainMap.get("HiHat").setValue(map(50, 0, 127, -40, 0));
                         samplerMap.get("HiHat").trigger();
                      }
                    } else {
                      String oldInst = currentInstrument;
                      currentInstrument = "HiHat";
                      if (false) {
                        if (token.equals("x")) token = "C";
                        if (chords.containsKey(token)) playChordByNameInternal(token, noteDur * 0.9f, (float)50);
                        else { int midi = noteToMidi(token); if (midi >= 0) playNoteForDuration(midi, (float)50, noteDur * 0.9f); }
                      } else {
                        if (token.equalsIgnoreCase("x")) playNoteForDuration(60, (float)50, noteDur * 0.8f);
                        else { int midi = noteToMidi(token); if (midi >= 0) playNoteForDuration(midi, (float)50, noteDur * 0.9f); }
                      }
                      currentInstrument = oldInst;
                    }
                  }
                  try { Thread.sleep((long)stepMs); } catch(Exception e) {}
                }
              }
            }).start();
          
          try { Thread.sleep((long)ms); } catch (Exception e) {}
        }
      }
    }).start();
}


void draw() {
  pushStyle(); colorMode(HSB, 255); stageFgColor = color(fgHue, 255, 255); popStyle();
  out.setGain(masterGain); noStroke(); fill(30); rect(0, 400, width, 200);
  // Draw rainbow bar behind fgHue slider
  pushStyle(); for (int i = 0; i < 150; i++) { colorMode(HSB, 150); stroke(i, 150, 150); line(20 + i, 572, 20 + i, 575); } popStyle();
  colorMode(RGB, 255); float currentVisualW = showLog ? 1200.0 : width;
  noStroke(); fill(stageBgColor, 255 - trailAlpha); rect(0, 0, currentVisualW, 400);
  int activeViews = int(showWave) + int(showADSR) + int(showSpec);
  if (activeViews > 0) {
    float viewW = currentVisualW / float(activeViews); float currentX = 0;
    stroke(stageFgColor); strokeWeight(2); noFill();
    if (showWave) {
      pushMatrix(); translate(currentX, 0); stroke(stageFgColor);
      for(int i = 0; i < out.bufferSize() - 1; i++) {
        float x1 = map(i, 0, out.bufferSize(), 0, viewW);
        float x2 = map(i+1, 0, out.bufferSize(), 0, viewW);
        line(x1, 400/2 + out.mix.get(i) * waveScale * 100, x2, 400/2 + out.mix.get(i+1) * waveScale * 100);
      }
      stroke(50); line(viewW, 0, viewW, 400);
      popMatrix(); currentX += viewW;
    }
    if (showADSR) {
      pushMatrix(); translate(currentX, 0); pushStyle(); colorMode(HSB, 255); stroke(color((fgHue + 40)%255, 200, 255));
      float visT = 4.0; float xA = map(adsrA, 0, visT, 0, viewW); float xD = map(adsrA+adsrD, 0, visT, 0, viewW);
      float xS = map(adsrA+adsrD+1.0, 0, visT, 0, viewW); float xR = map(adsrA+adsrD+1.0+adsrR, 0, visT, 0, viewW);
      float yB = 400 * 0.9; float yS = yB - (adsrS * 400 * 0.7);
      float yP = (adsrD > 0 || adsrS < 1.0) ? 400 * 0.2 : yS;
      beginShape(); vertex(0, yB); vertex(xA, yP); vertex(xD, yS); vertex(xS, yS); vertex(xR, yB); endShape();
      float dX = 0; float dY = yB;
      if (adsrState == 1) {
        float e = (millis()-adsrTimer)/1000.0;
        if (e < adsrA) { dX = map(e, 0, adsrA, 0, xA); dY = map(e, 0, adsrA, yB, yP); }
        else if (e < adsrA+adsrD) { dX = map(e, adsrA, adsrA+adsrD, xA, xD); dY = map(e, adsrA, adsrA+adsrD, yP, yS); }
        else { dX = lerp(xD, xS, (sin(millis()*0.005)+1)/2.0); dY = yS; }
      } else if (adsrState == 2) {
        float re = (millis()-adsrTimer)/1000.0;
        if (re < adsrR) { dX = map(re, 0, adsrR, xS, xR); dY = map(re, 0, adsrR, yS, yB); }
        else { adsrState = 0; dX = xR; dY = yB; }
      }
      if (adsrState > 0) { fill(255); ellipse(dX, dY, 8, 8); }
      popStyle(); stroke(50); line(viewW, 0, viewW, 400); popMatrix(); currentX += viewW;
    }
    if (showSpec) {
      pushMatrix(); translate(currentX, 0); pushStyle(); colorMode(HSB, 255); fft.forward(out.mix);
      for(int i = 0; i < fft.specSize(); i++) {
        float x = map(i, 0, fft.specSize(), 0, viewW);
        float y = map(fft.getBand(i), 0, 50, 400, 400*0.2);
        stroke((fgHue + map(i, 0, fft.specSize(), 0, 80)) % 255, 200, 255);
        line(x, 400, x, y);
      }
      popStyle(); popMatrix();
    }
  }
  if (cp5.get(Textarea.class, "alertsArea") != null) {
    if (showLog) {
      cp5.get(Textarea.class, "alertsArea").show(); cp5.get(Textarea.class, "consoleArea").show();
      pushMatrix(); translate(1200, 0); float spH = height / 2.0;
      fill(40, 0, 0); rect(0, 0, 400, spH); fill(255, 100, 100); text("ALERTS", 10, 25);
      translate(0, spH); fill(20); rect(0, 0, 400, height-spH); fill(200); text("CONSOLE", 10, 25);
      popMatrix();
    } else {
      cp5.get(Textarea.class, "alertsArea").hide(); cp5.get(Textarea.class, "consoleArea").hide();
    }
  }
  updateInstrumentUISync();
}