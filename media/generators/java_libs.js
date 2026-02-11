/**
 * @fileoverview Java Library Strings for Processing.
 * Contains common classes and methods to be injected into PDE.
 */

window.SB_JavaLibs = window.SB_JavaLibs || {};

/**
 * --- Audio Core Classes ---
 */
window.SB_JavaLibs.AUDIO_CLASSES = `
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
            Sampler s = new Sampler(folder + "/" + fullName, 4, m); TickRate tr = new TickRate(1.f);
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
`;

/**
 * --- Audio Helper Methods ---
 */
window.SB_JavaLibs.AUDIO_HELPERS = `
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
      Sampler s = new Sampler(path, 4, minim); Gain g = new Gain(0.f);
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

  void playMelodyInternal(String m, String i) { String[] tokens = splitTokens(m, ", \\t\\n\\r"); for (String t : tokens) parseAndPlayNote(i, t, 100); }

  void parseAndPlayNote(String name, String token, float vel) {
    token = token.trim(); if (token.length() < 1) return; activeMelodyCount++; float totalMs = 0; String noteName = "";
    String[] parts = token.split("\\\\+");
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
`;

/**
 * --- General PDE Helper Methods ---
 */
window.SB_JavaLibs.GENERAL_HELPERS = `
  void logToScreen(String msg, int type) {
    if (cp5 == null) { println("[Early Log] " + msg); return; }
    Textarea target = (type >= 1) ? cp5.get(Textarea.class, "alertsArea") : cp5.get(Textarea.class, "consoleArea");
    if (target != null) {
      String prefix = (type == 3) ? "[ERR] " : (type == 2) ? "[WARN] " : (type == 1) ? "[!] " : "[INFO] ";
      target.append(prefix + msg + "\\n"); target.scroll(1.0);
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
      try { myPort = new Serial(this, ports[n], serialBaud); myPort.bufferUntil('\\n'); logToScreen("Serial Connected: " + ports[n], 1); }
      catch (Exception e) { logToScreen("Serial Error: Port Busy or Unavailable", 3); }
    }
  }

  void scanMidi() {
    String[] inputs = MidiBus.availableInputs(); ScrollableList sl = cp5.get(ScrollableList.class, "midiInputDevice");
    if (sl != null) { sl.clear(); for (int i = 0; i < inputs.length; i++) { sl.addItem(inputs[i], i); } logToScreen("MIDI Scanned: " + inputs.length + " devices found.", 1); }
  }

  void copyLogs() {
    Textarea console = cp5.get(Textarea.class, "consoleArea"); Textarea alerts = cp5.get(Textarea.class, "alertsArea");
    String content = "--- ALERTS ---\\n" + (alerts != null ? alerts.getText() : "") + "\\n\\n--- CONSOLE ---\\n" + (console != null ? console.getText() : "");
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
    {{KEY_PRESSED_EVENT_PLACEHOLDER}}
  }

  void keyReleased() {
    int p = -1; char k = Character.toLowerCase(key);
    if (k == 'q') p = 60; else if (k == '2') p = 61; else if (k == 'w') p = 62; else if (k == '3') p = 63; else if (k == 'e') p = 64; else if (k == 'r') p = 65;
    else if (k == '5') p = 66; else if (k == 't') p = 67; else if (k == '6') p = 68; else if (k == 'y') p = 69; else if (k == '7') p = 70; else if (k == 'u') p = 71;
    else if (k == 'i') p = 72; else if (k == '9') p = 73; else if (k == 'o') p = 74; else if (k == '0') p = 75; else if (k == 'p') p = 76;
    if (p != -1) { if (pcKeysHeld.containsKey(p)) { String inst = pcKeysHeld.get(p); stopNoteInternal(inst, p); pcKeysHeld.remove(p); logToScreen("Keyboard OFF: MIDI " + p, 0); } }
    {{KEY_RELEASED_EVENT_PLACEHOLDER}}
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
`;