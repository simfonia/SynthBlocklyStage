/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Audio Core Generators: Initialization and Instrument Setup.
 */

Blockly.Processing.registerGenerator('sb_minim_init', function(block) {
  Blockly.Processing.injectAudioCore();
  Blockly.Processing.addImport('import ddf.minim.*;');
  Blockly.Processing.addImport('import ddf.minim.ugens.*;');
  
  Blockly.Processing.provideSetup(`
  checkMainMixer();
  `, 'sb_audio_init');
  return '';
});

Blockly.Processing.registerGenerator('sb_instrument_container', function(block) {
  const name = block.getFieldValue('NAME');
  Blockly.Processing.currentGenInstrumentName = name;
  
  const branch = Blockly.Processing.statementToCode(block, 'STACK');
  
  let code = 'if (!instrumentMap.containsKey("' + name + '")) instrumentMap.put("' + name + '", "TRIANGLE");\n';
  code += 'if (!instrumentADSR.containsKey("' + name + '")) instrumentADSR.put("' + name + '", new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR});\n';
  code += branch;
  
  Blockly.Processing.currentGenInstrumentName = null;
  Blockly.Processing.provideSetup(code, 'inst_setup_' + name);
  return '';
});

Blockly.Processing.registerGenerator('sb_set_wave', function(block) {
  if (!Blockly.Processing.currentGenInstrumentName) return '// sb_set_wave must be inside sb_instrument_container\n';
  const type = block.getFieldValue('TYPE');
  return `instrumentMap.put("${Blockly.Processing.currentGenInstrumentName}", "${type}");\n`;
});

Blockly.Processing.registerGenerator('sb_set_noise', function(block) {
  if (!Blockly.Processing.currentGenInstrumentName) return '// sb_set_noise must be inside sb_instrument_container\n';
  const type = block.getFieldValue('TYPE');
  return `instrumentMap.put("${Blockly.Processing.currentGenInstrumentName}", "NOISE_${type}");\n`;
});

Blockly.Processing.registerGenerator('sb_mixed_source', function(block) {
  if (!Blockly.Processing.currentGenInstrumentName) return '// sb_mixed_source must be inside sb_instrument_container\n';

  const wave = block.getFieldValue('WAVE');
  const noise = block.getFieldValue('NOISE');
  const level = Blockly.Processing.valueToCode(block, 'LEVEL', Blockly.Processing.ORDER_ATOMIC) || '30';
  
  const jitter = (block.hasJitter_) ? (Blockly.Processing.valueToCode(block, 'JITTER_INPUT', Blockly.Processing.ORDER_ATOMIC) || '5') : '0';
  const sRate = (block.hasSweep_) ? (Blockly.Processing.valueToCode(block, 'SWEEP_INPUT', Blockly.Processing.ORDER_ATOMIC) || '0.5') : '0';
  const sDepth = (block.hasSweep_) ? (Blockly.Processing.valueToCode(block, 'SWEEP_DEPTH_INPUT', Blockly.Processing.ORDER_ATOMIC) || '20') : '0';
  
  const name = Blockly.Processing.currentGenInstrumentName;
  let code = `instrumentMap.put("${name}", "MIXED");\n`;
  code += `instrumentMixConfigs.put("${name}", "${wave},${noise}," + floatVal(${level}) + "," + floatVal(${jitter}) + "," + floatVal(${sRate}) + "," + floatVal(${sDepth}));\n`;
  return code;
});

Blockly.Processing.registerGenerator('sb_drum_sampler', function(block) {
  const name = Blockly.Processing.currentGenInstrumentName;
  if (!name) return '// sb_drum_sampler must be inside sb_instrument_container\n';
  
  const type = block.getFieldValue('PATH');
  const path = (type === 'CUSTOM') ? block.getFieldValue('CUSTOM_PATH_VALUE') : type;
  
  let code = '';
  code += 'samplerMap.put("' + name + '", new ddf.minim.ugens.Sampler("' + path + '", 20, minim));\n';
  code += 'samplerGainMap.put("' + name + '", new Gain(0.f));\n';
  code += '((ddf.minim.ugens.Sampler)samplerMap.get("' + name + '")).patch((Gain)samplerGainMap.get("' + name + '")).patch(getInstrumentMixer("' + name + '"));\n';
  code += 'instrumentMap.put("' + name + '", "DRUM");\n';
  code += 'instrumentADSR.put("' + name + '", new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR});\n';
  return code;
});

Blockly.Processing.registerGenerator('sb_melodic_sampler', function(block) {
  const name = Blockly.Processing.currentGenInstrumentName;
  if (!name) return '// sb_melodic_sampler must be inside sb_instrument_container\n';
  
  const type = block.getFieldValue('TYPE');
  let path = "";
  if (type === 'PIANO') path = "piano";
  else if (type === 'VIOLIN_PIZZ') path = "violin/violin-section-pizzicato";
  else if (type === 'VIOLIN_ARCO') path = "violin/violin-section-vibrato-sustain";
  else path = block.getFieldValue('CUSTOM_PATH_VALUE');

  let code = '';
  code += 'if (!melodicSamplers.containsKey("' + name + '")) melodicSamplers.put("' + name + '", new MelodicSampler(minim, "' + name + '"));\n';
  code += 'melodicSamplers.get("' + name + '").loadSamples("' + path + '");\n';
  code += 'instrumentMap.put("' + name + '", "MELODIC_SAMPLER");\n';
  code += 'instrumentADSR.put("' + name + '", new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR});\n';
  return code;
});

Blockly.Processing.registerGenerator('sb_set_adsr', function(block) {
  if (!Blockly.Processing.currentGenInstrumentName) return '// sb_set_adsr must be inside sb_instrument_container\n';
  
  const a = Blockly.Processing.valueToCode(block, 'A', Blockly.Processing.ORDER_ATOMIC) || '0.01';
  const d = Blockly.Processing.valueToCode(block, 'D', Blockly.Processing.ORDER_ATOMIC) || '0.1';
  const s = Blockly.Processing.valueToCode(block, 'S', Blockly.Processing.ORDER_ATOMIC) || '0.5';
  const r = Blockly.Processing.valueToCode(block, 'R', Blockly.Processing.ORDER_ATOMIC) || '0.5';
  
  return `instrumentADSR.put("${Blockly.Processing.currentGenInstrumentName}", new float[]{(float)${a}, (float)${d}, (float)${s}, (float)${r}});\n`;
});

Blockly.Processing.registerGenerator('sb_create_harmonic_synth', function(block) {
  const name = Blockly.Processing.currentGenInstrumentName;
  if (!name) return '// sb_create_harmonic_synth must be inside sb_instrument_container\n';

  const partials = [];
  for (let i = 1; i <= (block.itemCount_ || 0); i++) {
    const val = Blockly.Processing.valueToCode(block, 'PARTIAL' + i, Blockly.Processing.ORDER_ATOMIC) || '0';
    partials.push(`${val}f`);
  }
  return `instrumentMap.put("${name}", "HARMONIC");\n` + 
         `harmonicPartials.put("${name}", new float[]{${partials.length > 0 ? partials.join(', ') : '1.0f'}});\n`;
});

Blockly.Processing.registerGenerator('sb_create_additive_synth', function(block) {
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