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

