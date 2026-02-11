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
  if (!this.forBlock[block.type] && this[block.type]) {
    this.forBlock[block.type] = this[block.type];
  }
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

  // Standard Imports
  Blockly.Processing.addImport("import java.util.*;");
  Blockly.Processing.addImport("import ddf.minim.*;");
  Blockly.Processing.addImport("import ddf.minim.ugens.*;");

  // Helper functions
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

Blockly.Processing.getRelativeIndex = function(block, name) {
  const at = Blockly.Processing.valueToCode(block, name, Blockly.Processing.ORDER_ADDITION) || '1';
  return window.SB_Utils.getRelativeIndex(at);
};

Blockly.Processing.addImport = function(importStr) {
  if (Blockly.Processing.imports_) {
    Blockly.Processing.imports_[importStr] = importStr;
  }
};

Blockly.Processing.provideSetup = function(code, opt_key) {
  if (Blockly.Processing.setups_) {
    var id = opt_key || 'setup_' + Object.keys(Blockly.Processing.setups_).length;
    Blockly.Processing.setups_[id] = code;
  }
};

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
  // --- 0. Pre-process MIDI Event Arrays (Crucial to do this first!) ---
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
  // Remove non-string arrays so they don't break the string processing below
  delete Blockly.Processing.definitions_['midi_events_note_on'];
  delete Blockly.Processing.definitions_['midi_events_note_off'];
  delete Blockly.Processing.definitions_['midi_events_cc'];

  // 1. Process Imports
  const uniqueImports = new Set();
  if (Blockly.Processing.imports_) {
    Object.values(Blockly.Processing.imports_).forEach(imp => {
      if (imp) {
        let cleanImp = imp.trim();
        if (cleanImp && !cleanImp.endsWith(';')) cleanImp += ';';
        uniqueImports.add(cleanImp);
      }
    });
  }
  const importsStr = Array.from(uniqueImports).sort().join('\n');

  // 2. Process Global Vars
  const globalVars = Object.values(Blockly.Processing.global_vars_ || {})
    .map(v => v.trim()).filter(v => v !== "").sort().join('\n');
  
  // 3. Process Definitions (Placeholders)
  let definitionsStr = Object.values(Blockly.Processing.definitions_ || {})
    .filter(d => typeof d === 'string') // Double check type
    .map(d => d.trim()).filter(d => d !== "").join('\n\n');

  // Handle Key Events
  let pressedEventsCode = "";
  let releasedEventsCode = "";
  if (Blockly.Processing.keyEvents_) {
    Blockly.Processing.keyEvents_.forEach(ev => {
      let eventCode = `if (k == '${ev.key}') {\n      ${ev.code.replace(/\n/g, '\n      ')}\n    }\n    `;
      if (ev.mode === 'RELEASED') releasedEventsCode += eventCode;
      else pressedEventsCode += eventCode;
    });
  }
  definitionsStr = definitionsStr
    .replace('{{KEY_PRESSED_EVENT_PLACEHOLDER}}', pressedEventsCode)
    .replace('{{KEY_RELEASED_EVENT_PLACEHOLDER}}', releasedEventsCode);

  // 4. Setup Function
  const setupParts = Blockly.Processing.setups_ || {};
  let sortedSetup = [];
  if (setupParts['stage_init_size']) { sortedSetup.push(setupParts['stage_init_size']); delete setupParts['stage_init_size']; }
  if (setupParts['stage_init_density']) { sortedSetup.push(setupParts['stage_init_density']); delete setupParts['stage_init_density']; }
  if (setupParts['sb_audio_init']) { sortedSetup.push(setupParts['sb_audio_init']); delete setupParts['sb_audio_init']; }
  Object.values(setupParts).forEach(s => { let clean = s.trim(); if (clean) sortedSetup.push(clean); });

  const setupCode = 'void setup() {\n  ' + sortedSetup.join('\n  ').replace(/\n/g, '\n  ') + '\n}\n';

  // 5. Draw Function
  const drawParts = Object.values(Blockly.Processing.draws_ || []).map(d => d.trim()).filter(d => d !== "");
  const fullDrawCode = (drawParts.join('\n') + '\n' + code).trim();
  const drawCodeStr = 'void draw() {\n  ' + (fullDrawCode ? fullDrawCode.replace(/\n/g, '\n  ') : '') + '\n}\n';

  // 6. Combine all
  let segments = [];
  if (importsStr) segments.push(importsStr);
  if (globalVars) segments.push(globalVars);
  if (definitionsStr) segments.push(definitionsStr);
  segments.push(setupCode);
  segments.push(drawCodeStr);

  const finalCode = segments.join('\n\n').trim();
  
  delete Blockly.Processing.imports_; delete Blockly.Processing.global_vars_; delete Blockly.Processing.definitions_;
  delete Blockly.Processing.setups_; delete Blockly.Processing.draws_;
  return finalCode; 
};

Blockly.Processing.scrubNakedValue = function(line) { return line + ';\n'; };
Blockly.Processing.quote_ = function(string) { return '"' + string.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'; };
Blockly.Processing.scrub_ = function(block, code) {
  var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  var nextCode = Blockly.Processing.blockToCode(nextBlock);
  return code + nextCode;
};

Blockly.Processing.registerGenerator = function(type, func) {
  Blockly.Processing.forBlock[type] = func;
  Blockly.Processing[type] = func; 
};

/**
 * 內部函式：注入音訊核心支援代碼 (Java)
 */
Blockly.Processing.injectAudioCore = function() {
  if (Blockly.Processing.definitions_['AudioCore']) return;
  
  Blockly.Processing.addImport("import ddf.minim.*;");
  Blockly.Processing.addImport("import ddf.minim.ugens.*;");
  Blockly.Processing.addImport("import java.util.LinkedHashMap;");
  Blockly.Processing.addImport("import java.util.concurrent.*;");

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
  g['activeNotes'] = "ConcurrentHashMap<String, ADSR> activeNotes = new ConcurrentHashMap<String, ADSR>();";
  g['midiKeysHeld'] = "ConcurrentHashMap<Integer, String> midiKeysHeld = new ConcurrentHashMap<Integer, String>();";
  g['midiBusses'] = "HashMap<String, MidiBus> midiBusses = new HashMap<String, MidiBus>();";
  g['instrumentMixConfigs'] = "HashMap instrumentMixConfigs = new HashMap();";
  g['isMasterClipping'] = "volatile boolean isMasterClipping = false;";
  g['clippingTimer'] = "long clippingTimer = 0;";
  g['pitchTranspose'] = "int pitchTranspose = 0;";
  
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

  g['bpm'] = "float bpm = 120.0;";
  g['masterGain'] = "float masterGain = -5.0;";
  g['defAdsrA'] = "float defAdsrA = 0.01;";
  g['defAdsrD'] = "float defAdsrD = 0.1;";
  g['defAdsrS'] = "float defAdsrS = 0.5;";
  g['defAdsrR'] = "float defAdsrR = 0.5;";

  Blockly.Processing.definitions_['AudioCore'] = window.SB_JavaLibs.AUDIO_CLASSES + window.SB_JavaLibs.AUDIO_HELPERS;
};
