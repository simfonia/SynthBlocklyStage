/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Audio generators for Processing (Minim).
 */

/**
 * 內部函式：注入音訊核心支援代碼 (Java)
 */
Blockly.Processing.injectAudioCore = function() {
  if (Blockly.Processing.definitions_['AudioCore']) return;

  // Add global variables
  var g = Blockly.Processing.global_vars_;
  g['minim'] = "Minim minim;";
  g['out'] = "AudioOutput out;";
  Blockly.Processing.addImport("import java.util.LinkedHashMap;");
  g['instrumentMap'] = "LinkedHashMap<String, String> instrumentMap = new LinkedHashMap<String, String>();";
  g['instrumentADSR'] = "LinkedHashMap<String, float[]> instrumentADSR = new LinkedHashMap<String, float[]>();";
  g['chords'] = "HashMap<String, String[]> chords = new HashMap<String, String[]>();";
  g['currentInstrument'] = 'String currentInstrument = "default";';
  g['lastInstrument'] = 'String lastInstrument = "";';
  g['activeNotes'] = "HashMap<Integer, ADSR> activeNotes = new HashMap<Integer, ADSR>();";
  g['harmonicPartials'] = "HashMap<String, float[]> harmonicPartials = new HashMap<String, float[]>();";
  g['additiveConfigs'] = "HashMap<String, List<SynthComponent>> additiveConfigs = new HashMap<String, List<SynthComponent>>();";
  g['activeMelodyCount'] = "int activeMelodyCount = 0;";
  g['melodyLock'] = "final Object melodyLock = new Object();";

  // Core Classes and Methods
  g['bpm'] = "float bpm = 120.0;";
  g['masterGain'] = "float masterGain = -5.0;";
  // defAdsr are used as fallback defaults
  g['defAdsrA'] = "float defAdsrA = 0.01;";
  g['defAdsrD'] = "float defAdsrD = 0.1;";
  g['defAdsrS'] = "float defAdsrS = 0.5;";
  g['defAdsrR'] = "float defAdsrR = 0.5;";

  // Core Classes and Methods
  Blockly.Processing.definitions_['AudioCore'] = `
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
      synchronized(melodyLock) {
        activeMelodyCount++;
        String oldInst = currentInstrument;
        if (inst != null && !inst.equals("")) currentInstrument = inst;
        
              // Split by comma, space, tab, or newline
        
              String[] tokens = splitTokens(melody, ", \\t\\n\\r");
        
              for (String t : tokens) {
        
                t = t.trim(); if (t.length() < 2) continue;
        
                
        
                float totalMs = 0;
        
                String noteName = "";
        
                
        
                // Support Ties (+) e.g. C4H+Q or C4H.+E
        
                String[] parts = t.split("\\\\+");
        
                for (int j = 0; j < parts.length; j++) {
        
                  String p = parts[j].trim();
        
                  if (p.length() == 0) continue;
        
                  
        
                  float multiplier = 1.0f;
        
                  if (p.endsWith(".")) {
        
                    multiplier = 1.5f;
        
                    p = p.substring(0, p.length() - 1);
        
                  } else if (p.endsWith("_T")) {
        
                    multiplier = 2.0f / 3.0f;
        
                    p = p.substring(0, p.length() - 2);
        
                  }
        
                  
        
                  char durChar = p.charAt(p.length() - 1);
        
                  String prefix = p.substring(0, p.length() - 1);
        
                  
        
                  // The first part of a tied note defines the pitch/chord
        
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
        
                  if (chords.containsKey(noteName)) {
        
                    playChordByNameInternal(noteName, totalMs * 0.95f, 100);
        
                  } else {
        
                    int midi = noteToMidi(noteName);
        
                    if (midi >= 0) playNoteForDuration(midi, 100, totalMs * 0.95f);
        
                  }
        
                  try { Thread.sleep((long)totalMs); } catch (Exception e) {}
        
                }
        
              }
        currentInstrument = oldInst;
        activeMelodyCount--;
      }
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
  `;
};

// Helper to register generator safely
const registerGenerator = (type, func) => {
  Blockly.Processing.forBlock[type] = func;
  Blockly.Processing[type] = func; // Legacy fallback
};

registerGenerator('sb_minim_init', function(block) {
  Blockly.Processing.injectAudioCore();
  Blockly.Processing.imports_['minim'] = 'import ddf.minim.*;';
  Blockly.Processing.imports_['minim_ugens'] = 'import ddf.minim.ugens.*;';
  
  // 僅確保全域變數存在，避免產生器報錯
  Blockly.Processing.global_vars_['sample_kick'] = "Sampler kick;";
  Blockly.Processing.global_vars_['sample_snare'] = "Sampler snare;";
  
  Blockly.Processing.provideSetup('minim = new Minim(this);\nout = minim.getLineOut();\ncurrentInstrument = "";');
  return '';
});

registerGenerator('sb_load_sample', function(block) {
  const name = block.getFieldValue('NAME');
  const path = block.getFieldValue('PATH');
  Blockly.Processing.global_vars_['sample_' + name] = `Sampler ${name};`;
  Blockly.Processing.global_vars_['gain_' + name] = `Gain ${name}_gain;`;
  
  const initCode = `${name} = new Sampler("${path}", 4, minim);\n` + 
                   `${name}_gain = new Gain(0.f);\n` + 
                   `${name}.patch(${name}_gain).patch(out);`;
  Blockly.Processing.provideSetup(initCode);
  
  return "";
});

registerGenerator('sb_trigger_sample', function(block) {
  const name = block.getFieldValue('NAME');
  const velocity = Blockly.Processing.valueToCode(block, 'VELOCITY', Blockly.Processing.ORDER_ATOMIC) || '100';
  return `if (${name} != null) {\n  ${name}_gain.setValue(map(${velocity}, 0, 127, -40, 0));\n  ${name}.trigger();\n}\n`;
});

registerGenerator('sb_create_harmonic_synth', function(block) {
  const name = Blockly.Processing.currentGenInstrumentName;
  if (!name) return '// sb_create_harmonic_synth must be inside sb_instrument_container\n';

  const partials = [];
  for (let i = 1; i <= (block.itemCount_ || 0); i++) {
    const val = Blockly.Processing.valueToCode(block, 'PARTIAL' + i, Blockly.Processing.ORDER_ATOMIC) || '0';
    partials.push(`${val}f`);
  }
  return `instrumentMap.put("${name}", "HARMONIC");\n` + 
         `harmonicPartials.put("${name}", new float[]{
${partials.length > 0 ? partials.join(', ') : '1.0f'}
});\n`;
});

registerGenerator('sb_create_additive_synth', function(block) {
  const name = Blockly.Processing.currentGenInstrumentName;
  if (!name) return '// sb_create_additive_synth must be inside sb_instrument_container\n';

  const components = [];
  const count = block.itemCount_ || 0;
  for (let i = 1; i <= count; i++) {
    const wave = block.getFieldValue('WAVE' + i) || "SINE";
    const ratio = block.getFieldValue('RATIO' + i) || "1.0";
    const amp = block.getFieldValue('AMP' + i) || "0.5";
    components.push(`new SynthComponent("${wave}", ${ratio}f, ${amp}f)`);
  }
  return `instrumentMap.put("${name}", "ADDITIVE");\n` + 
         `additiveConfigs.put("${name}", Arrays.asList(new SynthComponent[]{${components.join(', ')}}));\n`;
});

registerGenerator('sb_select_current_instrument', function(block) {
  const name = block.getFieldValue('NAME');
  return `currentInstrument = "${name}";\n`;
});

registerGenerator('sb_play_note', function(block) {
  Blockly.Processing.injectAudioCore();
  const pitch = Blockly.Processing.valueToCode(block, 'PITCH', Blockly.Processing.ORDER_ATOMIC) || '60';
  const velocity = Blockly.Processing.valueToCode(block, 'VELOCITY', Blockly.Processing.ORDER_ATOMIC) || '100';
  return `playNoteInternal((int)${pitch}, (float)${velocity});\n`;
});

registerGenerator('sb_stop_note', function(block) {
  Blockly.Processing.injectAudioCore();
  const pitch = Blockly.Processing.valueToCode(block, 'PITCH', Blockly.Processing.ORDER_ATOMIC) || '60';
  return `stopNoteInternal((int)${pitch});\n`;
});

registerGenerator('sb_play_melody', function(block) {
  Blockly.Processing.injectAudioCore();
  const melody = block.getFieldValue('MELODY') || "";
  const instrument = block.getFieldValue('INSTRUMENT');
  
  // Replace newlines with spaces to allow Java's splitTokens to handle it
  const cleanMelody = melody.replace(/\n/g, ' ').replace(/"/g, '\\"');
  return `playMelodyInternal("${cleanMelody}", "${instrument}");\n`;
});

registerGenerator('sb_rhythm_sequence', function(block) {
  Blockly.Processing.injectAudioCore();
  const source = block.getFieldValue('SOURCE');
  const pattern = block.getFieldValue('PATTERN');
  const measure = Blockly.Processing.valueToCode(block, 'MEASURE', Blockly.Processing.ORDER_ATOMIC) || '1';
  
  // Rhythm logic using threads for non-blocking 16-step sequence
  return `new Thread(new Runnable() {
    public void run() {
      try { Thread.sleep((long)(((${measure}-1) * 4 * 60000) / bpm)); } catch(Exception e) {}
      String p = "${pattern}";
      float stepMs = (60000 / bpm) / 4;
      for (int i=0; i<min(p.length(), 16); i++) {
        char c = p.charAt(i);
        if (c == 'x' || c == 'X') {
          if ("${source}".equals("KICK")) { if (kick != null) kick.trigger(); }
          else if ("${source}".equals("SNARE")) { if (snare != null) snare.trigger(); }
          else { playNoteForDuration(60, 100, stepMs * 0.8f); }
        }
        try { Thread.sleep((long)stepMs); } catch(Exception e) {}
      }
    }
  }).start();\n`;
});

registerGenerator('sb_transport_set_bpm', function(block) {
  Blockly.Processing.injectAudioCore();
  const bpm = Blockly.Processing.valueToCode(block, 'BPM', Blockly.Processing.ORDER_ATOMIC) || '120';
  return `bpm = (float)${bpm};\n`;
});

registerGenerator('sb_tone_loop', function(block) {
  Blockly.Processing.injectAudioCore();
  const interval = block.getFieldValue('INTERVAL') || '1m';
  const branch = Blockly.Processing.statementToCode(block, 'DO');
  
  return `new Thread(new Runnable() {
    public void run() {
      while (true) {
        float ms = 2000;
        String iv = "${interval}";
        try {
          if (iv.endsWith("m")) {
            float count = iv.length() > 1 ? Float.parseFloat(iv.substring(0, iv.length()-1)) : 1.0f;
            ms = (60000/bpm) * 4 * count;
          } else if (iv.endsWith("n")) {
            float den = Float.parseFloat(iv.substring(0, iv.length()-1));
            ms = (60000/bpm) * (4.0f / den);
          }
        } catch(Exception e) { ms = (60000/bpm) * 4; }
        
        ${branch.replace(/\n/g, '\n        ')}
        try { Thread.sleep((long)ms); } catch (Exception e) {}
      }
    }
  }).start();\n`;
});

registerGenerator('sb_define_chord', function(block) {
  Blockly.Processing.injectAudioCore();
  const name = block.getFieldValue('NAME');
  const notes = (block.getFieldValue('NOTES') || "").split(',').map(s => `"${s.trim()}"`);
  return `chords.put("${name}", new String[]{${notes.join(', ')}});
`;
});

registerGenerator('sb_play_chord_by_name', function(block) {
  Blockly.Processing.injectAudioCore();
  const name = block.getFieldValue('NAME');
  const dur = block.getFieldValue('DUR') || '4n';
  const velocity = Blockly.Processing.valueToCode(block, 'VELOCITY', Blockly.Processing.ORDER_ATOMIC) || '100';
  
  return `{ 
  float ms = durationToMs("${dur}");
  playChordByNameInternal("${name}", ms, (float)${velocity});
}
`;
});

// Legacy / Utility fallback
registerGenerator('audio_sample_property', function(block) {
  const name = block.getFieldValue('NAME');
  const prop = block.getFieldValue('PROP');
  return [`${name}.${prop}`, Blockly.Processing.ORDER_MEMBER];
});

registerGenerator('audio_sample_mix_get', function(block) {
  return [`0`, Blockly.Processing.ORDER_ATOMIC];
});

registerGenerator('audio_set_current_sample', function(block) {
  const name = block.getFieldValue('NAME');
  Blockly.Processing.global_vars_['currentSample'] = 'Sampler currentSample;';
  return `currentInstrument = ${name};\n`;
});

registerGenerator('audio_current_sample_property', function(block) {
  const prop = block.getFieldValue('PROP');
  Blockly.Processing.global_vars_['currentSample'] = 'Sampler currentSample;';
  return [`currentSample.${prop}`, Blockly.Processing.ORDER_MEMBER];
});

registerGenerator('audio_current_sample_mix_get', function(block) {
  return [`0`, Blockly.Processing.ORDER_ATOMIC];
});

registerGenerator('sb_audio_is_playing', function(block) {
  return ['(activeMelodyCount > 0)', Blockly.Processing.ORDER_RELATIONAL];
});

// State tracker for container context
Blockly.Processing.currentGenInstrumentName = null;

registerGenerator('sb_instrument_container', function(block) {
  const name = block.getFieldValue('NAME');
  
  // Set context
  Blockly.Processing.currentGenInstrumentName = name;
  
  // We don't force TRIANGLE here anymore, we let the inner blocks decide.
  // But we still need to ensure instrumentADSR has something.
  let code = `instrumentADSR.put("${name}", new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR});\n`;
  
  // Process inner blocks
  const branch = Blockly.Processing.statementToCode(block, 'STACK');
  code += branch;
  
  // Clear context
  Blockly.Processing.currentGenInstrumentName = null;
  
  // FORCE this initialization code into setup() to ensure it runs in Processing
  Blockly.Processing.provideSetup(code);
  return '';
});

registerGenerator('sb_set_adsr', function(block) {
  // Must be inside a container
  if (!Blockly.Processing.currentGenInstrumentName) return '// sb_set_adsr must be inside sb_instrument_container\n';
  
  const a = Blockly.Processing.valueToCode(block, 'A', Blockly.Processing.ORDER_ATOMIC) || '0.01';
  const d = Blockly.Processing.valueToCode(block, 'D', Blockly.Processing.ORDER_ATOMIC) || '0.1';
  const s = Blockly.Processing.valueToCode(block, 'S', Blockly.Processing.ORDER_ATOMIC) || '0.5';
  const r = Blockly.Processing.valueToCode(block, 'R', Blockly.Processing.ORDER_ATOMIC) || '0.5';
  
  return `instrumentADSR.put("${Blockly.Processing.currentGenInstrumentName}", new float[]{(float)${a}, (float)${d}, (float)${s}, (float)${r}});\n`;
});

registerGenerator('sb_set_wave', function(block) {
  if (!Blockly.Processing.currentGenInstrumentName) return '// sb_set_wave must be inside sb_instrument_container\n';
  const type = block.getFieldValue('TYPE');
  return `instrumentMap.put("${Blockly.Processing.currentGenInstrumentName}", "${type}");\n`;
});