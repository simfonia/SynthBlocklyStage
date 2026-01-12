/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Text generators for Processing (Java).
 */

Blockly.Processing.forBlock['text'] = function(block) {
  const code = Blockly.Processing.quote_(block.getFieldValue('TEXT'));
  return [code, Blockly.Processing.ORDER_ATOMIC];
};

Blockly.Processing.forBlock['text_join'] = function(block) {
  if (block.itemCount_ === 0) {
    return ['""', Blockly.Processing.ORDER_ATOMIC];
  } else if (block.itemCount_ === 1) {
    const argument0 = Blockly.Processing.valueToCode(block, 'ADD0', Blockly.Processing.ORDER_NONE) || '""';
    return ['String.valueOf(' + argument0 + ')', Blockly.Processing.ORDER_FUNCTION_CALL];
  } else {
    const elements = new Array(block.itemCount_);
    for (let i = 0; i < block.itemCount_; i++) {
      elements[i] = Blockly.Processing.valueToCode(block, 'ADD' + i, Blockly.Processing.ORDER_NONE) || '""';
    }
    const code = elements.join(' + ');
    return [code, Blockly.Processing.ORDER_ADDITION];
  }
};

Blockly.Processing.forBlock['text_append'] = function(block) {
  const varId = block.getFieldValue('VAR');
  const varName = Blockly.Processing.nameDB_.getName(varId, Blockly.Variables.NAME_TYPE);
  const value = Blockly.Processing.valueToCode(block, 'TEXT', Blockly.Processing.ORDER_NONE) || '""';
  return varName + ' = ' + varName + ' + String.valueOf(' + value + ');\n';
};

Blockly.Processing.forBlock['text_length'] = function(block) {
  const argument0 = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_MEMBER) || '""';
  return [argument0 + '.length()', Blockly.Processing.ORDER_FUNCTION_CALL];
};

Blockly.Processing.forBlock['text_isEmpty'] = function(block) {
  const argument0 = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_MEMBER) || '""';
  return [argument0 + '.isEmpty()', Blockly.Processing.ORDER_FUNCTION_CALL];
};

Blockly.Processing.forBlock['text_indexOf'] = function(block) {
  const operator = block.getFieldValue('END') === 'FIRST' ? 'indexOf' : 'lastIndexOf';
  const argument0 = Blockly.Processing.valueToCode(block, 'FIND', Blockly.Processing.ORDER_NONE) || '""';
  const argument1 = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_MEMBER) || '""';
  const code = argument1 + '.' + operator + '(' + argument0 + ') + 1';
  return [code, Blockly.Processing.ORDER_ADDITION];
};

Blockly.Processing.forBlock['text_charAt'] = function(block) {
  const where = block.getFieldValue('WHERE');
  const argument0 = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_MEMBER) || '""';
  switch (where) {
    case 'FROM_START':
      const at = Blockly.Processing.getRelativeIndex(block, 'AT');
      return [argument0 + '.charAt(' + at + ')', Blockly.Processing.ORDER_FUNCTION_CALL];
    case 'RANDOM':
      return [argument0 + '.charAt(int(random(' + argument0 + '.length())))', Blockly.Processing.ORDER_FUNCTION_CALL];
  }
  return [argument0 + '.charAt(0)', Blockly.Processing.ORDER_FUNCTION_CALL];
};

Blockly.Processing.forBlock['text_print'] = function(block) {
  const msg = Blockly.Processing.valueToCode(block, 'TEXT', Blockly.Processing.ORDER_NONE) || '""';
  return 'println(' + msg + ');\n';
};