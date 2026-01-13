import ddf.minim.*;
import ddf.minim.ugens.*;
import java.util.*;

AudioOutput out;
Gain kick_gain;
HashMap<Integer, ADSR> activeNotes = new HashMap<Integer, ADSR>();
HashMap<String, List<SynthComponent>> additiveConfigs = new HashMap<String, List<SynthComponent>>();
HashMap<String, String> instrumentMap = new HashMap<String, String>();
HashMap<String, float[]> harmonicPartials = new HashMap<String, float[]>();
Minim minim;
Sampler kick;
String currentInstrument = "default";
float adsrA = 0.01;
float adsrD = 0.1;
float adsrR = 0.5;
float adsrS = 0.5;
float masterGain = -5.0;
int pitchTranspose = 0;

class SynthComponent {
    String waveType; float ratio; float amp;
    SynthComponent(String w, float r, float a) { waveType = w; ratio = r; amp = a; }
  }

  float mtof(float note) {
    return 440.0f * (float)Math.pow(2.0, (double)((note + (float)pitchTranspose - 69.0f) / 12.0f));
  }

  Wavetable getWaveform(String type) {
    if (type.equals("SINE")) return Waves.SINE;
    if (type.equals("SQUARE")) return Waves.SQUARE;
    if (type.equals("SAW")) return Waves.SAW;
    return Waves.TRIANGLE;
  }

  void playNoteInternal(int p, float vel) {
    if (activeNotes.containsKey(p)) return;
    
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
  }

  void stopNoteInternal(int p) {
    ADSR adsr = activeNotes.get(p);
    if (adsr != null) {
      adsr.unpatchAfterRelease(out);
      adsr.noteOff();
      activeNotes.remove(p);
    }
  }

void keyPressed() {
  char k = Character.toLowerCase(key);
  if (k == 'b') {
        if (kick != null) {
          kick_gain.setValue(map(100, 0, 127, -40, 0));
          kick.trigger();
        }
      
    }
    if (k == 'q') {
        if (kick != null) {
          kick_gain.setValue(map(100, 0, 127, -40, 0));
          kick.trigger();
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
}


void draw() {
  
}