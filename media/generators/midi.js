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
  const channelVar = "channel";
  const pitchVar = "pitch";
  const velocityVar = "velocity";
  
  const branch = Blockly.Processing.statementToCode(block, 'DO');
  
  const funcCode = `
void noteOn(int ${channelVar}, int ${pitchVar}, int ${velocityVar}) {
  logToScreen("Note ON - Pitch: " + ${pitchVar} + " Vel: " + ${velocityVar}, 0);
  midiKeysHeld.put(${pitchVar}, currentInstrument);
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
  String memorizedInst = midiKeysHeld.get(${pitchVar});
  if (memorizedInst != null) {
    // We modify the internal execution context by temporarily overriding currentInstrument
    String backup = currentInstrument;
    currentInstrument = memorizedInst;
    ${branch}
    currentInstrument = backup;
    midiKeysHeld.remove(${pitchVar});
  } else {
    ${branch}
  }
}
  `;
  
  Blockly.Processing.definitions_['midi_off_note'] = funcCode;
  return ''; 
};

Blockly.Processing.forBlock['midi_on_controller_change'] = function(block) {
  const channelVar = "channel";
  const numberVar = "number";
  const valueVar = "value";
  
  const branch = Blockly.Processing.statementToCode(block, 'DO');
  
  const funcCode = `
void controllerChange(int ${channelVar}, int ${numberVar}, int ${valueVar}) {
  ${branch}
}
  `;
  
  Blockly.Processing.definitions_['midi_on_controller_change'] = funcCode;
  return ''; 
};


