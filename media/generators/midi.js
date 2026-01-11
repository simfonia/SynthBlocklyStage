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
  // 強制使用固定名稱以匹配 _core.js 的變數強制更名邏輯
  const channelVar = "channel";
  const pitchVar = "pitch";
  const velocityVar = "velocity";
  
  const branch = Blockly.Processing.statementToCode(block, 'DO');
  
  const funcCode = `
void noteOn(int ${channelVar}, int ${pitchVar}, int ${velocityVar}) {
  logToScreen("Note ON - Pitch: " + ${pitchVar} + " Vel: " + ${velocityVar}, 0);
  ${branch}
}
  `;
  
  Blockly.Processing.definitions_['midi_on_note'] = funcCode;
  return ''; 
};

Blockly.Processing.forBlock['midi_off_note'] = function(block) {
  const channelVar = "channel";
  const pitchVar = "pitch";
  const velocityVar = "velocity";
  
  const branch = Blockly.Processing.statementToCode(block, 'DO');
  
  const funcCode = `
void noteOff(int ${channelVar}, int ${pitchVar}, int ${velocityVar}) {
  logToScreen("Note OFF - Pitch: " + ${pitchVar}, 0);
  ${branch}
}
  `;
  
  Blockly.Processing.definitions_['midi_off_note'] = funcCode;
  return ''; 
};


