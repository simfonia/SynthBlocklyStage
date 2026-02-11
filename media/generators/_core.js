/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 * @fileoverview Helper functions for generating Processing (Java) for blocks.
 */

Blockly.Processing = new Blockly.Generator('Processing');
Blockly.Processing.forBlock = {}; 

// Proxy blockToCode to handle missing generators gracefully
const originalBlockToCode = Blockly.Processing.blockToCode;
Blockly.Processing.blockToCode = function(block) {
  if (!block) return '';
  
  // Try to sync modern and legacy generator locations
  if (!this.forBlock[block.type] && this[block.type]) {
    this.forBlock[block.type] = this[block.type];
  }

  // If still not found, return a safe comment instead of throwing error
  if (!this.forBlock[block.type]) {
    console.warn('Missing generator for block type: ' + block.type);
    return '/* Missing generator for ' + block.type + ' */\n';
  }

  return originalBlockToCode.call(this, block);
};

/**
 * List of reserved words for Processing (Java).
 */
Blockly.Processing.addReservedWords(
    'setup,draw,if,else,for,switch,case,while,do,break,continue,return,void,boolean,char,byte,int,long,float,double,String,Array,color,PImage,PFont,PShape,size,background,fill,noFill,stroke,noStroke,strokeWeight,rect,ellipse,line,point,triangle,quad,arc,curve,bezier,map,constrain,abs,min,max,sin,cos,tan,random,println,millis,width,height,mouseX,mouseY,mousePressed,keyPressed,key,keyCode'
);

Blockly.Processing.ORDER_ATOMIC = 0;
Blockly.Processing.ORDER_NEW = 1.1;
Blockly.Processing.ORDER_MEMBER = 1.2;
Blockly.Processing.ORDER_FUNCTION_CALL = 2;
Blockly.Processing.ORDER_MULTIPLICATION = 5.1;
Blockly.Processing.ORDER_DIVISION = 5.2;
Blockly.Processing.ORDER_ADDITION = 6.2;
Blockly.Processing.ORDER_SUBTRACTION = 6.1;
Blockly.Processing.ORDER_RELATIONAL = 8;
Blockly.Processing.ORDER_EQUALITY = 9;
Blockly.Processing.ORDER_LOGICAL_AND = 13;
Blockly.Processing.ORDER_LOGICAL_OR = 14;
Blockly.Processing.ORDER_ASSIGNMENT = 16;
Blockly.Processing.ORDER_NONE = 99;

/**
 * Initialize the generator.
 */
Blockly.Processing.init = function(workspace) {
  Blockly.Processing.imports_ = Object.create(null);
  Blockly.Processing.global_vars_ = Object.create(null);
  Blockly.Processing.definitions_ = Object.create(null); 
  Blockly.Processing.setups_ = Object.create(null);
  Blockly.Processing.draws_ = Object.create(null); 
  Blockly.Processing.keyEvents_ = [];

  // Standard Imports for Lists and Utils
  Blockly.Processing.addImport("import java.util.*;");
  Blockly.Processing.addImport("import ddf.minim.*;");
  Blockly.Processing.addImport("import ddf.minim.ugens.*;");

  // Helper function for dynamic type conversion (Object to float)
  Blockly.Processing.definitions_['Helper_floatVal'] = 
    "float floatVal(Object o) {\n" +
    "  if (o == null) return 0.0f;\n" +
    "  if (o instanceof Number) return ((Number)o).floatValue();\n" +
    "  try { return Float.parseFloat(o.toString()); }\n" +
    "  catch (Exception e) { return 0.0f; }\n" +
    "}\n" +
    "int getMidi(Object o) {\n" +
    "  if (o == null) return -1;\n" +
    "  if (o instanceof Number) return ((Number)o).intValue();\n" +
    "  return noteToMidi(o.toString());\n" +
    "}";

  if (!Blockly.Processing.nameDB_) {
    Blockly.Processing.nameDB_ = new Blockly.Names(Blockly.Processing.RESERVED_WORDS_);
  } else {
    Blockly.Processing.nameDB_.reset();
  }
  Blockly.Processing.nameDB_.setVariableMap(workspace.getVariableMap());
};

/**
 * 輔助函數：計算相對索引 (0-based)
 */
Blockly.Processing.getRelativeIndex = function(block, name) {
  const at = Blockly.Processing.valueToCode(block, name, Blockly.Processing.ORDER_ADDITION) || '1';
  return window.SB_Utils.getRelativeIndex(at);
};

/**
 * 輔助函數：添加 Import 語句
 */
Blockly.Processing.addImport = function(importStr) {
  if (Blockly.Processing.imports_) {
    Blockly.Processing.imports_[importStr] = importStr;
  }
};

/**
 * 輔助函數：注入程式碼到 setup()
 * @param {string} code 程式碼
 * @param {string} opt_key 可選的唯一 Key，用於防止重複注入
 */
Blockly.Processing.provideSetup = function(code, opt_key) {
  if (Blockly.Processing.setups_) {
    var id = opt_key || 'setup_' + Object.keys(Blockly.Processing.setups_).length;
    Blockly.Processing.setups_[id] = code;
  }
};

/**
 * 輔助函數：注入程式碼到 draw() 的開頭
 */
Blockly.Processing.provideDraw = function(code, opt_key) {
  if (Blockly.Processing.draws_) {
    var id = opt_key || 'draw_' + Object.keys(Blockly.Processing.draws_).length;
    Blockly.Processing.draws_[id] = code;
  }
};

/**
 * Finish the code generation.
 */
Blockly.Processing.finish = function(code) {
  // 1. 處理 Imports
  const uniqueImports = new Set();
  if (Blockly.Processing.imports_) {
    Object.values(Blockly.Processing.imports_).forEach(imp => {
      if (imp) {
        let cleanImp = imp.trim();
        if (cleanImp && !cleanImp.endsWith(';')) cleanImp += ';';
        if (cleanImp) uniqueImports.add(cleanImp);
      }
    });
  }
  const importsStr = Array.from(uniqueImports).sort().join('\n');

  // 2. 處理全域變數
  const globalVars = Object.values(Blockly.Processing.global_vars_ || {})
    .map(v => v.trim())
    .filter(v => v !== "")
    .sort()
    .join('\n');
  
  // --- 處理 MIDI 事件 ---
  const noteOnEvents = (Blockly.Processing.definitions_['midi_events_note_on'] || []).join('\n');
  const noteOffEvents = (Blockly.Processing.definitions_['midi_events_note_off'] || []).join('\n');
  const ccEvents = (Blockly.Processing.definitions_['midi_events_cc'] || []).join('\n');

  if (noteOnEvents || noteOffEvents || ccEvents) {
    let midiFuncs = `
void noteOn(int channel, int pitch, int velocity) {
  if (midiBusses.size() == 1) { for (String name : midiBusses.keySet()) { noteOn(channel, pitch, velocity, name); } }
  else { noteOn(channel, pitch, velocity, "MIDI_1"); }
}
void noteOff(int channel, int pitch, int velocity) {
  if (midiBusses.size() == 1) { for (String name : midiBusses.keySet()) { noteOff(channel, pitch, velocity, name); } }
  else { noteOff(channel, pitch, velocity, "MIDI_1"); }
}
void controllerChange(int channel, int number, int value) {
  if (midiBusses.size() == 1) { for (String name : midiBusses.keySet()) { controllerChange(channel, number, value, name); } }
  else { controllerChange(channel, number, value, "MIDI_1"); }
}
void noteOn(int channel, int pitch, int velocity, String bus_name) {
  logToScreen("[" + bus_name + "] Note ON - P: " + pitch + " V: " + velocity, 0);
  midiKeysHeld.put(pitch, currentInstrument);
${noteOnEvents}
}
void noteOff(int channel, int pitch, int velocity, String bus_name) {
  logToScreen("[" + bus_name + "] Note OFF - P: " + pitch, 0);
  String memorizedInst = midiKeysHeld.get(pitch);
  if (memorizedInst != null) {
    String backup = currentInstrument; currentInstrument = memorizedInst;
${noteOffEvents}
    currentInstrument = backup; midiKeysHeld.remove(pitch);
  } else { ${noteOffEvents} }
}
void controllerChange(int channel, int number, int value, String bus_name) { ${ccEvents} }
    `;
    Blockly.Processing.definitions_['midi_callbacks'] = midiFuncs;
  }
  delete Blockly.Processing.definitions_['midi_events_note_on'];
  delete Blockly.Processing.definitions_['midi_events_note_off'];
  delete Blockly.Processing.definitions_['midi_events_cc'];

  // 3. 處理定義 (含佔位符)
  let definitionsStr = Object.values(Blockly.Processing.definitions_ || {})
    .map(d => d.trim()).filter(d => d !== "").join('\n\n');

  let pressedEventsCode = "";
  let releasedEventsCode = "";
  if (Blockly.Processing.keyEvents_) {
    Blockly.Processing.keyEvents_.forEach(ev => {
      let eventCode = `if (k == '${ev.key}') {\n      ${ev.code.replace(/\n/g, '\n      ')}\n    }\n    `;
      if (ev.mode === 'RELEASED') releasedEventsCode += eventCode;
      else pressedEventsCode += eventCode;
    });
  }
  let finalDefinitions = definitionsStr
    .replace('{{KEY_PRESSED_EVENT_PLACEHOLDER}}', pressedEventsCode)
    .replace('{{KEY_RELEASED_EVENT_PLACEHOLDER}}', releasedEventsCode);

  // 4. Setup 函式 (核心優化：排序與去重)
  const setupParts = Blockly.Processing.setups_ || {};
  let sortedSetup = [];
  
  // 絕對優先：size() 與 pixelDensity()
  // 注意：這些 Key 需要在各個產生器中配合使用
  if (setupParts['stage_init_size']) {
    sortedSetup.push(setupParts['stage_init_size']);
    delete setupParts['stage_init_size'];
  }
  if (setupParts['stage_init_density']) {
    sortedSetup.push(setupParts['stage_init_density']);
    delete setupParts['stage_init_density'];
  }
  
  // 其次：音訊引擎初始化
  if (setupParts['sb_audio_init']) {
    sortedSetup.push(setupParts['sb_audio_init']);
    delete setupParts['sb_audio_init'];
  }

  // 其餘按順序加入
  Object.values(setupParts).forEach(s => {
    let clean = s.trim();
    if (clean) sortedSetup.push(clean);
  });

  const setup = 'void setup() {\n  ' + sortedSetup.join('\n  ').replace(/\n/g, '\n  ') + '\n}\n';
  
  // 5. Draw 函式
  const drawParts = Object.values(Blockly.Processing.draws_ || [])
    .map(d => d.trim()).filter(d => d !== "");
  const fullDrawCode = (drawParts.join('\n') + '\n' + code).trim();
  const draw = 'void draw() {\n  ' + (fullDrawCode ? fullDrawCode.replace(/\n/g, '\n  ') : '') + '\n}\n';

  // 6. 最終組合
  let segments = [];
  if (importsStr) segments.push(importsStr);
  if (globalVars) segments.push(globalVars);
  if (finalDefinitions) segments.push(finalDefinitions);
  segments.push(setup);
  segments.push(draw);

  const finalCode = segments.join('\n\n').trim();
  
  delete Blockly.Processing.imports_;
  delete Blockly.Processing.global_vars_;
  delete Blockly.Processing.definitions_;
  delete Blockly.Processing.setups_;
  delete Blockly.Processing.draws_;
  
  return finalCode; 
};

Blockly.Processing.scrubNakedValue = function(line) {
  return line + ';\n';
};

Blockly.Processing.quote_ = function(string) {
  return '"' + string.replace(/\\/g, '\\\\').replace(/"/g, '"') + '"';
};

Blockly.Processing.scrub_ = function(block, code) {
  var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  var nextCode = Blockly.Processing.blockToCode(nextBlock);
  return code + nextCode;
};

/**
 * 輔助方法：註冊產生器並相容舊版位置
 */
Blockly.Processing.registerGenerator = function(type, func) {
  Blockly.Processing.forBlock[type] = func;
  Blockly.Processing[type] = func; 
};

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
  g['mainMixer'] = "SBSummer mainMixer;";
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
  g['midiKeysHeld'] = "ConcurrentHashMap<Integer, String> midiKeysHeld = new ConcurrentHashMap<Integer, String>();";
  g['midiBusses'] = "HashMap<String, MidiBus> midiBusses = new HashMap<String, MidiBus>();";
  g['instrumentMixConfigs'] = "HashMap instrumentMixConfigs = new HashMap();";
  g['isMasterClipping'] = "volatile boolean isMasterClipping = false;";
  g['clippingTimer'] = "long clippingTimer = 0;";
  
  // Effects Containers
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

  // Core Parameters
  g['bpm'] = "float bpm = 120.0;";
  g['masterGain'] = "float masterGain = -5.0;";
  g['defAdsrA'] = "float defAdsrA = 0.01;";
  g['defAdsrD'] = "float defAdsrD = 0.1;";
  g['defAdsrS'] = "float defAdsrS = 0.5;";
  g['defAdsrR'] = "float defAdsrR = 0.5;";

  Blockly.Processing.definitions_['AudioCore'] = `
  class SBSummer extends ddf.minim.ugens.Summer {
    protected void uGenerate(float[] channels) {
      super.uGenerate(channels);
    }
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
        if (env > threshold) { 
          gain = (threshold + (env - threshold) / ratio) / (env + 0.00001f); 
        }
        channels[i] *= gain * makeup;
      }
    }
  }

  int pitchTranspose = 0;

  class MelodicSampler {
    TreeMap<Integer, Sampler> samples = new TreeMap<Integer, Sampler>();
    TreeMap<Integer, TickRate> rates = new TreeMap<Integer, TickRate>();
    TreeMap<Integer, ADSR> adsrs = new TreeMap<Integer, ADSR>();
    SBSummer localMixer = new SBSummer();
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
            ADSR a = new ADSR(1.0, 0.001f, 0.001f, 1.0f, 0.5f);
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
    if (out == null) out = minim.getLineOut(Minim.STEREO); 
    if (mainMixer == null) {
      mainMixer = new SBSummer();
      masterEffectEnd = mainMixer;
      masterGainUGen = new Gain(0.f);
      masterEffectEnd.patch(masterGainUGen).patch(out);
      getInstrumentMixer("default");
    }
  }

  ddf.minim.ugens.Summer getInstrumentMixer(String name) {
    checkMainMixer();
    if (instrumentMixers.containsKey(name)) return (ddf.minim.ugens.Summer)instrumentMixers.get(name);
    SBSummer s = new SBSummer();
    SBPan p = new SBPan(0.f);
    s.patch(p);
    p.patch(mainMixer);
    instrumentMixers.put(name, s);
    instrumentPans.put(name, p);
    instrumentEffectEnds.put(name, s);
    return s;
  }

  void playBuiltinDrum(String type, float vel) {
    checkMainMixer();
    String instName = "_builtin_" + type;
    if (!samplerMap.containsKey(instName)) {
      String path = "drum/";
      if (type.equals("KICK")) path += "kick.wav";
      else if (type.equals("SNARE")) path += "snare.wav";
      else if (type.equals("CH")) path += "ch.wav";
      else if (type.equals("OH")) path += "oh.wav";
      else if (type.equals("CLAP")) path += "clap.wav";
      else return;
      Sampler s = new Sampler(path, 4, minim);
      Gain g = new Gain(0.f);
      s.patch(g).patch(getInstrumentMixer(instName));
      samplerMap.put(instName, s);
      samplerGainMap.put(instName, g);
      instrumentMap.put(instName, "DRUM");
    }
    Sampler s = samplerMap.get(instName);
    Gain g = samplerGainMap.get(instName);
    if (s != null && g != null) {
      g.setValue(map(vel, 0, 127, -40, 0));
      s.trigger();
    }
  }

  void updateFilter(String name, float freq, float q) {
    Object obj = instrumentFilters.get(name);
    if (obj != null) {
      try {
        java.lang.reflect.Field fField = obj.getClass().getField("frequency");
        Object freqControl = fField.get(obj);
        java.lang.reflect.Field valField = freqControl.getClass().getField("value");
        valField.setFloat(freqControl, freq);
        java.lang.reflect.Field rField = obj.getClass().getField("resonance");
        Object resControl = rField.get(obj);
        java.lang.reflect.Field rValField = resControl.getClass().getField("value");
        rValField.setFloat(resControl, constrain(q, 0.0f, 0.9f));
      } catch (Exception e) {
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
    if (n.equals("X")) return 69;
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

  ConcurrentHashMap<String, ADSR> activeNotes = new ConcurrentHashMap<String, ADSR>();

  void playNoteInternal(String instName, int p, float vel) {
    if (instName == null || instName.length() == 0) instName = currentInstrument;
    if (p < 0) return;
    String key = instName + "_" + p;
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
          if (instName.equals(currentInstrument) && !instName.equals("")) { adsrTimer = millis(); adsrState = 1; }
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
    SBSummer noteMixer = new SBSummer(); 
    
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
        Summer freqSum = new SBSummer();
        new Constant(baseFreq).patch(freqSum);
        if (jitter > 0) { new Noise(jitter * 2.0f, Noise.Tint.WHITE).patch(freqSum); }
        freqSum.patch(wave.frequency);
        Noise.Tint tint = Noise.Tint.WHITE;
        if (nType.equals("PINK")) tint = Noise.Tint.PINK; else if (nType.equals("BROWN")) tint = Noise.Tint.BROWN;
        Noise n = new Noise(masterAmp * nRatio, tint);
        wave.patch(noteMixer); n.patch(noteMixer);
        if (sDepth > 0) {
          MoogFilter sweepF = new MoogFilter(0, 0.3f);
          Summer sweepSum = new SBSummer();
          new Constant(baseFreq * 4.0f).patch(sweepSum);
          Oscil lfo = new Oscil(sRate, baseFreq * sDepth * 3.0f, Waves.SINE);
          lfo.patch(sweepSum).patch(sweepF.frequency);
          noteMixer.patch(sweepF).patch(env);
        } else noteMixer.patch(env);
      } else noteMixer.patch(env);
    } else {
      Oscil wave = new Oscil(baseFreq, masterAmp, getWaveform(type));
      wave.patch(env);
    }
    env.patch(getInstrumentMixer(instName));
    env.noteOn();
    activeNotes.put(key, env);
    if (instName.equals(currentInstrument) && !instName.equals("")) { adsrTimer = millis(); adsrState = 1; }
  }

  void stopNoteInternal(String instName, int p) {
    if (instName == null || instName.length() == 0) instName = currentInstrument;
    String key = instName + "_" + p;
    ADSR adsr = activeNotes.get(key);
    if (adsr != null) {
      adsr.unpatchAfterRelease(getInstrumentMixer(instName));
      adsr.noteOff();
      activeNotes.remove(key);
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
      adsrState = 0; logToScreen("Instrument Switched: " + currentInstrument, 1);
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
    if (instName == null || instName.length() == 0 || instName.equals("(請選擇樂器)")) instName = currentInstrument;
    String[] notes = chords.get(name);
    if (notes != null) {
      for (String n : notes) { int midi = noteToMidi(n); if (midi >= 0) playNoteForDuration(instName, midi, vel, durationMs); }
    } else logToScreen("Chord not found: " + name, 2);
  }

  void playMelodyInternal(String m, String i) {
    String[] tokens = splitTokens(m, ", \\t\\n\\r");
    for (String t : tokens) parseAndPlayNote(i, t, 100);
  }

  void parseAndPlayNote(String name, String token, float vel) {
    token = token.trim(); if (token.length() < 1) return;
    activeMelodyCount++; float totalMs = 0; String noteName = "";
    String[] parts = token.split("\\\\+");
    for (int j = 0; j < parts.length; j++) {
      String p = parts[j].trim(); if (p.length() == 0) continue;
      float multiplier = 1.0f;
      if (p.endsWith(".")) { multiplier = 1.5f; p = p.substring(0, p.length() - 1); }
      else if (p.endsWith("_T")) { multiplier = 2.0f / 3.0f; p = p.substring(0, p.length() - 2); }
      if (p.length() == 0) continue;
      char durChar = p.charAt(p.length() - 1); String prefix = p.substring(0, p.length() - 1);
      if (durChar != 'W' && durChar != 'H' && durChar != 'Q' && durChar != 'E' && durChar != 'S') { prefix = p; durChar = 'Q'; }
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
    float ms = 500;
    try {
      if (iv.endsWith("m")) { float count = iv.length() > 1 ? Float.parseFloat(iv.substring(0, iv.length()-1)) : 1.0f; ms = (60000/bpm) * 4 * count; }
      else if (iv.endsWith("n")) { float den = Float.parseFloat(iv.substring(0, iv.length()-1)); ms = (60000/bpm) * (4.0f / den); }
    } catch(Exception e) {}
    return ms;
  }

  void playClick(float freq, float v) {
    checkMainMixer(); if (out == null) return;
    float amp = map(v, 0, 127, 0, 1.0f);
    Oscil wave = new Oscil(freq, amp, Waves.TRIANGLE);
    ADSR adsr = new ADSR(1.0, 0.01f, 0.05f, 0.0f, 0.05f);
    wave.patch(adsr).patch(mainMixer); adsr.noteOn();
    try { Thread.sleep(80); } catch(Exception e) {} 
    adsr.noteOff(); adsr.unpatchAfterRelease(mainMixer);
  }
  `;
};