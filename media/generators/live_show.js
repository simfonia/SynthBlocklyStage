/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Live Show and Interactive Control generators for Processing (Java).
 */

Blockly.Processing.forBlock['live_set_param'] = function(block) {
  const param = block.getFieldValue('PARAM');
  const value = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_ASSIGNMENT) || '0';
  
  // Ensure the variable is declared in global scope if it's an ADSR param
  if (param.startsWith('adsr') && !Blockly.Processing.global_vars_[param]) {
      Blockly.Processing.global_vars_[param] = "float " + param + ";";
  }

  return param + " = (float)(" + value + ");\n";
};

Blockly.Processing.forBlock['live_get_param'] = function(block) {
  const param = block.getFieldValue('PARAM');
  return [param, Blockly.Processing.ORDER_ATOMIC];
};

Blockly.Processing.forBlock['sb_log_to_screen'] = function(block) {
  const msg = Blockly.Processing.valueToCode(block, 'MSG', Blockly.Processing.ORDER_ATOMIC) || '""';
  const typeStr = block.getFieldValue('TYPE');
  let typeIdx = "0";
  if (typeStr === 'MSG' || typeStr === '1') typeIdx = "1";
  else if (typeStr === 'WARN' || typeStr === '2') typeIdx = "2";
  else if (typeStr === 'ERR' || typeStr === '3') typeIdx = "3";
  
  return "logToScreen(String.valueOf(" + msg + "), " + typeIdx + ");\n";
};

