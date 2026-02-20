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
import java.util.concurrent.*;
import processing.serial.*;
import themidibus.*;

AudioOutput out;
ConcurrentHashMap<Integer, String> midiKeysHeld = new ConcurrentHashMap<Integer, String>();
ConcurrentHashMap<String, ADSR> activeNotes = new ConcurrentHashMap<String, ADSR>();
ControlP5 cp5;
FFT fft;
Gain masterGainUGen;
HashMap instrumentAutoFilterLFOs = new HashMap();
HashMap instrumentAutoFilters = new HashMap();
HashMap instrumentBitCrushers = new HashMap();
HashMap instrumentCompressors = new HashMap();
HashMap instrumentDelays = new HashMap();
HashMap instrumentEffectEnds = new HashMap();
HashMap instrumentFilters = new HashMap();
HashMap instrumentFlangers = new HashMap();
HashMap instrumentLimiters = new HashMap();
HashMap instrumentMixConfigs = new HashMap();
HashMap instrumentMixers = new HashMap();
HashMap instrumentPans = new HashMap();
HashMap instrumentPitchModLFOs = new HashMap();
HashMap instrumentPitchMods = new HashMap();
HashMap instrumentReverbs = new HashMap();
HashMap instrumentWaveshapers = new HashMap();
HashMap<String, Float> instrumentVolumes = new HashMap<String, Float>();
HashMap<String, Gain> samplerGainMap = new HashMap<String, Gain>();
HashMap<String, List<SynthComponent>> additiveConfigs = new HashMap<String, List<SynthComponent>>();
HashMap<String, MelodicSampler> melodicSamplers = new HashMap<String, MelodicSampler>();
HashMap<String, MidiBus> midiBusses = new HashMap<String, MidiBus>();
HashMap<String, Sampler> samplerMap = new HashMap<String, Sampler>();
HashMap<String, String[]> chords = new HashMap<String, String[]>();
HashMap<String, float[]> harmonicPartials = new HashMap<String, float[]>();
LinkedHashMap<String, String> instrumentMap = new LinkedHashMap<String, String>();
LinkedHashMap<String, float[]> instrumentADSR = new LinkedHashMap<String, float[]>();
MidiBus myBus;
Minim minim;
SBSummer mainMixer;
Sampler currentSample;
Serial myPort;
String currentInstrument = "default";
String ha___1_4_7B_wE5_3p_7Bf1_ = "";
String lastInstrument = "";
UGen masterEffectEnd;
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
float fgHue = 230.0;
float masterGain = -5.0;
float trailAlpha = 100.0;
float waveScale = 2.5;
int activeMelodyCount = 0;
int adsrState = 0;
int adsrTimer = 0;
int pitchTranspose = 0;
int serialBaud = 115200;
int stageBgColor;
int stageFgColor;
java.util.concurrent.ConcurrentHashMap<Integer, String> pcKeysHeld = new java.util.concurrent.ConcurrentHashMap<Integer, String>();
long clippingTimer = 0;
volatile boolean isCountingIn = false;
volatile boolean isMasterClipping = false;

float floatVal(Object o) {
  if (o == null) return 0.0f;
  if (o instanceof Number) return ((Number)o).floatValue();
  try { return Float.parseFloat(o.toString()); }
  catch (Exception e) { return 0.0f; }
}
int getMidi(Object o) {
  if (o == null) return -1;
  if (o instanceof Number) return ((Number)o).intValue();
  String s = o.toString().trim();
  try { return (int)Float.parseFloat(s); } catch (Exception e) { return noteToMidi(s); }
}

class SBSummer extends ddf.minim.ugens.Summer {
    protected void uGenerate(float[] channels) { super.uGenerate(channels); }
  }

  class SBPan extends ddf.minim.ugens.Summer {
    float panPos = 0; // -1.0 to 1.0
    SBPan(float p) { super(); panPos = p; }
    void setLastValue(float val) { panPos = val; }
    protected void uGenerate(float[] channels) {
      super.uGenerate(channels);
      if (channels.length == 2) {
        float v = (channels[0] + channels[1]) * 0.5f; 
        channels[0] = v * Math.max(0, Math.min(1, 1.0f - panPos));
        channels[1] = v * Math.max(0, Math.min(1, 1.0f + panPos));
      }
    }
  }

  class SBWaveshaper extends SBSummer {
    float amount = 1.0f;
    SBWaveshaper() { super(); }
    void setAmount(float a) { amount = a; }
    protected void uGenerate(float[] channels) {
      super.uGenerate(channels);
      for(int i=0; i<channels.length; i++) {
        channels[i] = (float)Math.tanh(channels[i] * amount);
      }
    }
  }

  class SBReverb extends SBSummer {
    float roomSize = 0.5f; float damping = 0.5f; float wet = 0.3f;
    float[] c1, c2, c3, c4; int p1, p2, p3, p4;
    float[] a1, a2; int ap1, ap2;
    SBReverb() { 
      super(); 
      c1 = new float[1116]; c2 = new float[1188]; c3 = new float[1277]; c4 = new float[1356];
      a1 = new float[556]; a2 = new float[441];
    }
    void setParams(float rs, float d, float w) { roomSize = rs * 0.9f; damping = d * 0.4f; wet = w; }
    protected void uGenerate(float[] channels) {
      super.uGenerate(channels);
      for(int i=0; i<channels.length; i++) {
        float in = channels[i]; float out = 0;
        float o1 = c1[p1]; c1[p1] = in + o1 * roomSize; p1 = (p1+1)%c1.length;
        float o2 = c2[p2]; c2[p2] = in + o2 * roomSize; p2 = (p2+1)%c2.length;
        float o3 = c3[p3]; c3[p3] = in + o3 * roomSize; p3 = (p3+1)%c3.length;
        float o4 = c4[p4]; c4[p4] = in + o4 * roomSize; p4 = (p4+1)%c4.length;
        out = (o1 + o2 + o3 + o4) * 0.25f;
        float v1 = a1[ap1]; float tr1 = -0.5f * out + v1; a1[ap1] = out + 0.5f * v1; ap1 = (ap1+1)%a1.length; out = tr1;
        float v2 = a2[ap2]; float tr2 = -0.5f * out + v2; a2[ap2] = out + 0.5f * v2; ap2 = (ap2+1)%a2.length; out = tr2;
        channels[i] = channels[i] * (1.0f - wet) + out * wet;
      }
    }
  }

  class SBCompressor extends SBSummer {
    float threshold = 1.0f; float ratio = 1.0f; float attack = 0.01f; float release = 0.1f; float makeup = 1.0f; float env = 0.0f;
    private float attackCoef, releaseCoef;
    SBCompressor() { super(); setParams(-20, 1, 0.01f, 0.1f, 0); }
    void setParams(float tDB, float r, float a, float re, float mDB) {
      threshold = (float)Math.pow(10, tDB/20.0f); ratio = r; attack = a; release = re; makeup = (float)Math.pow(10, mDB/20.0f);
      attackCoef = (float)Math.exp(-1.0/(44100.0*attack));
      releaseCoef = (float)Math.exp(-1.0/(44100.0*release));
    }
    protected void uGenerate(float[] channels) {
      super.uGenerate(channels); 
      for(int i=0; i<channels.length; i++) {
        float absIn = Math.abs(channels[i]);
        env = (absIn > env) ? attackCoef * env + (1.0f - attackCoef) * absIn : releaseCoef * env + (1.0f - releaseCoef) * absIn;
        float gain = 1.0f;
        if (env > threshold) { gain = (threshold + (env - threshold) / ratio) / (env + 0.00001f); }
        channels[i] *= gain * makeup;
      }
    }
  }

  class MelodicSampler {
    TreeMap<Integer, Sampler> samples = new TreeMap<Integer, Sampler>();
    TreeMap<Integer, TickRate> rates = new TreeMap<Integer, TickRate>();
    TreeMap<Integer, ADSR> adsrs = new TreeMap<Integer, ADSR>();
    SBSummer localMixer = new SBSummer();
    Minim m; String instName;
    MelodicSampler(Minim minim, String name) { this.m = minim; this.instName = name; checkMainMixer(); localMixer.patch(getInstrumentMixer(instName)); }
    void loadSamples(String folder) {
      File dir = new File(dataPath(folder)); if (!dir.exists()) return;
      File[] files = dir.listFiles(); if (files == null) return;
      for (File f : files) {
        String fullName = f.getName(); String upperName = fullName.toUpperCase();
        if (upperName.endsWith(".MP3") || upperName.endsWith(".WAV")) {
          String noteName = fullName.substring(0, fullName.lastIndexOf('.'));
          int midi = noteToMidi(noteName);
          if (midi >= 0) {
            Sampler s = new Sampler(folder + "/" + fullName, 10, m); TickRate tr = new TickRate(1.f);
            ADSR a = new ADSR(1.0, 0.001f, 0.001f, 1.0f, 0.5f); tr.setInterpolation(true);
            s.patch(tr).patch(a).patch(localMixer); samples.put(midi, s); rates.put(midi, tr); adsrs.put(midi, a);
          }
        }
      }
    }
    ADSR trigger(int midi, float amp, float r) {
      if (samples.isEmpty()) return null;
      Integer closest = samples.floorKey(midi); if (closest == null) closest = samples.ceilingKey(midi);
      Sampler src = samples.get(closest); TickRate tr = rates.get(closest); ADSR a = adsrs.get(closest);
      if (src != null && tr != null && a != null) {
        float rate = (float)Math.pow(2.0, (midi - closest) / 12.0); tr.value.setLastValue(rate);
        a.setParameters(amp, 0.001f, 0.001f, 1.0f, r, 0, 0); a.noteOn(); src.trigger(); return a;
      }
      return null;
    }
  }

  void checkMainMixer() {
    if (minim == null) minim = new Minim(this);
    if (out == null) out = minim.getLineOut(Minim.STEREO); 
    if (mainMixer == null) {
      mainMixer = new SBSummer(); masterEffectEnd = mainMixer; masterGainUGen = new Gain(0.f);
      masterEffectEnd.patch(masterGainUGen).patch(out); getInstrumentMixer("default");
    }
  }

  ddf.minim.ugens.Summer getInstrumentMixer(String name) {
    checkMainMixer();
    if (instrumentMixers.containsKey(name)) return (ddf.minim.ugens.Summer)instrumentMixers.get(name);
    SBSummer s = new SBSummer(); SBPan p = new SBPan(0.f); s.patch(p); p.patch(mainMixer);
    instrumentMixers.put(name, s); instrumentPans.put(name, p); instrumentEffectEnds.put(name, s);
    return s;
  }

  void playBuiltinDrum(String type, float vel) {
    checkMainMixer(); String instName = "_builtin_" + type;
    if (!samplerMap.containsKey(instName)) {
      String path = "drum/";
      if (type.equals("KICK")) path += "kick.wav"; else if (type.equals("SNARE")) path += "snare.wav";
      else if (type.equals("CH")) path += "ch.wav"; else if (type.equals("OH")) path += "oh.wav";
      else if (type.equals("CLAP")) path += "clap.wav"; else return;
      Sampler s = new Sampler(path, 20, minim); Gain g = new Gain(0.f);
      s.patch(g).patch(getInstrumentMixer(instName));
      samplerMap.put(instName, s); samplerGainMap.put(instName, g); instrumentMap.put(instName, "DRUM");
    }
    Sampler s = samplerMap.get(instName); Gain g = samplerGainMap.get(instName);
    if (s != null && g != null) { g.setValue(map(vel, 0, 127, -40, 0)); s.trigger(); }
  }

  void updateFilter(String name, float freq, float q) {
    Object obj = instrumentFilters.get(name);
    if (obj != null) {
      try {
        java.lang.reflect.Field fField = obj.getClass().getField("frequency");
        Object freqControl = fField.get(obj); java.lang.reflect.Field valField = freqControl.getClass().getField("value");
        valField.setFloat(freqControl, freq);
        java.lang.reflect.Field rField = obj.getClass().getField("resonance");
        Object resControl = rField.get(obj); java.lang.reflect.Field rValField = resControl.getClass().getField("value");
        rValField.setFloat(resControl, constrain(q, 0.0f, 0.9f));
      } catch (Exception e) { try { obj.getClass().getMethod("setFreq", float.class).invoke(obj, freq); } catch(Exception ex) {} }
    }
  }

  void updatePanning(String name, float p) {
    Object obj = instrumentPans.get(name);
    if (obj != null) {
      try {
        java.lang.reflect.Field f = obj.getClass().getField("pan");
        Object control = f.get(obj); java.lang.reflect.Method m = control.getClass().getMethod("setLastValue", float.class);
        m.invoke(control, constrain(p, -1.0f, 1.0f));
      } catch (Exception e) {}
    }
  }

  void playNoteInternal(String instName, int p, float vel) {
    if (instName == null || instName.length() == 0) instName = currentInstrument;
    if (p < 0) return; String key = instName + "_" + p;
    if (activeNotes.containsKey(key)) stopNoteInternal(instName, p);
    float masterAmp = map(vel, 0, 127, 0, 0.5f); masterAmp *= instrumentVolumes.getOrDefault(instName, 1.0f);
    float[] adsr = instrumentADSR.get(instName);
    if (adsr == null) adsr = new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR};
    String type = instrumentMap.getOrDefault(instName, "TRIANGLE");
    if (type.equals("MELODIC_SAMPLER")) {
      MelodicSampler ms = melodicSamplers.get(instName);
      if (ms != null) {
        ADSR env = ms.trigger(p, masterAmp, adsr[3]);
        if (env != null) { activeNotes.put(key, env); if (instName.equals(currentInstrument) && !instName.equals("")) { adsrTimer = millis(); adsrState = 1; } }
      } return;
    }
    if (type.equals("DRUM")) {
      if (samplerMap.containsKey(instName)) {
        float volScale = instrumentVolumes.getOrDefault(instName, 1.0f);
        ((ddf.minim.ugens.Gain)samplerGainMap.get(instName)).setValue(map(vel * volScale, 0, 127, -40, 0));
        ((ddf.minim.ugens.Sampler)samplerMap.get(instName)).trigger();
      } return;
    }
    float baseFreq = mtof((float)p); ADSR env = new ADSR(1.0, adsr[0], adsr[1], adsr[2], adsr[3]);
    SBSummer noteMixer = new SBSummer(); 
    if (type.equals("HARMONIC")) {
      float[] partials = harmonicPartials.get(instName);
      if (partials != null) { for (int i = 0; i < partials.length; i++) { if (partials[i] > 0) { Oscil osc = new Oscil(baseFreq * (i + 1), partials[i] * masterAmp, Waves.SINE); osc.patch(noteMixer); } } }
      noteMixer.patch(env);
    } else if (type.equals("ADDITIVE")) {
      List<SynthComponent> configs = additiveConfigs.get(instName);
      if (configs != null) { for (SynthComponent comp : configs) { Oscil osc = new Oscil(baseFreq * comp.ratio, comp.amp * masterAmp, getWaveform(comp.waveType)); osc.patch(noteMixer); } }
      noteMixer.patch(env);
    } else if (type.equals("MIXED")) {
      String cfg = (String)instrumentMixConfigs.getOrDefault(instName, "SINE,WHITE,30,0,0,0");
      String[] parts = split(cfg, ",");
      if (parts.length >= 6) {
        String wType = parts[0]; String nType = parts[1]; float nRatio = float(parts[2]) / 100.0f; float jitter = float(parts[3]);
        float sRate = float(parts[4]); float sDepth = float(parts[5]) / 100.0f;
        Oscil wave = new Oscil(0, masterAmp * (1.0f - nRatio), getWaveform(wType));
        Summer freqSum = new SBSummer(); new Constant(baseFreq).patch(freqSum);
        if (jitter > 0) { new Noise(jitter * 2.0f, Noise.Tint.WHITE).patch(freqSum); }
        freqSum.patch(wave.frequency);
        Noise.Tint tint = nType.equals("PINK") ? Noise.Tint.PINK : nType.equals("BROWN") ? Noise.Tint.BROWN : Noise.Tint.WHITE;
        Noise n = new Noise(masterAmp * nRatio, tint); wave.patch(noteMixer); n.patch(noteMixer);
        if (sDepth > 0) {
          MoogFilter sweepF = new MoogFilter(0, 0.3f); Summer sweepSum = new SBSummer(); new Constant(baseFreq * 4.0f).patch(sweepSum);
          Oscil lfo = new Oscil(sRate, baseFreq * sDepth * 3.0f, Waves.SINE); lfo.patch(sweepSum).patch(sweepF.frequency);
          noteMixer.patch(sweepF).patch(env);
        } else noteMixer.patch(env);
      } else noteMixer.patch(env);
    } else { Oscil wave = new Oscil(baseFreq, masterAmp, getWaveform(type)); wave.patch(env); }
    env.patch(getInstrumentMixer(instName)); env.noteOn(); activeNotes.put(key, env);
    if (instName.equals(currentInstrument) && !instName.equals("")) { adsrTimer = millis(); adsrState = 1; }
  }

  void stopNoteInternal(String instName, int p) {
    if (instName == null || instName.length() == 0) instName = currentInstrument;
    String key = instName + "_" + p; ADSR adsr = activeNotes.get(key);
    if (adsr != null) {
      adsr.unpatchAfterRelease(getInstrumentMixer(instName)); adsr.noteOff(); activeNotes.remove(key);
      if (instName.equals(currentInstrument) && !instName.equals("")) { adsrTimer = millis(); adsrState = 2; }
    }
  }

  void updateInstrumentUISync() {
    if (!currentInstrument.equals(lastInstrument)) {
      if (!lastInstrument.equals("")) instrumentADSR.put(lastInstrument, new float[]{adsrA, adsrD, adsrS, adsrR});
      float[] params = instrumentADSR.get(currentInstrument);
      if (params == null) params = new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR};
      adsrA = params[0]; adsrD = params[1]; adsrS = params[2]; adsrR = params[3];
      if (cp5 != null) {
        if (cp5.getController("adsrA") != null) cp5.getController("adsrA").setValue(adsrA);
        if (cp5.getController("adsrD") != null) cp5.getController("adsrD").setValue(adsrD);
        if (cp5.getController("adsrS") != null) cp5.getController("adsrS").setValue(adsrS);
        if (cp5.getController("adsrR") != null) cp5.getController("adsrR").setValue(adsrR);
      }
      adsrState = 0; logToScreen("Instrument Switched: " + currentInstrument, 1); lastInstrument = currentInstrument;
    }
  }

  void playNoteForDuration(final String instName, int p, float vel, final float durationMs) {
    if (p < 0) return; playNoteInternal(instName, p, vel); final int pitch = p;
    new Thread(new Runnable() { public void run() { try { Thread.sleep((long)durationMs); } catch (Exception e) {} stopNoteInternal(instName, pitch); } }).start();
  }

  void playChordByNameInternal(String instName, String name, float durationMs, float vel) {
    if (instName == null || instName.length() == 0 || instName.equals("(請選擇樂器)")) instName = currentInstrument;
    String[] notes = chords.get(name);
    if (notes != null) { for (String n : notes) { int midi = noteToMidi(n); if (midi >= 0) playNoteForDuration(instName, midi, vel, durationMs); } }
    else logToScreen("Chord not found: " + name, 2);
  }

  void playMelodyInternal(String m, String i) { String[] tokens = splitTokens(m, ", \t\n\r"); for (String t : tokens) parseAndPlayNote(i, t, 100); }

  void parseAndPlayNote(String name, String token, float vel) {
    token = token.trim(); if (token.length() < 1) return; activeMelodyCount++; float totalMs = 0; String noteName = "";
    String[] parts = token.split("\\+");
    for (int j = 0; j < parts.length; j++) {
      String p = parts[j].trim(); if (p.length() == 0) continue; float multiplier = 1.0f;
      if (p.endsWith(".")) { multiplier = 1.5f; p = p.substring(0, p.length() - 1); }
      else if (p.endsWith("_T")) { multiplier = 2.0f / 3.0f; p = p.substring(0, p.length() - 2); }
      if (p.length() == 0) continue; char durChar = p.charAt(p.length() - 1); String prefix = p.substring(0, p.length() - 1);
      if (durChar != 'W' && durChar != 'H' && durChar != 'Q' && durChar != 'E' && durChar != 'S') { prefix = p; durChar = 'Q'; }
      if (j == 0) noteName = prefix; float baseMs = 0;
      if (durChar == 'W') baseMs = (60000.0f / bpm) * 4.0f; else if (durChar == 'H') baseMs = (60000.0f / bpm) * 2.0f;
      else if (durChar == 'Q') baseMs = (60000.0f / bpm); else if (durChar == 'E') baseMs = (60000.0f / bpm) / 2.0f;
      else if (durChar == 'S') baseMs = (60000.0f / bpm) / 4.0f; totalMs += (baseMs * multiplier);
    }
    if (noteName.length() > 0) {
      String type = instrumentMap.getOrDefault(name, "DRUM"); float volScale = instrumentVolumes.getOrDefault(name, 1.0f);
      if (type.equals("DRUM")) {
        if (!noteName.equalsIgnoreCase("R") && samplerMap.containsKey(name)) {
          ((ddf.minim.ugens.Gain)samplerGainMap.get(name)).setValue(map(vel * volScale, 0, 127, -40, 0));
          ((ddf.minim.ugens.Sampler)samplerMap.get(name)).trigger();
        }
      } else {
        if (!noteName.equalsIgnoreCase("R")) {
          if (chords.containsKey(noteName)) playChordByNameInternal(name, noteName, totalMs * 0.95f, vel);
          else { int midi = noteToMidi(noteName); if (midi >= 0) playNoteForDuration(name, midi, vel, totalMs * 0.95f); }
        }
      }
      try { Thread.sleep((long)totalMs); } catch(Exception e) {}
    }
    activeMelodyCount--;
  }

  float durationToMs(String iv) {
    float ms = 500; try {
      if (iv.endsWith("m")) { float count = iv.length() > 1 ? Float.parseFloat(iv.substring(0, iv.length()-1)) : 1.0f; ms = (60000/bpm) * 4 * count; }
      else if (iv.endsWith("n")) { float den = Float.parseFloat(iv.substring(0, iv.length()-1)); ms = (60000/bpm) * (4.0f / den); }
    } catch(Exception e) {} return ms;
  }

  void playClick(float freq, float v) {
    checkMainMixer(); if (out == null) return; float amp = map(v, 0, 127, 0, 1.0f);
    Oscil wave = new Oscil(freq, amp, Waves.TRIANGLE); ADSR adsr = new ADSR(1.0, 0.01f, 0.05f, 0.0f, 0.05f);
    wave.patch(adsr).patch(mainMixer); adsr.noteOn(); try { Thread.sleep(80); } catch(Exception e) {} 
    adsr.noteOff(); adsr.unpatchAfterRelease(mainMixer);
  }

void logToScreen(String msg, int type) {
    if (cp5 == null) { println("[Early Log] " + msg); return; }
    Textarea target = (type >= 1) ? cp5.get(Textarea.class, "alertsArea") : cp5.get(Textarea.class, "consoleArea");
    if (target != null) {
      String prefix = (type == 3) ? "[ERR] " : (type == 2) ? "[WARN] " : (type == 1) ? "[!] " : "[INFO] ";
      target.append(prefix + msg + "\n"); target.scroll(1.0);
    }
    println((type==3?"[ERR] ":type==2?"[WARN] ":"[INFO] ") + msg);
  }

  void midiInputDevice(int n) {
    if (myBus == null) return; String[] inputs = MidiBus.availableInputs();
    if (n >= 0 && n < inputs.length) { myBus.clearInputs(); myBus.addInput(n); logToScreen("MIDI Connected: " + inputs[n], 1); }
  }

  void serialInputDevice(int n) {
    String[] ports = Serial.list();
    if (n >= 0 && n < ports.length) {
      if (myPort != null) { myPort.stop(); }
      try { myPort = new Serial(this, ports[n], serialBaud); myPort.bufferUntil('\n'); logToScreen("Serial Connected: " + ports[n], 1); }
      catch (Exception e) { logToScreen("Serial Error: Port Busy or Unavailable", 3); }
    }
  }

  void scanMidi() {
    String[] inputs = MidiBus.availableInputs(); ScrollableList sl = cp5.get(ScrollableList.class, "midiInputDevice");
    if (sl != null) { sl.clear(); for (int i = 0; i < inputs.length; i++) { sl.addItem(inputs[i], i); } logToScreen("MIDI Scanned: " + inputs.length + " devices found.", 1); }
  }

  void copyLogs() {
    Textarea console = cp5.get(Textarea.class, "consoleArea"); Textarea alerts = cp5.get(Textarea.class, "alertsArea");
    String content = "--- ALERTS ---\n" + (alerts != null ? alerts.getText() : "") + "\n\n--- CONSOLE ---\n" + (console != null ? console.getText() : "");
    StringSelection selection = new StringSelection(content); Clipboard clipboard = Toolkit.getDefaultToolkit().getSystemClipboard();
    clipboard.setContents(selection, selection); logToScreen("Logs copied to clipboard.", 1);
  }

  void clearLogs() {
    Textarea console = cp5.get(Textarea.class, "consoleArea"); Textarea alerts = cp5.get(Textarea.class, "alertsArea");
    if (console != null) console.clear(); if (alerts != null) alerts.clear(); logToScreen("Logs cleared.", 1);
  }

  void keyPressed() {
    if (key == CODED) {
      if (keyCode == UP) { pitchTranspose += 12; logToScreen("Octave UP (Trans: " + (pitchTranspose > 0 ? "+" : "") + pitchTranspose + ")", 1); }
      else if (keyCode == DOWN) { pitchTranspose -= 12; logToScreen("Octave DOWN (Trans: " + (pitchTranspose > 0 ? "+" : "") + pitchTranspose + ")", 1); }
      else if (keyCode == LEFT || keyCode == RIGHT) {
        Object[] names = instrumentMap.keySet().toArray();
        if (names.length > 0) {
          int idx = -1; for(int i=0; i<names.length; i++) { if(names[i].toString().equals(currentInstrument)) { idx = i; break; } }
          if (idx == -1) idx = 0; else if (keyCode == RIGHT) idx = (idx + 1) % names.length; else idx = (idx - 1 + names.length) % names.length;
          currentInstrument = names[idx].toString();
        }
      }
    } else if (key == '=' || key == '+') { pitchTranspose += 1; logToScreen("Transpose: " + (pitchTranspose > 0 ? "+" : "") + pitchTranspose, 1); }
    else if (key == '-' || key == '_') { pitchTranspose -= 1; logToScreen("Transpose: " + (pitchTranspose > 0 ? "+" : "") + pitchTranspose, 1); }
    else if (key == BACKSPACE) { pitchTranspose = 0; logToScreen("Transpose Reset", 1); }
    int p = -1; char k = Character.toLowerCase(key);
    if (k == 'q') p = 60; else if (k == '2') p = 61; else if (k == 'w') p = 62; else if (k == '3') p = 63; else if (k == 'e') p = 64; else if (k == 'r') p = 65;
    else if (k == '5') p = 66; else if (k == 't') p = 67; else if (k == '6') p = 68; else if (k == 'y') p = 69; else if (k == '7') p = 70; else if (k == 'u') p = 71;
    else if (k == 'i') p = 72; else if (k == '9') p = 73; else if (k == 'o') p = 74; else if (k == '0') p = 75; else if (k == 'p') p = 76;
    if (p != -1) { if (!pcKeysHeld.containsKey(p)) { playNoteInternal(currentInstrument, p, 100); pcKeysHeld.put(p, currentInstrument); logToScreen("Keyboard ON: MIDI " + p, 0); } }
    
  }

  void keyReleased() {
    int p = -1; char k = Character.toLowerCase(key);
    if (k == 'q') p = 60; else if (k == '2') p = 61; else if (k == 'w') p = 62; else if (k == '3') p = 63; else if (k == 'e') p = 64; else if (k == 'r') p = 65;
    else if (k == '5') p = 66; else if (k == 't') p = 67; else if (k == '6') p = 68; else if (k == 'y') p = 69; else if (k == '7') p = 70; else if (k == 'u') p = 71;
    else if (k == 'i') p = 72; else if (k == '9') p = 73; else if (k == 'o') p = 74; else if (k == '0') p = 75; else if (k == 'p') p = 76;
    if (p != -1) { if (pcKeysHeld.containsKey(p)) { String inst = pcKeysHeld.get(p); stopNoteInternal(inst, p); pcKeysHeld.remove(p); logToScreen("Keyboard OFF: MIDI " + p, 0); } }
    
  }

  class SynthComponent { String waveType; float ratio; float amp; SynthComponent(String w, float r, float a) { waveType = w; ratio = r; amp = a; } }
  float mtof(float note) { return 440.0f * (float)Math.pow(2.0, (double)((note + (float)pitchTranspose - 69.0f) / 12.0f)); }
  int noteToMidi(String note) {
    String n = note.toUpperCase(); if (n.equals("R")) return -1; if (n.equals("X")) return 69;
    int octave = 4; if (n.length() > 1 && Character.isDigit(n.charAt(n.length()-1))) { octave = Character.getNumericValue(n.charAt(n.length()-1)); n = n.substring(0, n.length()-1); }
    int pc = 0; if (n.startsWith("C")) pc = 0; else if (n.startsWith("D")) pc = 2; else if (n.startsWith("E")) pc = 4; else if (n.startsWith("F")) pc = 5;
    else if (n.startsWith("G")) pc = 7; else if (n.startsWith("A")) pc = 9; else if (n.startsWith("B")) pc = 11;
    if (n.contains("#") || n.contains("S")) pc++; if (n.contains("B") && n.length() > 1 && !n.equals("B")) pc--;
    return (octave + 1) * 12 + pc;
  }
  Wavetable getWaveform(String type) {
    if (type.equals("SINE")) return Waves.SINE; if (type.equals("SQUARE")) return Waves.SQUARE; if (type.equals("SAW")) return Waves.SAW; return Waves.TRIANGLE;
  }

boolean checkKeyMask(Object dataObj, int key) {
  if (dataObj == null) return false;
  String data = String.valueOf(dataObj).trim();
  int splitIdx = data.indexOf(":");
  if (splitIdx == -1) return false;
  
  String prefix = data.substring(0, splitIdx).toUpperCase();
  String valStr = data.substring(splitIdx + 1).trim();
  
  try {
    int val = Integer.parseInt(valStr);
    if (prefix.equals("KEYS")) {
      // Bitmask mode: check if Nth bit is set
      return (val & (1 << (key - 1))) != 0;
    } else if (prefix.equals("KEY")) {
      // Single key mode: check if index matches
      return val == key;
    }
  } catch(Exception e) {}
  return false;
}

void serialEvent(Serial p) {
  try {
    ha___1_4_7B_wE5_3p_7Bf1_ = p.readString();
    if (ha___1_4_7B_wE5_3p_7Bf1_ != null) {
      ha___1_4_7B_wE5_3p_7Bf1_ = ha___1_4_7B_wE5_3p_7Bf1_.toString().trim();
      if (ha___1_4_7B_wE5_3p_7Bf1_.toString().length() > 0) {
        println("[Serial] Received: " + ha___1_4_7B_wE5_3p_7Bf1_);
        logToScreen("Serial In: " + ha___1_4_7B_wE5_3p_7Bf1_, 0);
          if (checkKeyMask(ha___1_4_7B_wE5_3p_7Bf1_, 1)) {
    playBuiltinDrum("KICK", floatVal(100));
  } else if (checkKeyMask(ha___1_4_7B_wE5_3p_7Bf1_, 2)) {
    playBuiltinDrum("CLAP", floatVal(100));
  } else if (checkKeyMask(ha___1_4_7B_wE5_3p_7Bf1_, 3)) {
    { 
      Object dVal = "4n";
      float ms = (dVal instanceof Number) ? ((Number)dVal).floatValue() : durationToMs(dVal.toString());
      playChordByNameInternal("Piano", "C", ms, floatVal(100));
    }
  } else if (checkKeyMask(ha___1_4_7B_wE5_3p_7Bf1_, 4)) {
    { 
      Object dVal = "4n";
      float ms = (dVal instanceof Number) ? ((Number)dVal).floatValue() : durationToMs(dVal.toString());
      playChordByNameInternal("Piano", "F", ms, floatVal(100));
    }
  }

      }
    }
  } catch (Exception e) {
    println("[Serial Error] " + e.getMessage());
    e.printStackTrace();
  }
}

void setup() {
  size(1600, 600);
    pixelDensity(displayDensity());
    
    checkMainMixer();
    
    stageBgColor = color(0, 0, 0);
  stageFgColor = color(255, 0, 150);
  adsrState = 0;
  fft = new FFT(out.bufferSize(), out.sampleRate());
  cp5 = new ControlP5(this);
  cp5.setFont(createFont("Arial", 16));
  
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
  cp5.addSlider("fgHue").setPosition(20, 555).setSize(150, 15).setRange(0, 255).setValue(230.0).setCaptionLabel("FG COLOR");
  cp5.addSlider("adsrA").setPosition(320, 485).setSize(15, 80).setRange(0, 2).setDecimalPrecision(2).setCaptionLabel("A");
  cp5.addSlider("adsrD").setPosition(380, 485).setSize(15, 80).setRange(0, 1).setDecimalPrecision(2).setCaptionLabel("D");
  cp5.addSlider("adsrS").setPosition(440, 485).setSize(15, 80).setRange(0, 1).setDecimalPrecision(2).setCaptionLabel("S");
  cp5.addSlider("adsrR").setPosition(500, 485).setSize(15, 80).setRange(0, 2).setDecimalPrecision(2).setCaptionLabel("R");
  cp5.addSlider("masterGain").setPosition(560, 485).setSize(15, 80).setRange(-40, 15).setCaptionLabel("GAIN");
  String[] serialPorts = Serial.list();
  ScrollableList ssl = cp5.addScrollableList("serialInputDevice").setPosition(660, 470).setSize(300, 150).setBarHeight(30).setItemHeight(25).setCaptionLabel("SERIAL PORT");
  for (int i = 0; i < serialPorts.length; i++) { ssl.addItem(serialPorts[i], i); }
  ssl.close();
  String[] startInputs = MidiBus.availableInputs();
  println("--- MIDI Devices ---");
  for(String s : startInputs) println("  > " + s);
  ScrollableList sl = cp5.addScrollableList("midiInputDevice").setPosition(660, 430).setSize(300, 150).setBarHeight(30).setItemHeight(25).setCaptionLabel("MIDI DEVICE");
  for (int i = 0; i < startInputs.length; i++) { sl.addItem(startInputs[i], i); }
  if (startInputs.length > 0) sl.setValue(0);
  sl.close();
  cp5.addButton("scanMidi").setPosition(970, 430).setSize(50, 30).setCaptionLabel("SCAN");
  cp5.addButton("copyLogs").setPosition(1405, 5).setSize(90, 25).setCaptionLabel("COPY LOG");
  cp5.addButton("clearLogs").setPosition(1500, 5).setSize(90, 25).setCaptionLabel("CLEAR LOG");
  logToScreen("System Initialized.", 0);
  surface.setTitle("Super Stage");
  surface.setVisible(true);
  if (surface.getNative() instanceof java.awt.Canvas) { ((java.awt.Canvas)surface.getNative()).requestFocus(); }
    println("--- Available Serial Ports ---");
    println(Serial.list());
    serialBaud = 115200;
    try {
      myPort = new Serial(this, Serial.list()[0], serialBaud);
      myPort.bufferUntil('\n');
    } catch (Exception e) {
      println("Serial Init Failed: " + e.getMessage());
    }
    currentInstrument = "Piano";
    chords.put("C", new String[]{"C4", "E4", "G4"});
    chords.put("F", new String[]{"F4", "A4", "C5"});
    if (!instrumentMap.containsKey("Piano")) instrumentMap.put("Piano", "TRIANGLE");
  if (!instrumentADSR.containsKey("Piano")) instrumentADSR.put("Piano", new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR});
    instrumentMap.put("Piano", "TRIANGLE");
    instrumentADSR.put("Piano", new float[]{(float)0.01, (float)0.3, (float)0.4, (float)0.5});
}


void draw() {
  pushStyle(); colorMode(HSB, 255); stageFgColor = color(fgHue, 255, 255); popStyle();
  masterGainUGen.setValue(masterGain); noStroke(); fill(30); rect(0, 400, width, 200);
  // Peak detection sync with CLIP flag from audio thread
  if (out != null) {
    for(int i = 0; i < out.bufferSize(); i++) {
      if (Math.abs(out.mix.get(i)) > 0.99f) { isMasterClipping = true; clippingTimer = millis(); break; }
    }
  }
  if (isMasterClipping && millis() - clippingTimer > 500) { isMasterClipping = false; }
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
  if (isMasterClipping) {
    pushStyle(); fill(255, 0, 0, (sin(millis()*0.02)+1)*127); noStroke();
    rect(currentVisualW/2 - 40, 10, 80, 25, 5);
    fill(255); textSize(16); textAlign(CENTER, CENTER);
    text("CLIP", currentVisualW/2, 22);
    popStyle();
  }
  updateInstrumentUISync();
}