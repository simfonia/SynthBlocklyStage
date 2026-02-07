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
    code = 'pow(floatVal(' + argument0 + '), floatVal(' + argument1 + '))';
  } else {
    code = 'floatVal(' + argument0 + ')' + operator + 'floatVal(' + argument1 + ')';
  }
  return [code, order];
};

Blockly.Processing.forBlock['math_single'] = function(block) {
  const operator = block.getFieldValue('OP');
  let code;
  let arg;
  if (operator === 'NEG') {
    arg = Blockly.Processing.valueToCode(block, 'NUM', Blockly.Processing.ORDER_SUBTRACTION) || '0';
    return ['-floatVal(' + arg + ')', Blockly.Processing.ORDER_SUBTRACTION];
  }
  
  arg = Blockly.Processing.valueToCode(block, 'NUM', Blockly.Processing.ORDER_NONE) || '0';
  const val = 'floatVal(' + arg + ')';
  
  if (operator === 'ABS') {
    code = 'abs(' + val + ')';
  } else if (operator === 'ROOT') {
    code = 'sqrt(' + val + ')';
  } else if (operator === 'SIN') {
    code = 'sin(' + val + ')';
  } else if (operator === 'COS') {
    code = 'cos(' + val + ')';
  } else if (operator === 'TAN') {
    code = 'tan(' + val + ')';
  }
  return [code, Blockly.Processing.ORDER_FUNCTION_CALL];
};

Blockly.Processing.forBlock['math_number_property'] = function(block) {
  const argument0 = Blockly.Processing.valueToCode(block, 'NUMBER_TO_CHECK', Blockly.Processing.ORDER_RELATIONAL) || '0';
  const val = 'floatVal(' + argument0 + ')';
  const dropdown_property = block.getFieldValue('PROPERTY');
  let code;
  if (dropdown_property === 'EVEN') {
    code = val + ' % 2 == 0';
  } else if (dropdown_property === 'ODD') {
    code = val + ' % 2 != 0';
  } else if (dropdown_property === 'WHOLE') {
    code = val + ' % 1 == 0';
  } else if (dropdown_property === 'POSITIVE') {
    code = val + ' > 0';
  } else if (dropdown_property === 'NEGATIVE') {
    code = val + ' < 0';
  } else if (dropdown_property === 'DIVISIBLE_BY') {
    const argument1 = Blockly.Processing.valueToCode(block, 'DIVISOR', Blockly.Processing.ORDER_RELATIONAL) || '1';
    code = val + ' % floatVal(' + argument1 + ') == 0';
  }
  return [code, Blockly.Processing.ORDER_RELATIONAL];
};

Blockly.Processing.forBlock['math_round'] = function(block) {
  const operator = block.getFieldValue('OP');
  const arg = Blockly.Processing.valueToCode(block, 'NUM', Blockly.Processing.ORDER_NONE) || '0';
  const val = 'floatVal(' + arg + ')';
  let code;
  if (operator === 'ROUND') {
    code = 'round(' + val + ')';
  } else if (operator === 'ROUNDUP') {
    code = 'ceil(' + val + ')';
  } else if (operator === 'ROUNDDOWN') {
    code = 'floor(' + val + ')';
  }
  return [code, Blockly.Processing.ORDER_FUNCTION_CALL];
};

Blockly.Processing.forBlock['math_constrain'] = function(block) {
  const val = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_NONE) || '0';
  const low = Blockly.Processing.valueToCode(block, 'LOW', Blockly.Processing.ORDER_NONE) || '0';
  const high = Blockly.Processing.valueToCode(block, 'HIGH', Blockly.Processing.ORDER_NONE) || '100';
  const code = 'constrain(floatVal(' + val + '), floatVal(' + low + '), floatVal(' + high + '))';
  return [code, Blockly.Processing.ORDER_FUNCTION_CALL];
};

Blockly.Processing.forBlock['math_modulo'] = function(block) {
  const argument0 = Blockly.Processing.valueToCode(block, 'DIVIDEND', Blockly.Processing.ORDER_DIVISION) || '0';
  const argument1 = Blockly.Processing.valueToCode(block, 'DIVISOR', Blockly.Processing.ORDER_DIVISION) || '0';
  const code = 'floatVal(' + argument0 + ') % floatVal(' + argument1 + ')';
  return [code, Blockly.Processing.ORDER_DIVISION];
};

Blockly.Processing.forBlock['math_map'] = function(block) {
  const val = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_NONE) || '0';
  const fL = Blockly.Processing.valueToCode(block, 'FROM_LOW', Blockly.Processing.ORDER_NONE) || '0';
  const fH = Blockly.Processing.valueToCode(block, 'FROM_HIGH', Blockly.Processing.ORDER_NONE) || '1023';
  const tL = Blockly.Processing.valueToCode(block, 'TO_LOW', Blockly.Processing.ORDER_NONE) || '0';
  const tH = Blockly.Processing.valueToCode(block, 'TO_HIGH', Blockly.Processing.ORDER_NONE) || '255';
  
  const code = 'map(floatVal(' + val + '), floatVal(' + fL + '), floatVal(' + fH + '), floatVal(' + tL + '), floatVal(' + tH + '))';
  return [code, Blockly.Processing.ORDER_FUNCTION_CALL];
};

Blockly.Processing.forBlock['math_random_int'] = function(block) {
  const arg0 = Blockly.Processing.valueToCode(block, 'FROM', Blockly.Processing.ORDER_NONE) || '0';
  const arg1 = Blockly.Processing.valueToCode(block, 'TO', Blockly.Processing.ORDER_NONE) || '0';
  const code = 'int(random(' + arg0 + ', ' + arg1 + '))';
  return [code, Blockly.Processing.ORDER_FUNCTION_CALL];
};
