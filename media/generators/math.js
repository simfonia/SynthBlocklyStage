/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Math generators for Processing.
 */

Blockly.Processing.forBlock['math_map'] = function(block) {
  const value = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_ATOMIC) || '0';
  const fromLow = Blockly.Processing.valueToCode(block, 'FROM_LOW', Blockly.Processing.ORDER_ATOMIC) || '0';
  const fromHigh = Blockly.Processing.valueToCode(block, 'FROM_HIGH', Blockly.Processing.ORDER_ATOMIC) || '100';
  const toLow = Blockly.Processing.valueToCode(block, 'TO_LOW', Blockly.Processing.ORDER_ATOMIC) || '0';
  const toHigh = Blockly.Processing.valueToCode(block, 'TO_HIGH', Blockly.Processing.ORDER_ATOMIC) || '255';
  
  const code = `map(${value}, ${fromLow}, ${fromHigh}, ${toLow}, ${toHigh})`;
  return [code, Blockly.Processing.ORDER_FUNCTION_CALL];
};
