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
  g['samplerMap'] = "HashMap<String, Sampler> samplerMap = new HashMap<String, Sampler>();";
  g['samplerGainMap'] = "HashMap<String, Gain> samplerGainMap = new HashMap<String, Gain>();";
  g['activeMelodyCount'] = "int activeMelodyCount = 0;";
  g['melodyLock'] = "final Object melodyLock = new Object();";
  g['isCountingIn'] = "volatile boolean isCountingIn = false;";

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
      try { Thread.sleep(200); } catch(Exception e) {} // Wait for UI
      synchronized(melodyLock) {
        activeMelodyCount++;
        String[] tokens = splitTokens(melody, ", \\t\\n\\r");
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
    String[] parts = token.split("\\\\+");
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

registerGenerator('sb_drum_sampler', function(block) {
  const name = Blockly.Processing.currentGenInstrumentName;
  if (!name) return '// sb_drum_sampler must be inside sb_instrument_container\n';
  const path = block.getFieldValue('PATH');
  let code = 'if (minim == null) { minim = new Minim(this); out = minim.getLineOut(); }\n';
  code += 'samplerMap.put("' + name + '", new Sampler("' + path + '", 4, minim));\n';
  code += 'samplerGainMap.put("' + name + '", new Gain(0.f));\n';
  code += 'samplerMap.get("' + name + '").patch(samplerGainMap.get("' + name + '")).patch(out);\n';
  code += 'instrumentMap.put("' + name + '", "DRUM");\n';
  code += 'instrumentADSR.put("' + name + '", new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR});\n';
  return code;
});

registerGenerator('sb_trigger_sample', function(block) {
  Blockly.Processing.injectAudioCore();
  const name = block.getFieldValue('NAME');
  const velocity = Blockly.Processing.valueToCode(block, 'VELOCITY', Blockly.Processing.ORDER_ATOMIC) || '100';
  const note = block.getFieldValue('NOTE') || 'C4Q';
  
  return `parseAndPlayNote("${name}", "${note}", (float)${velocity});\n`;
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
  const velocity = Blockly.Processing.valueToCode(block, 'VELOCITY', Blockly.Processing.ORDER_ATOMIC) || '100';
  const isChordMode = (block.getFieldValue('CHORD_MODE') === 'TRUE');
  
  let code = 'new Thread(new Runnable() {\n';
  code += '  public void run() {\n';
  code += '    int timeout = 0;\n';
  code += '    while(isCountingIn && timeout < 500) { try { Thread.sleep(10); timeout++; } catch(Exception e) {} }\n';
  code += '    try { Thread.sleep((long)(((' + measure + '-1) * 4 * 60000) / bpm)); } catch(Exception e) {}\n';
  code += '    String rawPattern = "' + pattern + '";\n';
  code += '    String[] steps;\n';
  code += '    if (rawPattern.contains(",")) {\n';
  code += '      steps = rawPattern.split(",");\n';
  code += '    } else {\n';
  code += '      String p = rawPattern.replace("|", "").replace(" ", "");\n';
  code += '      steps = new String[p.length()];\n';
  code += '      for(int i=0; i<p.length(); i++) steps[i] = String.valueOf(p.charAt(i));\n';
  code += '    }\n';
  code += '    float stepMs = (60000 / bpm) / 4;\n';
  code += '    for (int i=0; i<Math.min(steps.length, 16); i++) {\n';
  code += '      String token = steps[i].trim();\n';
  code += '      if (token.equals(".")) {\n';
  code += '        try { Thread.sleep((long)stepMs); } catch(Exception e) {}\n';
  code += '        continue;\n';
  code += '      }\n';
  code += '      int sustainSteps = 1;\n';
  code += '      for (int j=i+1; j<Math.min(steps.length, 16); j++) {\n';
  code += '        String nextToken = steps[j].trim();\n';
  code += '        if (nextToken.equals("-")) sustainSteps++;\n';
  code += '        else break;\n';
  code += '      }\n';
  code += '      float noteDur = stepMs * sustainSteps;\n';
  code += '      if (!token.equals("-")) {\n';
  code += '        if (instrumentMap.getOrDefault("' + source + '", "").equals("DRUM")) {\n';
  code += '          if (token.equalsIgnoreCase("x")) {\n';
  code += '             samplerGainMap.get("' + source + '").setValue(map(' + velocity + ', 0, 127, -40, 0));\n';
  code += '             samplerMap.get("' + source + '").trigger();\n';
  code += '          }\n';
  code += '        } else {\n';
  code += '          String oldInst = currentInstrument;\n';
  code += '          currentInstrument = "' + source + '";\n';
  code += '          if (' + isChordMode + ') {\n';
  code += '            if (token.equals("x")) token = "C";\n';
  code += '            if (chords.containsKey(token)) playChordByNameInternal(token, noteDur * 0.9f, (float)' + velocity + ');\n';
  code += '            else { int midi = noteToMidi(token); if (midi >= 0) playNoteForDuration(midi, (float)' + velocity + ', noteDur * 0.9f); }\n';
  code += '          } else {\n';
  code += '            if (token.equalsIgnoreCase("x")) playNoteForDuration(60, (float)' + velocity + ', noteDur * 0.8f);\n';
  code += '            else { int midi = noteToMidi(token); if (midi >= 0) playNoteForDuration(midi, (float)' + velocity + ', noteDur * 0.9f); }\n';
  code += '          }\n';
  code += '          currentInstrument = oldInst;\n';
  code += '        }\n';
  code += '      }\n';
  code += '      try { Thread.sleep((long)stepMs); } catch(Exception e) {}\n';
  code += '    }\n';
  code += '  }\n';
  code += '}).start();\n';
  return code;
});

registerGenerator('sb_transport_count_in', function(block) {
  Blockly.Processing.injectAudioCore();
  const measures = Blockly.Processing.valueToCode(block, 'MEASURES', Blockly.Processing.ORDER_ATOMIC) || '1';
  const velocity = Blockly.Processing.valueToCode(block, 'VELOCITY', Blockly.Processing.ORDER_ATOMIC) || '100';
  
  const setupCode = `isCountingIn = true;
  new Thread(new Runnable() {
    public void run() {
      try {
        Thread.sleep(1000); 
        logToScreen("--- COUNT IN START ---", 1);
        for (int m=0; m<${measures}; m++) {
          for (int b=0; b<4; b++) {
            playClick((b==0 ? 880.0f : 440.0f), (float)${velocity});
            Thread.sleep((long)(60000.0f/bpm));
          }
        }
      } catch (Exception e) {
      } finally {
        isCountingIn = false;
        logToScreen("--- PLAY ---", 1);
      }
    }
  }).start();`;
  
  Blockly.Processing.provideSetup(setupCode);
  return "";
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
  
  const code = `new Thread(new Runnable() {
    public void run() {
      activeMelodyCount++;
      try { Thread.sleep(200); } catch(Exception e) {}
      int timeout = 0;
      while(isCountingIn && timeout < 500) { try { Thread.sleep(10); timeout++; } catch(Exception e) {} }
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
  
  Blockly.Processing.provideSetup(code);
  return "";
});

registerGenerator('sb_perform', function(block) {
  Blockly.Processing.injectAudioCore();
  const branch = Blockly.Processing.statementToCode(block, 'DO');
  
  const code = `new Thread(new Runnable() {
    public void run() {
      activeMelodyCount++;
      try { Thread.sleep(200); } catch(Exception e) {}
      int timeout = 0;
      while(isCountingIn && timeout < 500) { try { Thread.sleep(10); timeout++; } catch(Exception e) {} }
      ${branch.replace(/\n/g, '\n      ')}
      activeMelodyCount--;
    }
  }).start();\n`;
  
  Blockly.Processing.provideSetup(code);
  return "";
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

registerGenerator('sb_wait_until_finished', function(block) {
  return `while(activeMelodyCount > 0) { try { Thread.sleep(50); } catch(Exception e) {} }\n`;
});

// State tracker for container context
Blockly.Processing.currentGenInstrumentName = null;

registerGenerator('sb_instrument_container', function(block) {
  const name = block.getFieldValue('NAME');
  Blockly.Processing.currentGenInstrumentName = name;
  
  // Collect all code from children (like sb_drum_sampler or sb_set_wave)
  const branch = Blockly.Processing.statementToCode(block, 'STACK');
  
  // Ensure basic map entries if not already set by children
  let code = 'if (!instrumentMap.containsKey("' + name + '")) instrumentMap.put("' + name + '", "TRIANGLE");\n';
  code += 'if (!instrumentADSR.containsKey("' + name + '")) instrumentADSR.put("' + name + '", new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR});\n';
  code += branch;
  
  Blockly.Processing.currentGenInstrumentName = null;
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