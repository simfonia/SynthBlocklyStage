/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Function (Procedures) generators for Processing (Java).
 */

Blockly.Processing.forBlock['procedures_defnoreturn'] = function(block) {
  const funcName = Blockly.Processing.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
  let branch = Blockly.Processing.statementToCode(block, 'STACK');
  
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    // Defaulting to float for music/visual variables, or Object for generic
    args.push('float ' + Blockly.Processing.nameDB_.getName(variables[i], Blockly.Variables.NAME_TYPE));
  }
  
  let code = 'void ' + funcName + '(' + args.join(', ') + ') {\n' + branch + '}\n';
  
  // Store the definition to be placed at top level
  Blockly.Processing.definitions_['%' + funcName] = code;
  return null;
};

Blockly.Processing.forBlock['procedures_defreturn'] = function(block) {
  const funcName = Blockly.Processing.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
  let branch = Blockly.Processing.statementToCode(block, 'STACK');
  let returnValue = Blockly.Processing.valueToCode(block, 'RETURN', Blockly.Processing.ORDER_NONE) || '';
  
  if (returnValue) {
    returnValue = '  return ' + returnValue + ';\n';
  }

  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args.push('float ' + Blockly.Processing.nameDB_.getName(variables[i], Blockly.Variables.NAME_TYPE));
  }
  
  // Defaulting return type to float for this stage tool
  let code = 'float ' + funcName + '(' + args.join(', ') + ') {\n' + branch + returnValue + '}\n';
  
  Blockly.Processing.definitions_['%' + funcName] = code;
  return null;
};

Blockly.Processing.forBlock['procedures_callnoreturn'] = function(block) {
  const funcName = Blockly.Processing.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args.push(Blockly.Processing.valueToCode(block, 'ARG' + i, Blockly.Processing.ORDER_NONE) || '0');
  }
  return funcName + '(' + args.join(', ') + ');\n';
};

Blockly.Processing.forBlock['procedures_callreturn'] = function(block) {
  const funcName = Blockly.Processing.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args.push(Blockly.Processing.valueToCode(block, 'ARG' + i, Blockly.Processing.ORDER_NONE) || '0');
  }
  const code = funcName + '(' + args.join(', ') + ')';
  return [code, Blockly.Processing.ORDER_FUNCTION_CALL];
};

Blockly.Processing.forBlock['procedures_ifreturn'] = function(block) {
  const condition = Blockly.Processing.valueToCode(block, 'CONDITION', Blockly.Processing.ORDER_NONE) || 'false';
  let code = 'if (' + condition + ') {\n';
  if (block.hasReturnValue_) {
    const value = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_NONE) || '0';
    code += '  return ' + value + ';\n';
  } else {
    code += '  return;\n';
  }
  code += '}\n';
  return code;
};
