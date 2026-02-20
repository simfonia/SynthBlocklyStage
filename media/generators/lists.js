/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * List generators for Processing (Java).
 * Using ArrayList<Object> for flexibility.
 */

Blockly.Processing.forBlock['lists_create_empty'] = function(block) {
  return ['new ArrayList<Object>()', Blockly.Processing.ORDER_ATOMIC];
};

Blockly.Processing.forBlock['lists_create_with'] = function(block) {
  const elements = new Array(block.itemCount_);
  for (let i = 0; i < block.itemCount_; i++) {
    elements[i] = Blockly.Processing.valueToCode(block, 'ADD' + i, Blockly.Processing.ORDER_NONE) || 'null';
  }
  const code = 'new ArrayList<Object>(Arrays.asList(' + elements.join(', ') + '))';
  return [code, Blockly.Processing.ORDER_ATOMIC];
};

Blockly.Processing.forBlock['lists_length'] = function(block) {
  const list = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_MEMBER) || 'new ArrayList()';
  return [list + '.size()', Blockly.Processing.ORDER_FUNCTION_CALL];
};

Blockly.Processing.forBlock['lists_isEmpty'] = function(block) {
  const list = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_MEMBER) || 'new ArrayList()';
  return [list + '.isEmpty()', Blockly.Processing.ORDER_FUNCTION_CALL];
};

Blockly.Processing.forBlock['lists_getIndex'] = function(block) {
  const list = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_MEMBER) || 'new ArrayList()';
  const at = Blockly.Processing.getRelativeIndex(block, 'AT');
  const code = list + '.get((int)(' + at + '))';
  return [code, Blockly.Processing.ORDER_FUNCTION_CALL];
};

Blockly.Processing.forBlock['lists_setIndex'] = function(block) {
  const list = Blockly.Processing.valueToCode(block, 'LIST', Blockly.Processing.ORDER_MEMBER) || 'new ArrayList()';
  const mode = block.getFieldValue('MODE') || 'SET';
  const value = Blockly.Processing.valueToCode(block, 'TO', Blockly.Processing.ORDER_ASSIGNMENT) || 'null';
  const at = Blockly.Processing.getRelativeIndex(block, 'AT');
  
  if (mode === 'SET') {
    return list + '.set((int)(' + at + '), ' + value + ');\n';
  } else if (mode === 'INSERT') {
    return list + '.add((int)(' + at + '), ' + value + ');\n';
  }
  return '';
};

Blockly.Processing.forBlock['lists_split'] = function(block) {
  const input = Blockly.Processing.valueToCode(block, 'INPUT', Blockly.Processing.ORDER_MEMBER) || '""';
  const delimiter = Blockly.Processing.valueToCode(block, 'DELIM', Blockly.Processing.ORDER_NONE) || '""';
  const mode = block.getFieldValue('MODE');
  const str = 'String.valueOf(' + input + ')';
  
  if (mode === 'SPLIT') {
    const code = 'new ArrayList<Object>(Arrays.asList(' + str + '.split(' + delimiter + ')))';
    return [code, Blockly.Processing.ORDER_ATOMIC];
  } else {
    const code = 'String.join(' + delimiter + ', ' + input + ')';
    return [code, Blockly.Processing.ORDER_ATOMIC];
  }
};
  
  