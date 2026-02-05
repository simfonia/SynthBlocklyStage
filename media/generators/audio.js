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
  Blockly.Processing.addImport("import java.util.concurrent.*;");
  g['instrumentMap'] = "LinkedHashMap<String, String> instrumentMap = new LinkedHashMap<String, String>();";
  g['instrumentADSR'] = "LinkedHashMap<String, float[]> instrumentADSR = new LinkedHashMap<String, float[]>();";
  g['instrumentVolumes'] = "HashMap<String, Float> instrumentVolumes = new HashMap<String, Float>();";
  g['chords'] = "HashMap<String, String[]> chords = new HashMap<String, String[]>();";
  g['currentInstrument'] = 'String currentInstrument = "default";';
  g['lastInstrument'] = 'String lastInstrument = "";';
  g['mainMixer'] = "Summer mainMixer;";
  g['masterGainUGen'] = "Gain masterGainUGen;";
  g['harmonicPartials'] = "HashMap<String, float[]> harmonicPartials = new HashMap<String, float[]>();";
  g['additiveConfigs'] = "HashMap<String, List<SynthComponent>> additiveConfigs = new HashMap<String, List<SynthComponent>>();";
  g['samplerMap'] = "HashMap<String, Sampler> samplerMap = new HashMap<String, Sampler>();";
  g['samplerGainMap'] = "HashMap<String, Gain> samplerGainMap = new HashMap<String, Gain>();";
  g['melodicSamplers'] = "HashMap<String, MelodicSampler> melodicSamplers = new HashMap<String, MelodicSampler>();";
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

  class MelodicSampler {
    TreeMap<Integer, Sampler> samples = new TreeMap<Integer, Sampler>();
    TreeMap<Integer, TickRate> rates = new TreeMap<Integer, TickRate>();
    TreeMap<Integer, ADSR> adsrs = new TreeMap<Integer, ADSR>();
    Summer localMixer = new Summer();
    Minim m;
    
    MelodicSampler(Minim minim) { 
      this.m = minim; 
      checkMainMixer();
      localMixer.patch(mainMixer);
    }
    
    void loadSamples(String folder) {
      File dir = new File(dataPath(folder));
      if (!dir.exists()) return;
      File[] files = dir.listFiles();
      if (files == null) return;
      for (File f : files) {
        String fullName = f.getName();
        String upperName = fullName.toUpperCase();
        if (upperName.endsWith(".MP3") || upperName.endsWith(".WAV")) {
          String noteName = fullName.substring(0, fullName.lastIndexOf('.'));
          int midi = noteToMidi(noteName);
          if (midi >= 0) {
            Sampler s = new Sampler(folder + "/" + fullName, 4, m);
            TickRate tr = new TickRate(1.f);
            ADSR a = new ADSR(1.0, 0.001f, 0.001f, 1.0f, 0.5f); // 預設 R=0.5
            tr.setInterpolation(true);
            s.patch(tr).patch(a).patch(localMixer);
            samples.put(midi, s);
            rates.put(midi, tr);
            adsrs.put(midi, a);
          }
        }
      }
    }
    
    ADSR trigger(int midi, float amp, float r) {
      if (samples.isEmpty()) return null;
      Integer closest = samples.floorKey(midi);
      if (closest == null) closest = samples.ceilingKey(midi);
      
      Sampler src = samples.get(closest);
      TickRate tr = rates.get(closest);
      ADSR a = adsrs.get(closest);
      
      if (src != null && tr != null && a != null) {
        float rate = (float)Math.pow(2.0, (midi - closest) / 12.0);
        tr.value.setLastValue(rate);
        
        // 使用傳入的 amp 設定最大振幅
        a.setParameters(amp, 0.001f, 0.001f, 1.0f, r, 0, 0);
        a.noteOn();
        src.trigger();
        return a;
      }
      return null;
    }
  }

  void checkMainMixer() {
    if (minim == null) minim = new Minim(this);
    if (out == null) out = minim.getLineOut();
    if (mainMixer == null) {
      mainMixer = new Summer();
      masterGainUGen = new Gain(0.f);
      mainMixer.patch(masterGainUGen).patch(out);
    }
  }

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

  // Global ConcurrentHashMap for thread safety and composite keys
  ConcurrentHashMap<String, ADSR> activeNotes = new ConcurrentHashMap<String, ADSR>();

  void playNoteInternal(String instName, int p, float vel) {
    if (instName == null || instName.length() == 0) instName = currentInstrument;
    if (p < 0) return;
    String key = instName + "_" + p;
    
    // Stop existing note of SAME instrument and SAME pitch
    if (activeNotes.containsKey(key)) stopNoteInternal(instName, p);
    
    float masterAmp = map(vel, 0, 127, 0, 0.5f);
    masterAmp *= instrumentVolumes.getOrDefault(instName, 1.0f);
    
    float[] adsr = instrumentADSR.get(instName);
    if (adsr == null) adsr = new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR};

    String type = instrumentMap.getOrDefault(instName, "TRIANGLE");
    if (type.equals("MELODIC_SAMPLER")) {
      MelodicSampler ms = melodicSamplers.get(instName);
      if (ms != null) {
        ADSR env = ms.trigger(p, masterAmp, adsr[3]);
        if (env != null) {
          activeNotes.put(key, env);
          if (instName.equals(currentInstrument) && !instName.equals("")) {
            adsrTimer = millis(); adsrState = 1;
          }
        }
      }
      return;
    }
    
    float baseFreq = mtof((float)p);
    ADSR env = new ADSR(1.0, adsr[0], adsr[1], adsr[2], adsr[3]);
    
    Summer noteMixer = new Summer(); 
    
    if (type.equals("HARMONIC")) {
      float[] partials = harmonicPartials.get(instName);
      if (partials != null) {
        for (int i = 0; i < partials.length; i++) {
          if (partials[i] > 0) {
            Oscil osc = new Oscil(baseFreq * (i + 1), partials[i] * masterAmp, Waves.SINE);
            osc.patch(noteMixer);
          }
        }
      }
      noteMixer.patch(env);
    } else if (type.equals("ADDITIVE")) {
      List<SynthComponent> configs = additiveConfigs.get(instName);
      if (configs != null) {
        for (SynthComponent comp : configs) {
          Oscil osc = new Oscil(baseFreq * comp.ratio, comp.amp * masterAmp, getWaveform(comp.waveType));
          osc.patch(noteMixer);
        }
      }
      noteMixer.patch(env);
    } else {
      Oscil wave = new Oscil(baseFreq, masterAmp, getWaveform(type));
      wave.patch(env);
    }
    
    env.patch(mainMixer);
    env.noteOn();
    activeNotes.put(key, env);
    if (instName.equals(currentInstrument) && !instName.equals("")) {
      adsrTimer = millis(); adsrState = 1;
    }
  }

  void stopNoteInternal(String instName, int p) {
    if (instName == null || instName.length() == 0) instName = currentInstrument;
    String key = instName + "_" + p;
    ADSR adsr = activeNotes.get(key);
    if (adsr != null) {
      adsr.unpatchAfterRelease(mainMixer);
      adsr.noteOff();
      activeNotes.remove(key);
      if (instName.equals(currentInstrument) && !instName.equals("")) {
        adsrTimer = millis(); adsrState = 2;
      }
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
      adsrState = 0; // Reset light dot on instrument switch
      logToScreen("Instrument Switched: " + currentInstrument, 1);
      lastInstrument = currentInstrument;
    }
  }

  void playNoteForDuration(final String instName, int p, float vel, final float durationMs) {
    if (p < 0) return;
    playNoteInternal(instName, p, vel);
    final int pitch = p;
    new Thread(new Runnable() {
      public void run() {
        try { Thread.sleep((long)durationMs); } catch (Exception e) {}
        stopNoteInternal(instName, pitch);
      }
    }).start();
  }

  void playChordByNameInternal(String instName, String name, float durationMs, float vel) {
    String[] notes = chords.get(name);
    if (notes != null) {
      for (String n : notes) {
        int midi = noteToMidi(n);
        if (midi >= 0) playNoteForDuration(instName, midi, vel, durationMs);
      }
    }
  }

  void playMelodyInternal(String m, String i) {
    String[] tokens = splitTokens(m, ", \\t\\n\\r");
    for (String t : tokens) {
      parseAndPlayNote(i, t, 100);
    }
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
      float volScale = instrumentVolumes.getOrDefault(name, 1.0f);
      if (type.equals("DRUM")) {
        if (!noteName.equalsIgnoreCase("R") && samplerMap.containsKey(name)) {
          samplerGainMap.get(name).setValue(map(vel * volScale, 0, 127, -40, 0));
          samplerMap.get(name).trigger();
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
    checkMainMixer();
    if (out == null) return;
    float amp = map(v, 0, 127, 0, 1.0f);
    // Use TRIANGLE wave for better visibility on oscilloscope
    Oscil wave = new Oscil(freq, amp, Waves.TRIANGLE);
    // Increase duration to ~100ms to ensure frame capture
    ADSR adsr = new ADSR(1.0, 0.01f, 0.05f, 0.0f, 0.05f);
    wave.patch(adsr).patch(mainMixer);
    adsr.noteOn();
    try { Thread.sleep(80); } catch(Exception e) {} 
    adsr.noteOff();
    adsr.unpatchAfterRelease(mainMixer);
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
  
  Blockly.Processing.provideSetup(`
  checkMainMixer();
  `);
  return '';
});

registerGenerator('sb_drum_sampler', function(block) {
  const name = Blockly.Processing.currentGenInstrumentName;
  if (!name) return '// sb_drum_sampler must be inside sb_instrument_container\n';
  
  const type = block.getFieldValue('PATH');
  const path = (type === 'CUSTOM') ? block.getFieldValue('CUSTOM_PATH_VALUE') : type;
  
  let code = 'checkMainMixer();\n';
  code += 'samplerMap.put("' + name + '", new Sampler("' + path + '", 4, minim));\n';
  code += 'samplerGainMap.put("' + name + '", new Gain(0.f));\n';
  code += 'samplerMap.get("' + name + '").patch(samplerGainMap.get("' + name + '")).patch(mainMixer);\n';
  code += 'instrumentMap.put("' + name + '", "DRUM");\n';
  code += 'instrumentADSR.put("' + name + '", new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR});\n';
  return code;
});

registerGenerator('sb_melodic_sampler', function(block) {
  const name = Blockly.Processing.currentGenInstrumentName;
  if (!name) return '// sb_melodic_sampler must be inside sb_instrument_container\n';
  
  const type = block.getFieldValue('TYPE');
  let path = "";
  if (type === 'PIANO') path = "piano";
  else if (type === 'VIOLIN_PIZZ') path = "violin/violin-section-pizzicato";
  else if (type === 'VIOLIN_ARCO') path = "violin/violin-section-vibrato-sustain";
  else path = block.getFieldValue('CUSTOM_PATH_VALUE');

  let code = 'checkMainMixer();\n';
  code += 'if (!melodicSamplers.containsKey("' + name + '")) melodicSamplers.put("' + name + '", new MelodicSampler(minim));\n';
  code += 'melodicSamplers.get("' + name + '").loadSamples("' + path + '");\n';
  code += 'instrumentMap.put("' + name + '", "MELODIC_SAMPLER");\n';
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

registerGenerator('sb_set_instrument_volume', function(block) {
  const name = block.getFieldValue('NAME');
  const volume = Blockly.Processing.valueToCode(block, 'VOLUME', Blockly.Processing.ORDER_ATOMIC) || '100';
  return `instrumentVolumes.put("${name}", (float)${volume} / 100.0f);\n`;
});

registerGenerator('sb_play_note', function(block) {
  Blockly.Processing.injectAudioCore();
  const pitch = Blockly.Processing.valueToCode(block, 'PITCH', Blockly.Processing.ORDER_ATOMIC) || '60';
  const velocity = Blockly.Processing.valueToCode(block, 'VELOCITY', Blockly.Processing.ORDER_ATOMIC) || '100';
  return `playNoteInternal(currentInstrument, (int)${pitch}, (float)${velocity});\n`;
});

registerGenerator('sb_stop_note', function(block) {
  Blockly.Processing.injectAudioCore();
  const pitch = Blockly.Processing.valueToCode(block, 'PITCH', Blockly.Processing.ORDER_ATOMIC) || '60';
  return `stopNoteInternal(currentInstrument, (int)${pitch});\n`;
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
  code += '    ArrayList<String> parsed = new ArrayList<String>();\n';
  code += '    if (rawPattern.contains(",")) {\n';
  code += '      String[] parts = rawPattern.split(",");\n';
  code += '      for(String p : parts) parsed.add(p.trim());\n';
  code += '    } else {\n';
  code += '      String raw = rawPattern.replace("|", " ");\n';
  code += '      StringBuilder buf = new StringBuilder();\n';
  code += '      for (int i=0; i<raw.length(); i++) {\n';
  code += '        char c = raw.charAt(i);\n';
  code += '        if (c == \' \') {\n';
  code += '          if (buf.length() > 0) { parsed.add(buf.toString()); buf.setLength(0); }\n';
  code += '        } else if (c == \'.\' || c == \'-\') {\n';
  code += '          if (buf.length() > 0) { parsed.add(buf.toString()); buf.setLength(0); }\n';
  code += '          parsed.add(String.valueOf(c));\n';
  code += '        } else {\n';
  code += '          buf.append(c);\n';
  code += '        }\n';
  code += '      }\n';
  code += '      if (buf.length() > 0) parsed.add(buf.toString());\n';
  code += '    }\n';
  code += '    String[] steps = parsed.toArray(new String[0]);\n';
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
          code += '             float volScale = instrumentVolumes.getOrDefault("' + source + '", 1.0f);\n';
          code += '             samplerGainMap.get("' + source + '").setValue(map(' + velocity + ' * volScale, 0, 127, -40, 0));\n';
          code += '             samplerMap.get("' + source + '").trigger();\n';
          code += '          }\n';
          code += '        } else {\n';
  code += '          if (' + isChordMode + ') {\n';
  code += '            if (token.equals("x")) token = "C";\n';
  code += '            if (chords.containsKey(token)) playChordByNameInternal("' + source + '", token, noteDur * 0.9f, (float)' + velocity + ');\n';
  code += '            else { int midi = noteToMidi(token); if (midi >= 0) playNoteForDuration("' + source + '", midi, (float)' + velocity + ', noteDur * 0.9f); }\n';
  code += '          } else {\n';
  code += '            if (token.equalsIgnoreCase("x")) playNoteForDuration("' + source + '", 60, (float)' + velocity + ', noteDur * 0.8f);\n';
  code += '            else { int midi = noteToMidi(token); if (midi >= 0) playNoteForDuration("' + source + '", midi, (float)' + velocity + ', noteDur * 0.9f); }\n';
  code += '          }\n';
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
  const beats = Blockly.Processing.valueToCode(block, 'BEATS', Blockly.Processing.ORDER_ATOMIC) || '4';
  const beatUnit = Blockly.Processing.valueToCode(block, 'BEAT_UNIT', Blockly.Processing.ORDER_ATOMIC) || '4';
  const velocity = Blockly.Processing.valueToCode(block, 'VELOCITY', Blockly.Processing.ORDER_ATOMIC) || '100';
  
  const setupCode = `isCountingIn = true;
  new Thread(new Runnable() {
    public void run() {
      try {
        Thread.sleep(1000); 
        logToScreen("--- COUNT IN START (" + ${beats} + "/" + ${beatUnit} + ") ---", 1);
        float beatDelay = (60000.0f / bpm) * (4.0f / ${beatUnit});
        for (int m=0; m<${measures}; m++) {
          for (int b=0; b<(int)${beats}; b++) {
            playClick((b==0 ? 880.0f : 440.0f), (float)${velocity});
            Thread.sleep((long)beatDelay);
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

registerGenerator('sb_wait_musical', function(block) {
  const val = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_ATOMIC) || '1';
  const unit = block.getFieldValue('UNIT');
  
  let code = "";
  if (unit === 'BEATS') {
    code = `delay((int)((float)(${val}) * 60000.0f / bpm));\n`;
  } else if (unit === 'MEASURES') {
    code = `delay((int)((float)(${val}) * 4.0f * 60000.0f / bpm));\n`;
  } else if (unit === 'SECONDS') {
    code = `delay((int)((float)(${val}) * 1000.0f));\n`;
  } else if (unit === 'MICROS') {
    code = `try { long totalMicros = (long)(${val}); Thread.sleep(totalMicros / 1000, (int)((totalMicros % 1000) * 1000)); } catch(Exception e) {}\n`;
  } else {
    // Default MS
    code = `delay((int)(${val}));\n`;
  }
  return code;
});

registerGenerator('sb_musical_section', function(block) {
  const duration = Blockly.Processing.valueToCode(block, 'DURATION', Blockly.Processing.ORDER_ATOMIC) || '1';
  const branch = Blockly.Processing.statementToCode(block, 'STACK');
  
  return branch + `delay((int)((float)(${duration}) * 4.0f * 60000.0f / bpm));\n`;
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