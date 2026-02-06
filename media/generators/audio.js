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

  // Add standard Minim imports
  Blockly.Processing.addImport("import ddf.minim.*;");
  Blockly.Processing.addImport("import ddf.minim.ugens.*;");
  Blockly.Processing.addImport("import java.util.LinkedHashMap;");
  Blockly.Processing.addImport("import java.util.concurrent.*;");

  // Add global variables
  var g = Blockly.Processing.global_vars_;
  g['instrumentMap'] = "LinkedHashMap<String, String> instrumentMap = new LinkedHashMap<String, String>();";
  g['instrumentADSR'] = "LinkedHashMap<String, float[]> instrumentADSR = new LinkedHashMap<String, float[]>();";
  g['instrumentVolumes'] = "HashMap<String, Float> instrumentVolumes = new HashMap<String, Float>();";
  g['chords'] = "HashMap<String, String[]> chords = new HashMap<String, String[]>();";
  g['currentInstrument'] = 'String currentInstrument = "default";';
  g['lastInstrument'] = 'String lastInstrument = "";';
  g['mainMixer'] = "Summer mainMixer;";
  g['masterEffectEnd'] = "UGen masterEffectEnd;";
  g['masterGainUGen'] = "Gain masterGainUGen;";
  g['harmonicPartials'] = "HashMap<String, float[]> harmonicPartials = new HashMap<String, float[]>();";
  g['additiveConfigs'] = "HashMap<String, List<SynthComponent>> additiveConfigs = new HashMap<String, List<SynthComponent>>();";
  g['samplerMap'] = "HashMap<String, Sampler> samplerMap = new HashMap<String, Sampler>();";
  g['samplerGainMap'] = "HashMap<String, Gain> samplerGainMap = new HashMap<String, Gain>();";
  g['melodicSamplers'] = "HashMap<String, MelodicSampler> melodicSamplers = new HashMap<String, MelodicSampler>();";
  g['activeMelodyCount'] = "int activeMelodyCount = 0;";
  g['melodyLock'] = "final Object melodyLock = new Object();";
  g['isCountingIn'] = "volatile boolean isCountingIn = false;";
  g['midiKeysHeld'] = "HashMap<Integer, String> midiKeysHeld = new HashMap<Integer, String>();";
  g['instrumentMixConfigs'] = "HashMap instrumentMixConfigs = new HashMap();";
  
  // Effects Containers (Raw Type for max compatibility)
  g['instrumentMixers'] = "HashMap instrumentMixers = new HashMap();";
  g['instrumentEffectEnds'] = "HashMap instrumentEffectEnds = new HashMap();";
  g['instrumentFilters'] = "HashMap instrumentFilters = new HashMap();";
  g['instrumentDelays'] = "HashMap instrumentDelays = new HashMap();";
  g['instrumentBitCrushers'] = "HashMap instrumentBitCrushers = new HashMap();";
  g['instrumentCompressors'] = "HashMap instrumentCompressors = new HashMap();";
  g['instrumentLimiters'] = "HashMap instrumentLimiters = new HashMap();";
  g['instrumentWaveshapers'] = "HashMap instrumentWaveshapers = new HashMap();";
  g['instrumentReverbs'] = "HashMap instrumentReverbs = new HashMap();";
  g['instrumentFlangers'] = "HashMap instrumentFlangers = new HashMap();";
  g['instrumentAutoFilters'] = "HashMap instrumentAutoFilters = new HashMap();";
  g['instrumentAutoFilterLFOs'] = "HashMap instrumentAutoFilterLFOs = new HashMap();";
  g['instrumentPitchMods'] = "HashMap instrumentPitchMods = new HashMap();";
  g['instrumentPitchModLFOs'] = "HashMap instrumentPitchModLFOs = new HashMap();";
  g['instrumentPans'] = "HashMap instrumentPans = new HashMap();";

  // Core Classes and Methods
  g['bpm'] = "float bpm = 120.0;";
  g['masterGain'] = "float masterGain = -5.0;";
  g['defAdsrA'] = "float defAdsrA = 0.01;";
  g['defAdsrD'] = "float defAdsrD = 0.1;";
  g['defAdsrS'] = "float defAdsrS = 0.5;";
  g['defAdsrR'] = "float defAdsrR = 0.5;";

  // Core Classes and Methods
  Blockly.Processing.definitions_['AudioCore'] = `
  class SBWaveshaper extends ddf.minim.ugens.Summer {
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

  class SBReverb extends ddf.minim.ugens.Summer {
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
        // Parallel Combs
        float o1 = c1[p1]; c1[p1] = in + o1 * roomSize; p1 = (p1+1)%c1.length;
        float o2 = c2[p2]; c2[p2] = in + o2 * roomSize; p2 = (p2+1)%c2.length;
        float o3 = c3[p3]; c3[p3] = in + o3 * roomSize; p3 = (p3+1)%c3.length;
        float o4 = c4[p4]; c4[p4] = in + o4 * roomSize; p4 = (p4+1)%c4.length;
        out = (o1 + o2 + o3 + o4) * 0.25f;
        // Series All-passes
        float v1 = a1[ap1]; float tr1 = -0.5f * out + v1; a1[ap1] = out + 0.5f * v1; ap1 = (ap1+1)%a1.length; out = tr1;
        float v2 = a2[ap2]; float tr2 = -0.5f * out + v2; a2[ap2] = out + 0.5f * v2; ap2 = (ap2+1)%a2.length; out = tr2;
        channels[i] = channels[i] * (1.0f - wet) + out * wet;
      }
    }
  }

  class SBCompressor extends ddf.minim.ugens.Summer {
    float threshold = 1.0f; float ratio = 1.0f; float attack = 0.01f; float release = 0.1f; float makeup = 1.0f; float env = 0.0f;
    SBCompressor() { super(); }
    void setParams(float tDB, float r, float a, float re, float mDB) {
      threshold = (float)Math.pow(10, tDB/20.0f); ratio = r; attack = a; release = re; makeup = (float)Math.pow(10, mDB/20.0f);
    }
    protected void uGenerate(float[] channels) {
      super.uGenerate(channels); // 重要：拉取輸入音訊
      float attackCoef = (float)Math.exp(-1.0/(44100.0*attack)); float releaseCoef = (float)Math.exp(-1.0/(44100.0*release));
      for(int i=0; i<channels.length; i++) {
        float absIn = Math.abs(channels[i]);
        env = (absIn > env) ? attackCoef * env + (1.0f - attackCoef) * absIn : releaseCoef * env + (1.0f - releaseCoef) * absIn;
        float gain = 1.0f;
        if (env > threshold) { gain = (threshold + (env - threshold) / ratio) / (env + 0.00001f); }
        channels[i] *= gain * makeup;
      }
    }
  }

  int pitchTranspose = 0;

  class MelodicSampler {
    TreeMap<Integer, Sampler> samples = new TreeMap<Integer, Sampler>();
    TreeMap<Integer, TickRate> rates = new TreeMap<Integer, TickRate>();
    TreeMap<Integer, ADSR> adsrs = new TreeMap<Integer, ADSR>();
    Summer localMixer = new Summer();
    Minim m;
    String instName;
    
    MelodicSampler(Minim minim, String name) { 
      this.m = minim; 
      this.instName = name;
      checkMainMixer();
      localMixer.patch(getInstrumentMixer(instName));
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
      masterEffectEnd = mainMixer;
      masterGainUGen = new Gain(0.f);
      masterEffectEnd.patch(masterGainUGen).patch(out);
    }
  }

  ddf.minim.ugens.Summer getInstrumentMixer(String name) {
    checkMainMixer();
    if (instrumentMixers.containsKey(name)) return (ddf.minim.ugens.Summer)instrumentMixers.get(name);
    ddf.minim.ugens.Summer s = new ddf.minim.ugens.Summer();
    ddf.minim.ugens.Pan p = new ddf.minim.ugens.Pan(0.f);
    s.patch(p).patch(mainMixer);
    instrumentMixers.put(name, s);
    instrumentPans.put(name, p);
    // 關鍵：效果器鏈應該從 Summer 開始，插在 Pan 之前
    instrumentEffectEnds.put(name, s);
    return s;
  }

  void updateFilter(String name, float freq, float q) {
    Object obj = instrumentFilters.get(name);
    if (obj != null) {
      try {
        // MoogFilter uses .frequency.setLastValue()
        java.lang.reflect.Field fField = obj.getClass().getField("frequency");
        Object freqControl = fField.get(obj);
        java.lang.reflect.Field valField = freqControl.getClass().getField("value");
        valField.setFloat(freqControl, freq);
        
        java.lang.reflect.Field rField = obj.getClass().getField("resonance");
        Object resControl = rField.get(obj);
        java.lang.reflect.Field rValField = resControl.getClass().getField("value");
        rValField.setFloat(resControl, constrain(q, 0.0f, 0.9f));
      } catch (Exception e) {
        // Fallback for other filter types if they have setFreq
        try { obj.getClass().getMethod("setFreq", float.class).invoke(obj, freq); } catch(Exception ex) {}
      }
    }
  }

  void updatePanning(String name, float p) {
    Object obj = instrumentPans.get(name);
    if (obj != null) {
      try {
        java.lang.reflect.Field f = obj.getClass().getField("pan");
        Object control = f.get(obj);
        java.lang.reflect.Method m = control.getClass().getMethod("setLastValue", float.class);
        m.invoke(control, constrain(p, -1.0f, 1.0f));
      } catch (Exception e) {}
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

    if (type.equals("DRUM")) {
      if (samplerMap.containsKey(instName)) {
        float volScale = instrumentVolumes.getOrDefault(instName, 1.0f);
        ((ddf.minim.ugens.Gain)samplerGainMap.get(instName)).setValue(map(vel * volScale, 0, 127, -40, 0));
        ((ddf.minim.ugens.Sampler)samplerMap.get(instName)).trigger();
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
    } else if (type.equals("MIXED")) {
      String cfg = (String)instrumentMixConfigs.getOrDefault(instName, "SINE,WHITE,30,0,0,0");
      String[] parts = split(cfg, ",");
      if (parts.length >= 6) {
        String wType = parts[0]; String nType = parts[1]; 
        float nRatio = float(parts[2]) / 100.0f; float jitter = float(parts[3]);
        float sRate = float(parts[4]); float sDepth = float(parts[5]) / 100.0f;
        
        Oscil wave = new Oscil(0, masterAmp * (1.0f - nRatio), getWaveform(wType));
        
        // 建立頻率加總器，確保音高 + 抖動能同時生效
        Summer freqSum = new Summer();
        new Constant(baseFreq).patch(freqSum);
        if (jitter > 0) {
          // Jitter 縮小影響範圍，避免過度跑調
          new Noise(jitter * 2.0f, Noise.Tint.WHITE).patch(freqSum);
        }
        freqSum.patch(wave.frequency);
        
        Noise.Tint tint = Noise.Tint.WHITE;
        if (nType.equals("PINK")) tint = Noise.Tint.PINK; else if (nType.equals("BROWN")) tint = Noise.Tint.BROWN;
        Noise n = new Noise(masterAmp * nRatio, tint);
        
        wave.patch(noteMixer); n.patch(noteMixer);
        
        if (sDepth > 0) {
          // 掃頻：使用 Summer 確保 Filter 頻率 = Offset + LFO
          MoogFilter sweepF = new MoogFilter(0, 0.3f);
          Summer sweepSum = new Summer();
          // 基礎偏移量：設在基礎音高的 4 倍處
          new Constant(baseFreq * 4.0f).patch(sweepSum);
          // LFO 調變量
          Oscil lfo = new Oscil(sRate, baseFreq * sDepth * 3.0f, Waves.SINE);
          lfo.patch(sweepSum);
          // 最終將加總後的頻率 patch 到 Filter
          sweepSum.patch(sweepF.frequency);
          
          noteMixer.patch(sweepF).patch(env);
        } else {
          noteMixer.patch(env);
        }
      } else {
        noteMixer.patch(env);
      }
    } else {
      Oscil wave = new Oscil(baseFreq, masterAmp, getWaveform(type));
      wave.patch(env);
    }
    
    env.patch(getInstrumentMixer(instName));
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
      adsr.unpatchAfterRelease(getInstrumentMixer(instName));
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
  code += 'samplerMap.put("' + name + '", new ddf.minim.ugens.Sampler("' + path + '", 4, minim));\n';
  code += 'samplerGainMap.put("' + name + '", new Gain(0.f));\n';
  code += '((ddf.minim.ugens.Sampler)samplerMap.get("' + name + '")).patch((Gain)samplerGainMap.get("' + name + '")).patch(getInstrumentMixer("' + name + '"));\n';
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
  code += 'if (!melodicSamplers.containsKey("' + name + '")) melodicSamplers.put("' + name + '", new MelodicSampler(minim, "' + name + '"));\n';
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

registerGenerator('sb_rhythm_sequencer_v2', function(block) {
  const measure = block.getFieldValue('MEASURE') || '1';
  const beats = block.getFieldValue('BEATS') || '4';
  const resolution = block.getFieldValue('RESOLUTION') || '4';
  
  let code = "";
  for (let i = 0; i < block.itemCount_; i++) {
    const inst = block.getFieldValue('INST' + i) || "default";
    const vel = block.getFieldValue('VEL' + i) || "100";
    const isChordMode = (block.getFieldValue('MODE' + i) === 'TRUE');
    const pattern = block.getFieldValue('PATTERN' + i) || "";
    
    code += 'new Thread(new Runnable() {\n';
    code += '  public void run() {\n';
    code += '    int timeout = 0;\n';
    code += '    while(isCountingIn && timeout < 500) { try { Thread.sleep(10); timeout++; } catch(Exception e) {} }\n';
    code += '    try { float beatMs = 60000.0f / bpm;\n';
    code += '          float measureMs = beatMs * ' + beats + '.0f;\n';
    code += '          Thread.sleep((long)(((' + measure + '-1) * measureMs))); } catch(Exception e) {}\n';
    code += '    String rawPattern = "' + pattern + '";\n';
    code += '    ArrayList<String> parsed = new ArrayList<String>();\n';
    code += '    StringBuilder buf = new StringBuilder();\n';
    code += '    for (int j=0; j<rawPattern.length(); j++) {\n';
    code += '      char c = rawPattern.charAt(j);\n';
    code += '      if (c == \' \') {\n';
    code += '        if (buf.length() > 0) { parsed.add(buf.toString()); buf.setLength(0); }\n';
    code += '      } else if (c == \'.\' || c == \'-\' || c == \'|\') {\n';
    code += '        if (buf.length() > 0) { parsed.add(buf.toString()); buf.setLength(0); }\n';
    code += '        if (c != \'|\') parsed.add(String.valueOf(c));\n';
    code += '      } else {\n';
    code += '        buf.append(c);\n';
    code += '      }\n';
    code += '    }\n';
    code += '    if (buf.length() > 0) parsed.add(buf.toString());\n';
    code += '    String[] steps = parsed.toArray(new String[0]);\n';
    code += '    float stepMs = (60000.0f / bpm) / ' + resolution + '.0f;\n';
    code += '    for (int k=0; k<steps.length; k++) {\n';
    code += '      String token = steps[k].trim();\n';
    code += '      if (token.equals(".") || token.equals("-")) {\n';
    code += '        try { Thread.sleep((long)stepMs); } catch (Exception e) {} continue;\n';
    code += '      }\n';
    code += '      int sustainSteps = 1;\n';
    code += '      for (int next=k+1; next<steps.length; next++) {\n';
    code += '        if (steps[next].trim().equals("-")) sustainSteps++;\n';
    code += '        else break;\n';
    code += '      }\n';
    code += '      float noteDur = stepMs * sustainSteps;\n';
    code += '      if (token.length() > 0) {\n';
    code += '        if (instrumentMap.getOrDefault("' + inst + '", "").equals("DRUM")) {\n';
    code += '          if (token.equalsIgnoreCase("x")) {\n';
    code += '             float volScale = instrumentVolumes.getOrDefault("' + inst + '", 1.0f);\n';
    code += '             samplerGainMap.get("' + inst + '").setValue(map(' + vel + ' * volScale, 0, 127, -40, 0));\n';
    code += '             samplerMap.get("' + inst + '").trigger();\n';
    code += '          }\n';
    code += '        } else {\n';
    code += '          if (' + isChordMode + ') {\n';
    code += '            if (token.equals("x")) token = "C";\n';
    code += '            if (chords.containsKey(token)) playChordByNameInternal("' + inst + '", token, noteDur * 0.9f, (float)' + vel + ');\n';
    code += '            else { int midi = noteToMidi(token); if (midi >= 0) playNoteForDuration("' + inst + '", midi, (float)' + vel + ', noteDur * 0.9f); }\n';
    code += '          } else {\n';
    code += '            if (token.equalsIgnoreCase("x")) playNoteForDuration("' + inst + '", 60, (float)' + vel + ', noteDur * 0.8f);\n';
    code += '            else { int midi = noteToMidi(token); if (midi >= 0) playNoteForDuration("' + inst + '", midi, (float)' + vel + ', noteDur * 0.9f); }\n';
    code += '          }\n';
    code += '        }\n';
    code += '      }\n';
    code += '      try { Thread.sleep((long)stepMs); } catch (Exception e) {}\n';
    code += '    }\n';
    code += '  }\n';
    code += '}).start();\n';
  }
  return code;
});

registerGenerator('sb_musical_section', function(block) {
  const duration = Blockly.Processing.valueToCode(block, 'DURATION', Blockly.Processing.ORDER_ATOMIC) || '1';
  const branch = Blockly.Processing.statementToCode(block, 'STACK');
  
  return branch + `delay((int)((float)(${duration}) * 4.0f * 60000.0f / bpm));\n`;
});

registerGenerator('sb_setup_effect', function(block) {
  Blockly.Processing.injectAudioCore();
  let name = Blockly.Processing.currentGenInstrumentName;
  if (!name) name = "Master";
  
  const type = block.getFieldValue('EFFECT_TYPE');
  let code = `{\n`;
  
  // 核心修正：樂器效果的下一個目標是 Pan，Master 效果的下一個目標是總增益
  let finalTarget = (name === "Master") ? "masterGainUGen" : '((UGen)instrumentPans.getOrDefault("' + name + '", getInstrumentMixer("' + name + '")))';
  let endVar = (name === "Master") ? "masterEffectEnd" : '(UGen)instrumentEffectEnds.getOrDefault("' + name + '", getInstrumentMixer("' + name + '"))';

  if (type === 'filter') {
    const fType = block.getFieldValue('FILTER_TYPE_VALUE') || 'lowpass';
    const freq = Blockly.Processing.valueToCode(block, 'FILTER_FREQ', Blockly.Processing.ORDER_ATOMIC) || '1000';
    const q = Blockly.Processing.valueToCode(block, 'FILTER_Q', Blockly.Processing.ORDER_ATOMIC) || '1';
    
    code += '  if (instrumentFilters.containsKey("' + name + '")) {\n';
    code += '    updateFilter("' + name + '", (float)' + freq + ', (float)' + q + ');\n';
    code += '  } else {\n';
    code += '    UGen prev = ' + endVar + ';\n';
    code += '    prev.unpatch(' + finalTarget + ');\n';
    code += '    UGen f = null;\n';
    code += '    f = new MoogFilter((float)' + freq + ', constrain((float)' + q + ', 0.0f, 0.9f));\n';
    code += '    instrumentFilters.put("' + name + '", f);\n';
    code += '    prev.patch(f).patch(' + finalTarget + ');\n';
    if (name === "Master") code += '    masterEffectEnd = f;\n';
    else code += '    instrumentEffectEnds.put("' + name + '", f);\n';
    code += '  }\n';
  } else if (type === 'autofilter') {
    const rate = Blockly.Processing.valueToCode(block, 'RATE', Blockly.Processing.ORDER_ATOMIC) || '0.5';
    const depth = Blockly.Processing.valueToCode(block, 'DEPTH', Blockly.Processing.ORDER_ATOMIC) || '20';
    const q = Blockly.Processing.valueToCode(block, 'FILTER_Q', Blockly.Processing.ORDER_ATOMIC) || '0.4';
    
    code += '  if (instrumentAutoFilters.containsKey("' + name + '")) {\n';
    code += '    ddf.minim.ugens.Oscil lfo = (ddf.minim.ugens.Oscil)instrumentAutoFilterLFOs.get("' + name + '");\n';
    code += '    if (lfo != null) { lfo.setFrequency((float)' + rate + '); lfo.setAmplitude(1000.0f * (float)' + depth + '/100.0f); }\n';
    code += '    ddf.minim.ugens.MoogFilter f = (ddf.minim.ugens.MoogFilter)instrumentAutoFilters.get("' + name + '");\n';
    code += '    if (f != null) { f.resonance.setLastValue(constrain((float)' + q + ', 0.0f, 0.9f)); }\n';
    code += '  } else {\n';
    code += '    UGen prev = ' + endVar + ';\n';
    code += '    prev.unpatch(' + finalTarget + ');\n';
    code += '    ddf.minim.ugens.MoogFilter f = new ddf.minim.ugens.MoogFilter(1000, (float)' + q + ');\n';
    code += '    ddf.minim.ugens.Oscil lfo = new ddf.minim.ugens.Oscil((float)' + rate + ', 1000.0f * (float)' + depth + '/100.0f, Waves.SINE);\n';
    code += '    ddf.minim.ugens.Summer s = new ddf.minim.ugens.Summer();\n';
    code += '    new ddf.minim.ugens.Constant(1000).patch(s);\n';
    code += '    lfo.patch(s).patch(f.frequency);\n';
    code += '    instrumentAutoFilters.put("' + name + '", f);\n';
    code += '    instrumentAutoFilterLFOs.put("' + name + '", lfo);\n';
    code += '    prev.patch(f).patch(' + finalTarget + ');\n';
    if (name === "Master") code += '    masterEffectEnd = f;\n';
    else code += '    instrumentEffectEnds.put("' + name + '", f);\n';
    code += '  }\n';
  } else if (type === 'pitchmod') {
    const mType = block.getFieldValue('TYPE') || 'NOISE';
    const rate = Blockly.Processing.valueToCode(block, 'RATE', Blockly.Processing.ORDER_ATOMIC) || '5';
    const depth = Blockly.Processing.valueToCode(block, 'DEPTH', Blockly.Processing.ORDER_ATOMIC) || '10';
    
    code += '  if (instrumentPitchMods.containsKey("' + name + '")) {\n';
    code += '    UGen lfo = (UGen)instrumentPitchModLFOs.get("' + name + '");\n';
    code += '    if (lfo instanceof ddf.minim.ugens.Oscil) { ((ddf.minim.ugens.Oscil)lfo).setFrequency((float)' + rate + '); ((ddf.minim.ugens.Oscil)lfo).setAmplitude((float)' + depth + '/1200.0f); }\n';
    code += '    else if (lfo instanceof ddf.minim.ugens.Noise) { ((ddf.minim.ugens.Noise)lfo).amplitude.setLastValue((float)' + depth + '/240.0f); }\n';
    code += '  } else {\n';
    code += '    UGen prev = ' + endVar + ';\n';
    code += '    prev.unpatch(' + finalTarget + ');\n';
    code += '    ddf.minim.ugens.TickRate tr = new ddf.minim.ugens.TickRate(1.0f);\n';
    code += '    UGen lfo;\n';
    code += '    if ("' + mType + '".equals("NOISE")) lfo = new ddf.minim.ugens.Noise((float)' + depth + '/240.0f, ddf.minim.ugens.Noise.Tint.WHITE);\n';
    code += '    else lfo = new ddf.minim.ugens.Oscil((float)' + rate + ', (float)' + depth + '/1200.0f, Waves.SINE);\n';
    code += '    ddf.minim.ugens.Summer s = new ddf.minim.ugens.Summer();\n';
    code += '    new ddf.minim.ugens.Constant(1.0f).patch(s);\n';
    code += '    lfo.patch(s).patch(tr.value);\n';
    code += '    instrumentPitchMods.put("' + name + '", tr);\n';
    code += '    instrumentPitchModLFOs.put("' + name + '", lfo);\n';
    code += '    prev.patch(tr).patch(' + finalTarget + ');\n';
    if (name === "Master") code += '    masterEffectEnd = tr;\n';
    else code += '    instrumentEffectEnds.put("' + name + '", tr);\n';
    code += '  }\n';
  } else if (type === 'delay') {
    const time = Blockly.Processing.valueToCode(block, 'DELAY_TIME', Blockly.Processing.ORDER_ATOMIC) || '0.5';
    const feedback = Blockly.Processing.valueToCode(block, 'FEEDBACK', Blockly.Processing.ORDER_ATOMIC) || '0.5';
    code += '  if (instrumentDelays.containsKey("' + name + '")) {\n';
    code += '    try {\n';
    code += '      Object dObj = instrumentDelays.get("' + name + '");\n';
    code += '      java.lang.reflect.Field f = dObj.getClass().getField("delTime");\n';
    code += '      Object input = f.get(dObj);\n';
    code += '      input.getClass().getMethod("setLastValue", float.class).invoke(input, (float)' + time + ');\n';
    code += '    } catch (Exception e) {}\n';
    code += '  } else {\n';
    code += '    UGen prev = ' + endVar + ';\n';
    code += '    prev.unpatch(' + finalTarget + ');\n';
    code += '    Delay d = new Delay(' + time + ', ' + feedback + ', true, true);\n';
    code += '    instrumentDelays.put("' + name + '", d);\n';
    code += '    prev.patch(d).patch(' + finalTarget + ');\n';
    if (name === "Master") code += '    masterEffectEnd = d;\n';
    else code += '    instrumentEffectEnds.put("' + name + '", d);\n';
    code += '  }\n';
  } else if (type === 'bitcrush') {
    const bits = Blockly.Processing.valueToCode(block, 'BITDEPTH', Blockly.Processing.ORDER_ATOMIC) || '8';
    code += '  if (instrumentBitCrushers.containsKey("' + name + '")) {\n';
    code += '    try {\n';
    code += '      Object bObj = instrumentBitCrushers.get("' + name + '");\n';
    code += '      java.lang.reflect.Field f = bObj.getClass().getField("bitRes");\n';
    code += '      Object input = f.get(bObj);\n';
    code += '      input.getClass().getMethod("setLastValue", float.class).invoke(input, (float)' + bits + ');\n';
    code += '    } catch (Exception e) {}\n';
    code += '  } else {\n';
    code += '    UGen prev = ' + endVar + ';\n';
    code += '    prev.unpatch(' + finalTarget + ');\n';
    code += '    BitCrush bc = new BitCrush((float)' + bits + ', out.sampleRate());\n';
    code += '    instrumentBitCrushers.put("' + name + '", bc);\n';
    code += '    prev.patch(bc).patch(' + finalTarget + ');\n';
    if (name === "Master") code += '    masterEffectEnd = bc;\n';
    else code += '    instrumentEffectEnds.put("' + name + '", bc);\n';
    code += '  }\n';
  } else if (type === 'waveshaper') {
    const amount = Blockly.Processing.valueToCode(block, 'DISTORTION_AMOUNT', Blockly.Processing.ORDER_ATOMIC) || '2';
    code += '  if (instrumentWaveshapers.containsKey("' + name + '")) {\n';
    code += '    ((SBWaveshaper)instrumentWaveshapers.get("' + name + '")).setAmount((float)' + amount + ');\n';
    code += '  } else {\n';
    code += '    UGen prev = ' + endVar + ';\n';
    code += '    prev.unpatch(' + finalTarget + ');\n';
    code += '    SBWaveshaper ws = new SBWaveshaper();\n';
    code += '    ws.setAmount((float)' + amount + ');\n';
    code += '    instrumentWaveshapers.put("' + name + '", ws);\n';
    code += '    prev.patch(ws).patch(' + finalTarget + ');\n';
    if (name === "Master") code += '    masterEffectEnd = ws;\n';
    else code += '    instrumentEffectEnds.put("' + name + '", ws);\n';
    code += '  }\n';
  } else if (type === 'reverb') {
    const rs = Blockly.Processing.valueToCode(block, 'ROOMSIZE', Blockly.Processing.ORDER_ATOMIC) || '0.5';
    const damp = Blockly.Processing.valueToCode(block, 'DAMPING', Blockly.Processing.ORDER_ATOMIC) || '0.5';
    const wet = Blockly.Processing.valueToCode(block, 'WET', Blockly.Processing.ORDER_ATOMIC) || '0.3';
    
    code += '  if (instrumentReverbs.containsKey("' + name + '")) {\n';
    code += '    ((SBReverb)instrumentReverbs.get("' + name + '")).setParams((float)' + rs + ', (float)' + damp + ', (float)' + wet + ');\n';
    code += '  } else {\n';
    code += '    UGen prev = ' + endVar + ';\n';
    code += '    prev.unpatch(' + finalTarget + ');\n';
    code += '    SBReverb rv = new SBReverb();\n';
    code += '    rv.setParams((float)' + rs + ', (float)' + damp + ', (float)' + wet + ');\n';
    code += '    instrumentReverbs.put("' + name + '", rv);\n';
    code += '    prev.patch(rv).patch(' + finalTarget + ');\n';
    if (name === "Master") code += '    masterEffectEnd = rv;\n';
    else code += '    instrumentEffectEnds.put("' + name + '", rv);\n';
    code += '  }\n';
  } else if (type === 'flanger') {
    const delay = Blockly.Processing.valueToCode(block, 'DELAY_TIME', Blockly.Processing.ORDER_ATOMIC) || '1';
    const rate = Blockly.Processing.valueToCode(block, 'RATE', Blockly.Processing.ORDER_ATOMIC) || '0.5';
    const depth = Blockly.Processing.valueToCode(block, 'DEPTH', Blockly.Processing.ORDER_ATOMIC) || '1';
    const feedback = Blockly.Processing.valueToCode(block, 'FEEDBACK', Blockly.Processing.ORDER_ATOMIC) || '0.5';
    
    code += '  if (instrumentFlangers.containsKey("' + name + '")) {\n';
    code += '    try {\n';
    code += '      Object fl = instrumentFlangers.get("' + name + '");\n';
    code += '      java.lang.reflect.Field fDelay = fl.getClass().getField("delay"); ((ddf.minim.UGen.UGenInput)fDelay.get(fl)).setLastValue((float)' + delay + ');\n';
    code += '      java.lang.reflect.Field fRate = fl.getClass().getField("rate"); ((ddf.minim.UGen.UGenInput)fRate.get(fl)).setLastValue((float)' + rate + ');\n';
    code += '      java.lang.reflect.Field fDepth = fl.getClass().getField("depth"); ((ddf.minim.UGen.UGenInput)fDepth.get(fl)).setLastValue((float)' + depth + ');\n';
    code += '      java.lang.reflect.Field fFeedback = fl.getClass().getField("feedback"); ((ddf.minim.UGen.UGenInput)fFeedback.get(fl)).setLastValue((float)' + feedback + ');\n';
    code += '    } catch (Exception e) { e.printStackTrace(); }\n';
    code += '  } else {\n';
    code += '    UGen prev = ' + endVar + ';\n';
    code += '    prev.unpatch(' + finalTarget + ');\n';
    code += '    Flanger f = new Flanger((float)' + delay + ', (float)' + rate + ', (float)' + depth + ', (float)' + feedback + ', 0.5f, 0.5f);\n';
    code += '    instrumentFlangers.put("' + name + '", f);\n';
    code += '    prev.patch(f).patch(' + finalTarget + ');\n';
    if (name === "Master") code += '    masterEffectEnd = f;\n';
    else code += '    instrumentEffectEnds.put("' + name + '", f);\n';
    code += '  }\n';
  } else if (type === 'compressor') {
    const threshold = Blockly.Processing.valueToCode(block, 'THRESHOLD', Blockly.Processing.ORDER_ATOMIC) || '-20';
    const ratio = Blockly.Processing.valueToCode(block, 'RATIO', Blockly.Processing.ORDER_ATOMIC) || '4';
    const attack = Blockly.Processing.valueToCode(block, 'ATTACK', Blockly.Processing.ORDER_ATOMIC) || '0.01';
    const release = Blockly.Processing.valueToCode(block, 'RELEASE', Blockly.Processing.ORDER_ATOMIC) || '0.25';
    const makeup = Blockly.Processing.valueToCode(block, 'MAKEUP', Blockly.Processing.ORDER_ATOMIC) || '0';
    
    code += '  if (instrumentCompressors.containsKey("' + name + '")) {\n';
    code += '    ((SBCompressor)instrumentCompressors.get("' + name + '")).setParams((float)' + threshold + ', (float)' + ratio + ', (float)' + attack + ', (float)' + release + ', (float)' + makeup + ');\n';
    code += '  } else {\n';
    code += '    UGen prev = ' + endVar + ';\n';
    code += '    prev.unpatch(' + finalTarget + ');\n';
    code += '    SBCompressor c = new SBCompressor();\n';
    code += '    c.setParams((float)' + threshold + ', (float)' + ratio + ', (float)' + attack + ', (float)' + release + ', (float)' + makeup + ');\n';
    code += '    instrumentCompressors.put("' + name + '", c);\n';
    code += '    prev.patch(c).patch(' + finalTarget + ');\n';
    if (name === "Master") code += '    masterEffectEnd = c;\n';
    else code += '    instrumentEffectEnds.put("' + name + '", c);\n';
    code += '  }\n';
  } else if (type === 'limiter') {
    const threshold = Blockly.Processing.valueToCode(block, 'THRESHOLD', Blockly.Processing.ORDER_ATOMIC) || '-3';
    const attack = Blockly.Processing.valueToCode(block, 'ATTACK', Blockly.Processing.ORDER_ATOMIC) || '0.001';
    const release = Blockly.Processing.valueToCode(block, 'RELEASE', Blockly.Processing.ORDER_ATOMIC) || '0.1';
    
    code += '  if (instrumentLimiters.containsKey("' + name + '")) {\n';
    code += '    ((SBCompressor)instrumentLimiters.get("' + name + '")).setParams((float)' + threshold + ', 20.0f, (float)' + attack + ', (float)' + release + ', 0.0f);\n';
    code += '  } else {\n';
    code += '    UGen prev = ' + endVar + ';\n';
    code += '    prev.unpatch(' + finalTarget + ');\n';
    code += '    SBCompressor c = new SBCompressor();\n';
    code += '    c.setParams((float)' + threshold + ', 20.0f, (float)' + attack + ', (float)' + release + ', 0.0f);\n';
    code += '    instrumentLimiters.put("' + name + '", c);\n';
    code += '    prev.patch(c).patch(' + finalTarget + ');\n';
    if (name === "Master") code += '    masterEffectEnd = c;\n';
    else code += '    instrumentEffectEnds.put("' + name + '", c);\n';
    code += '  }\n';
  }
  code += `}\n`;
  return code;
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



registerGenerator('sb_set_noise', function(block) {



  if (!Blockly.Processing.currentGenInstrumentName) return '// sb_set_noise must be inside sb_instrument_container\n';



  const type = block.getFieldValue('TYPE');



  return `instrumentMap.put("${Blockly.Processing.currentGenInstrumentName}", "NOISE_${type}");\n`;



});







registerGenerator('sb_mixed_source', function(block) {







  if (!Blockly.Processing.currentGenInstrumentName) return '// sb_mixed_source must be inside sb_instrument_container\n';







  const wave = block.getFieldValue('WAVE');







  const noise = block.getFieldValue('NOISE');







  const level = Blockly.Processing.valueToCode(block, 'LEVEL', Blockly.Processing.ORDER_ATOMIC) || '30';







  const jitter = (block.hasJitter_) ? (Blockly.Processing.valueToCode(block, 'JITTER_INPUT', Blockly.Processing.ORDER_ATOMIC) || '5') : '0';







  const sRate = (block.hasSweep_) ? (Blockly.Processing.valueToCode(block, 'SWEEP_INPUT', Blockly.Processing.ORDER_ATOMIC) || '0.5') : '0';







  const sDepth = (block.hasSweep_) ? (Blockly.Processing.valueToCode(block, 'SWEEP_DEPTH_INPUT', Blockly.Processing.ORDER_ATOMIC) || '20') : '0';







  







  const name = Blockly.Processing.currentGenInstrumentName;







  let code = `instrumentMap.put("${name}", "MIXED");\n`;







  code += `instrumentMixConfigs.put("${name}", "${wave},${noise}," + ${level} + ",${jitter},${sRate},${sDepth}");\n`;







  return code;







});















registerGenerator('sb_set_panning', function(block) {

  const name = block.getFieldValue('NAME');

  const val = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_ATOMIC) || '0';

  return `updatePanning("${name}", (float)${val});\n`;

});
