/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Audio generators for Processing (Minim).
 */

Blockly.Processing.forBlock['audio_minim_init'] = function(block) {
  // Add required import
  Blockly.Processing.imports_['minim'] = 'import ddf.minim.*;';
  Blockly.Processing.imports_['minim_ugens'] = 'import ddf.minim.ugens.*;';
  // Add global variable
  Blockly.Processing.global_vars_['minim'] = 'Minim minim;';
  // Add setup instruction
  return 'minim = new Minim(this);\n';
};

Blockly.Processing.forBlock['audio_load_sample'] = function(block) {
  const name = block.getFieldValue('NAME');
  const path = block.getFieldValue('PATH');
  
  // Define global Sampler and Gain variables
  Blockly.Processing.global_vars_['sample_' + name] = `Sampler ${name};`;
  Blockly.Processing.global_vars_['gain_' + name] = `Gain ${name}_gain;`;
  
  // Initialize Sampler (4 voices) and Gain, then patch to output
  return `${name} = new Sampler("${path}", 4, minim);\n` + 
         `${name}_gain = new Gain(0.f);\n` +
         `${name}.patch(${name}_gain).patch(out);\n`;
};

Blockly.Processing.forBlock['audio_trigger_sample'] = function(block) {
  const name = block.getFieldValue('NAME');
  const velocity = Blockly.Processing.valueToCode(block, 'VELOCITY', Blockly.Processing.ORDER_ATOMIC) || '100';
  
  // Set gain based on velocity (map 0-127 to -40dB-0dB) and trigger
  // Note: masterGain is applied to 'out', so we just handle relative velocity here
  return `if (${name} != null) {
  ${name}_gain.setValue(map(${velocity}, 0, 127, -40, 0));
  ${name}.trigger();
}\n`;
};

Blockly.Processing.forBlock['audio_sample_property'] = function(block) {
  // Sampler doesn't support direct property access like AudioSample in the same way, 
  // but for compilation safety we kept simple logic or might need removal.
  // For now, assume users don't use this block for Sampler in this specific demo.
  const name = block.getFieldValue('NAME');
  const prop = block.getFieldValue('PROP');
  return [`${name}.${prop}`, Blockly.Processing.ORDER_MEMBER];
};

Blockly.Processing.forBlock['audio_sample_mix_get'] = function(block) {
   // Sampler does not expose mix buffer directly. 
   // This block is legacy for AudioSample. Returning 0 to prevent crash if used.
  return [`0`, Blockly.Processing.ORDER_ATOMIC];
};

Blockly.Processing.forBlock['audio_create_synth_instrument'] = function(block) {
  const name = block.getFieldValue('NAME');
  const type = block.getFieldValue('TYPE');
  return `instrumentMap.put("${name}", "${type}");\n`;
};

Blockly.Processing.forBlock['audio_select_instrument'] = function(block) {
  const name = block.getFieldValue('NAME');
  return `currentInstrument = "${name}";\n`;
};

Blockly.Processing.forBlock['audio_create_harmonic_synth'] = function(block) {
  const name = block.getFieldValue('NAME');
  const partials = [];
  for (let i = 1; i <= block.itemCount_; i++) {
    const val = Blockly.Processing.valueToCode(block, 'PARTIAL' + i, Blockly.Processing.ORDER_ATOMIC) || '0';
    // Ensure float format for Java array
    partials.push(`${val}f`);
  }
  return `instrumentMap.put("${name}", "HARMONIC");\n` +
         `harmonicPartials.put("${name}", new float[]{${partials.join(', ')}});\n`;
};

Blockly.Processing.forBlock['audio_create_additive_synth'] = function(block) {
  const name = block.getFieldValue('NAME');
  const components = [];
  for (let i = 1; i <= block.itemCount_; i++) {
    const wave = block.getFieldValue('WAVE' + i);
    const ratio = Number(block.getFieldValue('RATIO' + i)) || 1.0;
    const amp = Number(block.getFieldValue('AMP' + i)) || 0.0;
    components.push(`new SynthComponent("${wave}", ${ratio}f, ${amp}f)`);
  }
  
  return `instrumentMap.put("${name}", "ADDITIVE");\n` +
         `additiveConfigs.put("${name}", Arrays.asList(${components.join(', ')}));\n`;
};

Blockly.Processing.forBlock['audio_play_note'] = function(block) {
  const pitch = Blockly.Processing.valueToCode(block, 'PITCH', Blockly.Processing.ORDER_ATOMIC) || '60';
  const velocity = Blockly.Processing.valueToCode(block, 'VELOCITY', Blockly.Processing.ORDER_ATOMIC) || '100';
  return `playNoteInternal((int)${pitch}, (float)${velocity});\n`;
};

Blockly.Processing.forBlock['audio_stop_note'] = function(block) {
  const pitch = Blockly.Processing.valueToCode(block, 'PITCH', Blockly.Processing.ORDER_ATOMIC) || '60';
  return `stopNoteInternal((int)${pitch});\n`;
};

Blockly.Processing.forBlock['audio_set_current_sample'] = function(block) {
  const name = block.getFieldValue('NAME');
  Blockly.Processing.global_vars_['currentSample'] = 'Sampler currentSample;';
  return `currentSample = ${name};\n`;
};

Blockly.Processing.forBlock['audio_current_sample_property'] = function(block) {
  const prop = block.getFieldValue('PROP');
  Blockly.Processing.global_vars_['currentSample'] = 'Sampler currentSample;';
  return [`currentSample.${prop}`, Blockly.Processing.ORDER_MEMBER];
};

Blockly.Processing.forBlock['audio_current_sample_mix_get'] = function(block) {
  // Legacy support fallback
  return [`0`, Blockly.Processing.ORDER_ATOMIC];
};

