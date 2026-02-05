/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * @fileoverview Generators for Processing structure.
 */

Blockly.Processing.forBlock['processing_setup'] = function(block) {
  const branch = Blockly.Processing.statementToCode(block, 'DO');
  Blockly.Processing.setups_['processing_setup'] = branch;
  return '';
};

Blockly.Processing.forBlock['processing_draw'] = function(block) {
  const branch = Blockly.Processing.statementToCode(block, 'DO');
  return branch;
};

Blockly.Processing.forBlock['processing_on_key_pressed'] = function(block) {
  const branch = Blockly.Processing.statementToCode(block, 'DO');
  const code = `
void keyPressed() {
  ${branch}
}
  `;
  Blockly.Processing.definitions_['processing_on_key_pressed'] = code;
  return '';
};

Blockly.Processing.forBlock['processing_exit'] = function(block) {
  return 'exit();\n';
};

Blockly.Processing.forBlock['processing_frame_count'] = function(block) {
  return ['frameCount', Blockly.Processing.ORDER_ATOMIC];
};
