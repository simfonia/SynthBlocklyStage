/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Math generators for Processing (Java).
 */

Blockly.Processing.forBlock['math_number'] = function(block) {
  const code = parseFloat(block.getFieldValue('NUM'));
  const order = code >= 0 ? Blockly.Processing.ORDER_ATOMIC : Blockly.Processing.ORDER_SUBTRACTION;
  return [String(code), order];
};

Blockly.Processing.forBlock['math_arithmetic'] = function(block) {
  const OPERATORS = {
    'ADD': [' + ', Blockly.Processing.ORDER_ADDITION],
    'MINUS': [' - ', Blockly.Processing.ORDER_SUBTRACTION],
    'MULTIPLY': [' * ', Blockly.Processing.ORDER_MULTIPLICATION],
    'DIVIDE': [' / ', Blockly.Processing.ORDER_DIVISION],
    'POWER': ['pow', Blockly.Processing.ORDER_FUNCTION_CALL]
  };
  const tuple = OPERATORS[block.getFieldValue('OP')];
  const operator = tuple[0];
  const order = tuple[1];
  const argument0 = Blockly.Processing.valueToCode(block, 'A', order) || '0';
  const argument1 = Blockly.Processing.valueToCode(block, 'B', order) || '0';
  
  let code;
  if (block.getFieldValue('OP') === 'POWER') {
    code = 'pow((float)' + argument0 + ', (float)' + argument1 + ')';
  } else {
    code = argument0 + operator + argument1;
  }
  return [code, order];
};

Blockly.Processing.forBlock['math_single'] = function(block) {
  const operator = block.getFieldValue('OP');
  let code;
  let arg;
  if (operator === 'NEG') {
    arg = Blockly.Processing.valueToCode(block, 'NUM', Blockly.Processing.ORDER_SUBTRACTION) || '0';
    if (arg[0] === '-') arg = ' ' + arg;
    return ['-' + arg, Blockly.Processing.ORDER_SUBTRACTION];
  }
  if (operator === 'ABS') {
    arg = Blockly.Processing.valueToCode(block, 'NUM', Blockly.Processing.ORDER_NONE) || '0';
    code = 'abs(' + arg + ')';
  } else if (operator === 'ROOT') {
    arg = Blockly.Processing.valueToCode(block, 'NUM', Blockly.Processing.ORDER_NONE) || '0';
    code = 'sqrt(' + arg + ')';
  } else if (operator === 'SIN') {
    arg = Blockly.Processing.valueToCode(block, 'NUM', Blockly.Processing.ORDER_NONE) || '0';
    code = 'sin(' + arg + ')';
  } else if (operator === 'COS') {
    arg = Blockly.Processing.valueToCode(block, 'NUM', Blockly.Processing.ORDER_NONE) || '0';
    code = 'cos(' + arg + ')';
  } else if (operator === 'TAN') {
    arg = Blockly.Processing.valueToCode(block, 'NUM', Blockly.Processing.ORDER_NONE) || '0';
    code = 'tan(' + arg + ')';
  }
  return [code, Blockly.Processing.ORDER_FUNCTION_CALL];
};

Blockly.Processing.forBlock['math_number_property'] = function(block) {
  const argument0 = Blockly.Processing.valueToCode(block, 'NUMBER_TO_CHECK', Blockly.Processing.ORDER_RELATIONAL) || '0';
  const dropdown_property = block.getFieldValue('PROPERTY');
  let code;
  if (dropdown_property === 'EVEN') {
    code = argument0 + ' % 2 == 0';
  } else if (dropdown_property === 'ODD') {
    code = argument0 + ' % 2 != 0';
  } else if (dropdown_property === 'WHOLE') {
    code = argument0 + ' % 1 == 0';
  } else if (dropdown_property === 'POSITIVE') {
    code = argument0 + ' > 0';
  } else if (dropdown_property === 'NEGATIVE') {
    code = (parseFloat(argument0) < 0) ? argument0 + ' < 0' : argument0 + ' < 0';
    code = argument0 + ' < 0';
  } else if (dropdown_property === 'DIVISIBLE_BY') {
    const argument1 = Blockly.Processing.valueToCode(block, 'DIVISOR', Blockly.Processing.ORDER_RELATIONAL) || '1';
    code = argument0 + ' % ' + argument1 + ' == 0';
  }
  return [code, Blockly.Processing.ORDER_RELATIONAL];
};

Blockly.Processing.forBlock['math_round'] = function(block) {
  const operator = block.getFieldValue('OP');
  const arg = Blockly.Processing.valueToCode(block, 'NUM', Blockly.Processing.ORDER_NONE) || '0';
  let code;
  if (operator === 'ROUND') {
    code = 'round(' + arg + ')';
  } else if (operator === 'ROUNDUP') {
    code = 'ceil(' + arg + ')';
  } else if (operator === 'ROUNDDOWN') {
    code = 'floor(' + arg + ')';
  }
  return [code, Blockly.Processing.ORDER_FUNCTION_CALL];
};

Blockly.Processing.forBlock['math_constrain'] = function(block) {
  const val = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_NONE) || '0';
  const low = Blockly.Processing.valueToCode(block, 'LOW', Blockly.Processing.ORDER_NONE) || '0';
  const high = Blockly.Processing.valueToCode(block, 'HIGH', Blockly.Processing.ORDER_NONE) || '100';
  const code = 'constrain(' + val + ', ' + low + ', ' + high + ')';
  return [code, Blockly.Processing.ORDER_FUNCTION_CALL];
};

Blockly.Processing.forBlock['math_modulo'] = function(block) {
  const argument0 = Blockly.Processing.valueToCode(block, 'DIVIDEND', Blockly.Processing.ORDER_DIVISION) || '0';
  const argument1 = Blockly.Processing.valueToCode(block, 'DIVISOR', Blockly.Processing.ORDER_DIVISION) || '0';
  const code = argument0 + ' % ' + argument1;
  return [code, Blockly.Processing.ORDER_DIVISION];
};

Blockly.Processing.forBlock['math_map'] = function(block) {
  const val = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_NONE) || '0';
  const fL = Blockly.Processing.valueToCode(block, 'FROM_LOW', Blockly.Processing.ORDER_NONE) || '0';
  const fH = Blockly.Processing.valueToCode(block, 'FROM_HIGH', Blockly.Processing.ORDER_NONE) || '1023';
  const tL = Blockly.Processing.valueToCode(block, 'TO_LOW', Blockly.Processing.ORDER_NONE) || '0';
  const tH = Blockly.Processing.valueToCode(block, 'TO_HIGH', Blockly.Processing.ORDER_NONE) || '255';
  
  const code = 'map((float)' + val + ', (float)' + fL + ', (float)' + fH + ', (float)' + tL + ', (float)' + tH + ')';
  return [code, Blockly.Processing.ORDER_FUNCTION_CALL];
};

Blockly.Processing.forBlock['math_random_int'] = function(block) {
  const arg0 = Blockly.Processing.valueToCode(block, 'FROM', Blockly.Processing.ORDER_NONE) || '0';
  const arg1 = Blockly.Processing.valueToCode(block, 'TO', Blockly.Processing.ORDER_NONE) || '0';
  const code = 'int(random(' + arg0 + ', ' + arg1 + '))';
  return [code, Blockly.Processing.ORDER_FUNCTION_CALL];
};
