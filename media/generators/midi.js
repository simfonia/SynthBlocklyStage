/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * MIDI generators for Processing (MidiBus).
 */

Blockly.Processing.forBlock['midi_init'] = function(block) {
  const name = block.getFieldValue('NAME') || 'LP1';
  const input = block.getFieldValue('INPUT');
  const output = block.getFieldValue('OUTPUT');
  Blockly.Processing.imports_['midibus'] = 'import themidibus.*;';
  
  // Initialize device and store in HashMap
  return `MidiBus.list();\nmidiBusses.put("${name}", new MidiBus(this, ${input}, ${output}, "${name}"));\n`;
};

Blockly.Processing.forBlock['midi_on_note'] = function(block) {
  const busName = block.getFieldValue('BUS_NAME') || 'LP1';
  const branch = Blockly.Processing.statementToCode(block, 'DO');
  
  if (!Blockly.Processing.definitions_['midi_events_note_on']) {
    Blockly.Processing.definitions_['midi_events_note_on'] = [];
  }
  
  const code = `  if (bus_name.equals("${busName}")) {\n${branch}\n  }`;
  Blockly.Processing.definitions_['midi_events_note_on'].push(code);
  return ''; 
};

Blockly.Processing.forBlock['midi_off_note'] = function(block) {
  const busName = block.getFieldValue('BUS_NAME') || 'LP1';
  const branch = Blockly.Processing.statementToCode(block, 'DO');
  
  if (!Blockly.Processing.definitions_['midi_events_note_off']) {
    Blockly.Processing.definitions_['midi_events_note_off'] = [];
  }
  
  const code = `  if (bus_name.equals("${busName}")) {\n${branch}\n  }`;
  Blockly.Processing.definitions_['midi_events_note_off'].push(code);
  return ''; 
};

Blockly.Processing.forBlock['midi_on_controller_change'] = function(block) {
  const busName = block.getFieldValue('BUS_NAME') || 'LP1';
  const branch = Blockly.Processing.statementToCode(block, 'DO');
  
  if (!Blockly.Processing.definitions_['midi_events_cc']) {
    Blockly.Processing.definitions_['midi_events_cc'] = [];
  }
  
  const code = `  if (bus_name.equals("${busName}")) {\n${branch}\n  }`;
  Blockly.Processing.definitions_['midi_events_cc'].push(code);
  return ''; 
};

Blockly.Processing.forBlock['midi_send_note'] = function(block) {
  const busName = block.getFieldValue('BUS_NAME') || 'LP1';
  const type = block.getFieldValue('TYPE');
  const channel = Blockly.Processing.valueToCode(block, 'CHANNEL', Blockly.Processing.ORDER_ATOMIC) || '0';
  const pitch = Blockly.Processing.valueToCode(block, 'PITCH', Blockly.Processing.ORDER_ATOMIC) || '60';
  const velocity = Blockly.Processing.valueToCode(block, 'VELOCITY', Blockly.Processing.ORDER_ATOMIC) || '100';
  
  const method = (type === 'ON') ? 'sendNoteOn' : 'sendNoteOff';
  return `if (midiBusses.containsKey("${busName}")) midiBusses.get("${busName}").${method}((int)floatVal(${channel}), (int)floatVal(${pitch}), (int)floatVal(${velocity}));\n`;
};

Blockly.Processing.forBlock['midi_send_cc'] = function(block) {
  const busName = block.getFieldValue('BUS_NAME') || 'LP1';
  const channel = Blockly.Processing.valueToCode(block, 'CHANNEL', Blockly.Processing.ORDER_ATOMIC) || '0';
  const number = Blockly.Processing.valueToCode(block, 'NUMBER', Blockly.Processing.ORDER_ATOMIC) || '0';
  const value = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_ATOMIC) || '0';
  
  return `if (midiBusses.containsKey("${busName}")) midiBusses.get("${busName}").sendControllerChange((int)floatVal(${channel}), (int)floatVal(${number}), (int)floatVal(${value}));\n`;
};

Blockly.Processing.forBlock['midi_lp_xy_to_note'] = function(block) {
  const x = Blockly.Processing.valueToCode(block, 'X', Blockly.Processing.ORDER_ATOMIC) || '0';
  const y = Blockly.Processing.valueToCode(block, 'Y', Blockly.Processing.ORDER_ATOMIC) || '0';
  
  const code = `((int)floatVal(${y}) * 16 + (int)floatVal(${x}))`;
  return [code, Blockly.Processing.ORDER_MULTIPLICATIVE];
};