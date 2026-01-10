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
  // Add global variable
  Blockly.Processing.global_vars_['minim'] = 'Minim minim;';
  // Add setup instruction
  return 'minim = new Minim(this);\n';
};

Blockly.Processing.forBlock['audio_load_sample'] = function(block) {
  const name = block.getFieldValue('NAME');
  const path = block.getFieldValue('PATH');
  
  // Define global AudioSample variable
  Blockly.Processing.global_vars_['sample_' + name] = `AudioSample ${name};`;
  
  return `${name} = minim.loadSample("${path}", 512);\n`;
};

Blockly.Processing.forBlock['audio_trigger_sample'] = function(block) {
  const name = block.getFieldValue('NAME');
  const velocity = Blockly.Processing.valueToCode(block, 'VELOCITY', Blockly.Processing.ORDER_ATOMIC) || '100';
  
  return `
    if (${name} != null) {
      ${name}.setGain(map(${velocity}, 1, 127, -40, 0));
      ${name}.trigger();
    }
  `;
};

Blockly.Processing.forBlock['audio_sample_property'] = function(block) {
  const name = block.getFieldValue('NAME');
  const prop = block.getFieldValue('PROP');
  return [`${name}.${prop}`, Blockly.Processing.ORDER_MEMBER];
};

Blockly.Processing.forBlock['audio_sample_mix_get'] = function(block) {
  const name = block.getFieldValue('NAME');
  const index = Blockly.Processing.valueToCode(block, 'INDEX', Blockly.Processing.ORDER_ATOMIC) || '0';
  return [`${name}.mix.get(${index})`, Blockly.Processing.ORDER_MEMBER];
};

Blockly.Processing.forBlock['audio_set_current_sample'] = function(block) {
  const name = block.getFieldValue('NAME');
  Blockly.Processing.global_vars_['currentSample'] = 'AudioSample currentSample;';
  return `currentSample = ${name};\n`;
};

Blockly.Processing.forBlock['audio_current_sample_property'] = function(block) {
  const prop = block.getFieldValue('PROP');
  Blockly.Processing.global_vars_['currentSample'] = 'AudioSample currentSample;';
  return [`currentSample.${prop}`, Blockly.Processing.ORDER_MEMBER];
};

Blockly.Processing.forBlock['audio_current_sample_mix_get'] = function(block) {
  const index = Blockly.Processing.valueToCode(block, 'INDEX', Blockly.Processing.ORDER_ATOMIC) || '0';
  Blockly.Processing.global_vars_['currentSample'] = 'AudioSample currentSample;';
  return [`currentSample.mix.get(${index})`, Blockly.Processing.ORDER_MEMBER];
};

