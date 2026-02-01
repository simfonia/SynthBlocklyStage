// State tracker for container context
Blockly.Processing.currentGenInstrumentName = null;

registerGenerator('sb_instrument_container', function(block) {
  const name = block.getFieldValue('NAME');
  
  // Set context
  Blockly.Processing.currentGenInstrumentName = name;
  
  // Default to TRIANGLE if not set (user can override with sb_set_wave)
  let code = `instrumentMap.put("${name}", "TRIANGLE");\n`;
  
  // Process inner blocks
  const branch = Blockly.Processing.statementToCode(block, 'STACK');
  code += branch;
  
  // Clear context
  Blockly.Processing.currentGenInstrumentName = null;
  
  return code;
});

registerGenerator('sb_set_adsr', function(block) {
  // Must be inside a container
  if (!Blockly.Processing.currentGenInstrumentName) return '// sb_set_adsr must be inside sb_instrument_container\n';
  
  const a = Blockly.Processing.valueToCode(block, 'A', Blockly.Processing.ORDER_ATOMIC) || '0.01';
  const d = Blockly.Processing.valueToCode(block, 'D', Blockly.Processing.ORDER_ATOMIC) || '0.1';
  const s = Blockly.Processing.valueToCode(block, 'S', Blockly.Processing.ORDER_ATOMIC) || '0.5';
  const r = Blockly.Processing.valueToCode(block, 'R', Blockly.Processing.ORDER_ATOMIC) || '0.5';
  
  return `instrumentADSR.put("${Blockly.Processing.currentGenInstrumentName}", new float[]{(float)${a}, (float)${d}, (float)${s}, (float)${r}});\n`;
});

registerGenerator('sb_set_wave', function(block) {
  if (!Blockly.Processing.currentGenInstrumentName) return '// sb_set_wave must be inside sb_instrument_container\n';
  const type = block.getFieldValue('TYPE');
  return `instrumentMap.put("${Blockly.Processing.currentGenInstrumentName}", "${type}");\n`;
});
