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
  g['instrumentMap'] = "HashMap<String, String> instrumentMap = new HashMap<String, String>();";
  g['currentInstrument'] = 'String currentInstrument = "default";';
  g['activeNotes'] = "HashMap<Integer, ADSR> activeNotes = new HashMap<Integer, ADSR>();";
  g['harmonicPartials'] = "HashMap<String, float[]> harmonicPartials = new HashMap<String, float[]>();";
  g['additiveConfigs'] = "HashMap<String, List<SynthComponent>> additiveConfigs = new HashMap<String, List<SynthComponent>>();";

  // Global Audio Params (Shared with Live Show category)
  g['masterGain'] = "float masterGain = -5.0;";
  g['adsrA'] = "float adsrA = 0.01;";
  g['adsrD'] = "float adsrD = 0.1;";
  g['adsrS'] = "float adsrS = 0.5;";
  g['adsrR'] = "float adsrR = 0.5;";
  g['adsrTimer'] = "int adsrTimer = 0;";
  g['adsrState'] = "int adsrState = 0;"; 

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
  
  Blockly.Processing.provideSetup('minim = new Minim(this);\nout = minim.getLineOut();\ninstrumentMap.put("default", "SINE");\ncurrentInstrument = "default";');
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

registerGenerator('sb_create_synth_instrument', function(block) {
  const name = block.getFieldValue('NAME');
  const type = block.getFieldValue('TYPE');
  return `instrumentMap.put("${name}", "${type}");\n`;
});

registerGenerator('sb_select_current_instrument', function(block) {
  const name = block.getFieldValue('NAME');
  return `currentInstrument = "${name}";\n`;
});

registerGenerator('sb_create_harmonic_synth', function(block) {
  const name = block.getFieldValue('NAME');
  const partials = [];
  for (let i = 1; i <= (block.itemCount_ || 0); i++) {
    const val = Blockly.Processing.valueToCode(block, 'PARTIAL' + i, Blockly.Processing.ORDER_ATOMIC) || '0';
    partials.push(`${val}f`);
  }
  return `instrumentMap.put("${name}", "HARMONIC");\n` + 
         `harmonicPartials.put("${name}", new float[]{${partials.length > 0 ? partials.join(', ') : '1.0f'}});\n`;
});

registerGenerator('sb_create_additive_synth', function(block) {
  const name = block.getFieldValue('NAME');
  const components = [];
  for (let i = 1; i <= (block.itemCount_ || 0); i++) {
    const wave = block.getFieldValue('WAVE' + i);
    const ratio = Number(block.getFieldValue('RATIO' + i)) || 1.0;
    const amp = Number(block.getFieldValue('AMP' + i)) || 0.0;
    components.push(`new SynthComponent("${wave}", ${ratio}f, ${amp}f)`);
  }
  return `instrumentMap.put("${name}", "ADDITIVE");\n` + 
         `additiveConfigs.put("${name}", Arrays.asList(${components.join(', ')}));\n`;
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
  return `currentSample = ${name};\n`;
});

registerGenerator('audio_current_sample_property', function(block) {
  const prop = block.getFieldValue('PROP');
  Blockly.Processing.global_vars_['currentSample'] = 'Sampler currentSample;';
  return [`currentSample.${prop}`, Blockly.Processing.ORDER_MEMBER];
});

registerGenerator('audio_current_sample_mix_get', function(block) {
  return [`0`, Blockly.Processing.ORDER_ATOMIC];
});