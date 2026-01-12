/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Logic generators for Processing (Java).
 */

Blockly.Processing.forBlock['controls_if'] = function(block) {
  let n = 0;
  let code = '';
  do {
    const conditionCode = Blockly.Processing.valueToCode(block, 'IF' + n, Blockly.Processing.ORDER_NONE) || 'false';
    const branchCode = Blockly.Processing.statementToCode(block, 'DO' + n);
    code += (n > 0 ? ' else ' : '') + 'if (' + conditionCode + ') {\n' + branchCode + '}';
    n++;
  } while (block.getInput('IF' + n));
  if (block.getInput('ELSE')) {
    code += ' else {\n' + Blockly.Processing.statementToCode(block, 'ELSE') + '}';
  }
  return code + '\n';
};

Blockly.Processing.forBlock['logic_compare'] = function(block) {
  const op = block.getFieldValue('OP');
  const order = Blockly.Processing.ORDER_RELATIONAL;
  const argument0 = Blockly.Processing.valueToCode(block, 'A', order) || '0';
  const argument1 = Blockly.Processing.valueToCode(block, 'B', order) || '0';
  
  // Heuristic: If either side is a string literal (contains quotes), 
  // or if one side is a known string variable like 'serial_data'.
  const isString = argument0.includes('"') || argument1.includes('"') || 
                   argument0.includes('serial_data') || argument1.includes('serial_data') ||
                   argument0.includes('received') || argument1.includes('received');

  if (isString) {
    if (op === 'EQ') {
      return [argument0 + '.equals(' + argument1 + ')', Blockly.Processing.ORDER_FUNCTION_CALL];
    } else if (op === 'NEQ') {
      return ['!' + argument0 + '.equals(' + argument1 + ')', Blockly.Processing.ORDER_FUNCTION_CALL];
    }
  }

  const operator = { 'EQ': '==', 'NEQ': '!=', 'LT': '<', 'LTE': '<=', 'GT': '>', 'GTE': '>=' }[op];
  return [argument0 + ' ' + operator + ' ' + argument1, order];
};

Blockly.Processing.forBlock['logic_operation'] = function(block) {
  const operator = (block.getFieldValue('OP') === 'AND') ? '&&' : '||';
  const order = (operator === '&&') ? Blockly.Processing.ORDER_LOGICAL_AND : Blockly.Processing.ORDER_LOGICAL_OR;
  const argument0 = Blockly.Processing.valueToCode(block, 'A', order) || 'false';
  const argument1 = Blockly.Processing.valueToCode(block, 'B', order) || 'false';
  return [argument0 + ' ' + operator + ' ' + argument1, order];
};

Blockly.Processing.forBlock['logic_negate'] = function(block) {
  const order = 4; // Logical NOT order
  const argument0 = Blockly.Processing.valueToCode(block, 'BOOL', order) || 'true';
  return ['!' + argument0, order];
};

Blockly.Processing.forBlock['logic_boolean'] = function(block) {
  const code = (block.getFieldValue('BOOL') === 'TRUE') ? 'true' : 'false';
  return [code, Blockly.Processing.ORDER_ATOMIC];
};

Blockly.Processing.forBlock['logic_null'] = function(block) {
  return ['null', Blockly.Processing.ORDER_ATOMIC];
};

Blockly.Processing.forBlock['logic_ternary'] = function(block) {
  const value_if = Blockly.Processing.valueToCode(block, 'IF', Blockly.Processing.ORDER_RELATIONAL) || 'false';
  const value_then = Blockly.Processing.valueToCode(block, 'THEN', Blockly.Processing.ORDER_RELATIONAL) || 'null';
  const value_else = Blockly.Processing.valueToCode(block, 'ELSE', Blockly.Processing.ORDER_RELATIONAL) || 'null';
  return [value_if + ' ? ' + value_then + ' : ' + value_else, Blockly.Processing.ORDER_RELATIONAL];
};