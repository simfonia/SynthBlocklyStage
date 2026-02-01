import ddf.minim.*;
import ddf.minim.ugens.*;
import java.util.*;

AudioOutput out;
Gain hi_hat_gain;
Gain kick_gain;
Gain snare_gain;
HashMap<Integer, ADSR> activeNotes = new HashMap<Integer, ADSR>();
HashMap<String, List<SynthComponent>> additiveConfigs = new HashMap<String, List<SynthComponent>>();
HashMap<String, String> instrumentMap = new HashMap<String, String>();
HashMap<String, String[]> chords = new HashMap<String, String[]>();
HashMap<String, float[]> harmonicPartials = new HashMap<String, float[]>();
Minim minim;
Sampler hi_hat;
Sampler kick;
Sampler snare;
String currentInstrument = "default";
float adsrA = 0.01;
float adsrD = 0.1;
float adsrR = 0.5;
float adsrS = 0.5;
float bpm = 120.0;
float masterGain = -5.0;
int adsrState = 0;
int adsrTimer = 0;

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
      String oldInst = currentInstrument;
      if (inst != null && !inst.equals("")) currentInstrument = inst;
      String[] tokens = melody.split("[,\\s]+");
      for (String t : tokens) {
        t = t.trim(); if (t.length() == 0) continue;
        float ms = 500;
        String prefix = t;
        if (t.endsWith("W")) { ms = (60000/bpm)*4; prefix = t.substring(0, t.length()-1); }
        else if (t.endsWith("H")) { ms = (60000/bpm)*2; prefix = t.substring(0, t.length()-1); }
        else if (t.endsWith("Q")) { ms = (60000/bpm);   prefix = t.substring(0, t.length()-1); }
        else if (t.endsWith("E")) { ms = (60000/bpm)/2; prefix = t.substring(0, t.length()-1); }
        else if (t.endsWith("S")) { ms = (60000/bpm)/4; prefix = t.substring(0, t.length()-1); }
        
        if (chords.containsKey(prefix)) {
          playChordByNameInternal(prefix, ms * 0.9f, 100);
        } else {
          int midi = noteToMidi(prefix);
          if (midi >= 0) playNoteForDuration(midi, 100, ms * 0.9f);
        }
        try { Thread.sleep((long)ms); } catch (Exception e) {}
      }
      currentInstrument = oldInst;
    }
  }

  void playMelodyInternal(String m, String i) {
    new MelodyPlayer(m, i).start();
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

void keyPressed() {
  char k = Character.toLowerCase(key);
  if (k == 's') {
        if (kick != null) {
          kick_gain.setValue(map(100, 0, 127, -40, 0));
          kick.trigger();
        }
      
    }
    if (k == 'f') {
        if (snare != null) {
          snare_gain.setValue(map(100, 0, 127, -40, 0));
          snare.trigger();
        }
      
    }
    if (k == 'j') {
        if (hi_hat != null) {
          hi_hat_gain.setValue(map(100, 0, 127, -40, 0));
          hi_hat.trigger();
        }
      
    }
    
}

void keyReleased() {
  char k = Character.toLowerCase(key);
  
}

void setup() {
  minim = new Minim(this);
  out = minim.getLineOut();
  instrumentMap.put("default", "SINE");
  currentInstrument = "default";
    kick = new Sampler("drum/kick.wav", 4, minim);
  kick_gain = new Gain(0.f);
  kick.patch(kick_gain).patch(out);
    snare = new Sampler("drum/snare.wav", 4, minim);
  snare_gain = new Gain(0.f);
  snare.patch(snare_gain).patch(out);
    hi_hat = new Sampler("drum/ch.wav", 4, minim);
  hi_hat_gain = new Gain(0.f);
  hi_hat.patch(hi_hat_gain).patch(out);
}


void draw() {
  
}