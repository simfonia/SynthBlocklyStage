/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * UI generators for Processing (ControlP5).
 */

Blockly.Processing.forBlock['ui_init'] = function(block) {
  Blockly.Processing.imports_['controlp5'] = 'import controlP5.*;';
  Blockly.Processing.global_vars_['cp5'] = 'ControlP5 cp5;';
  return 'cp5 = new ControlP5(this);\n';
};

Blockly.Processing.forBlock['ui_add_slider'] = function(block) {
  const varName = block.getFieldValue('VAR');
  const label = block.getFieldValue('LABEL');
  const x = block.getFieldValue('X');
  const y = block.getFieldValue('Y');
  const w = block.getFieldValue('W');
  const h = block.getFieldValue('H');
  const min = block.getFieldValue('MIN');
  const max = block.getFieldValue('MAX');
  const val = block.getFieldValue('VAL');

  // Use varName directly as key to prevent duplicates
  Blockly.Processing.global_vars_[varName] = `float ${varName} = ${val};`;

  return `cp5.addSlider("${varName}")
     .setPosition(${x}, ${y})
     .setSize(${w}, ${h})
     .setRange(${min}, ${max})
     .setValue(${val})
     .setCaptionLabel("${label}");\n`;
};

Blockly.Processing.forBlock['ui_add_toggle'] = function(block) {
  const varName = block.getFieldValue('VAR');
  const label = block.getFieldValue('LABEL');
  const x = block.getFieldValue('X');
  const y = block.getFieldValue('Y');
  const state = block.getFieldValue('STATE') === 'TRUE';

  Blockly.Processing.global_vars_['var_' + varName] = `boolean ${varName} = ${state};`;

  return `cp5.addToggle("${varName}")
     .setPosition(${x}, ${y})
     .setSize(50, 20)
     .setState(${state})
     .setCaptionLabel("${label}");\n`;
};

Blockly.Processing.forBlock['ui_set_font_size'] = function(block) {
  const size = block.getFieldValue('SIZE');
  return `cp5.setFont(createFont("Arial", ${size}));\n`;
};

Blockly.Processing.forBlock['ui_key_event'] = function(block) {
  const keyChar = block.getFieldValue('KEY');
  const mode = block.getFieldValue('MODE') || 'PRESSED';
  const branch = Blockly.Processing.statementToCode(block, 'DO');
  
  if (!Blockly.Processing.keyEvents_) {
    Blockly.Processing.keyEvents_ = [];
  }
  
  // Store the event code
  Blockly.Processing.keyEvents_.push({
    key: keyChar.toLowerCase(),
    mode: mode,
    code: branch
  });

  // Ensure keyPressed/keyReleased frame exists even without the Stage block
  if (!Blockly.Processing.definitions_['Helpers']) {
    Blockly.Processing.definitions_['Helpers'] = `
void keyPressed() {
  char k = Character.toLowerCase(key);
  {{KEY_PRESSED_EVENT_PLACEHOLDER}}
}

void keyReleased() {
  char k = Character.toLowerCase(key);
  {{KEY_RELEASED_EVENT_PLACEHOLDER}}
}
    `;
  }
  
  return ""; // Does not output to main flow
};
