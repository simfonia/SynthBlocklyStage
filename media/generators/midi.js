/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * MIDI generators for Processing (MidiBus).
 */

Blockly.Processing.forBlock['midi_init'] = function(block) {
  const device = block.getFieldValue('DEVICE');
  Blockly.Processing.imports_['midibus'] = 'import themidibus.*;';
  Blockly.Processing.global_vars_['myBus'] = 'MidiBus myBus;';
  // List devices to console to help debugging
  return `MidiBus.list();\nmyBus = new MidiBus(this, ${device}, -1);\n`;
};

Blockly.Processing.forBlock['midi_on_note'] = function(block) {
  const channelVar = Blockly.Processing.nameDB_.getName(block.getFieldValue('CHANNEL'), Blockly.Variables.NAME_TYPE);
  const pitchVar = Blockly.Processing.nameDB_.getName(block.getFieldValue('PITCH'), Blockly.Variables.NAME_TYPE);
  const velocityVar = Blockly.Processing.nameDB_.getName(block.getFieldValue('VELOCITY'), Blockly.Variables.NAME_TYPE);
  
  const branch = Blockly.Processing.statementToCode(block, 'DO');
  
  // Custom function definition for the whole sketch
  const funcCode = `
void noteOn(int ${channelVar}, int ${pitchVar}, int ${velocityVar}) {
  ${branch}
}
  `;
  
  Blockly.Processing.definitions_['midi_on_note'] = funcCode;
  return ''; // Return empty string as it's a definition, not an inline instruction
};


