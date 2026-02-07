/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Loop generators for Processing (Java).
 */

Blockly.Processing.forBlock['controls_repeat_ext'] = function(block) {
  let repeats;
  if (block.getField('TIMES')) {
    repeats = String(Number(block.getFieldValue('TIMES')));
  } else {
    repeats = Blockly.Processing.valueToCode(block, 'TIMES', Blockly.Processing.ORDER_ASSIGNMENT) || '0';
  }
  let branch = Blockly.Processing.statementToCode(block, 'DO');
  
  const loopVar = Blockly.Processing.nameDB_.getDistinctName('count', Blockly.Variables.NAME_TYPE);
  let code = 'for (int ' + loopVar + ' = 0; ' + loopVar + ' < ' + repeats + '; ' + loopVar + '++) {\n' + branch + '}\n';
  return code;
};

Blockly.Processing.forBlock['controls_whileUntil'] = function(block) {
  const until = block.getFieldValue('MODE') === 'UNTIL';
  let argument0 = Blockly.Processing.valueToCode(block, 'BOOL', until ? Blockly.Processing.ORDER_LOGICAL_NOT : Blockly.Processing.ORDER_NONE) || 'false';
  let branch = Blockly.Processing.statementToCode(block, 'DO');
  if (until) {
    argument0 = '!' + argument0;
  }
  return 'while (' + argument0 + ') {\n' + branch + '}\n';
};

Blockly.Processing.forBlock['controls_for'] = function(block) {
  const varId = block.getFieldValue('VAR');
  const variable0 = Blockly.Processing.nameDB_.getName(varId, Blockly.Variables.NAME_TYPE);
  const argument0 = Blockly.Processing.valueToCode(block, 'FROM', Blockly.Processing.ORDER_ASSIGNMENT) || '0';
  const argument1 = Blockly.Processing.valueToCode(block, 'TO', Blockly.Processing.ORDER_ASSIGNMENT) || '0';
  const increment = Blockly.Processing.valueToCode(block, 'BY', Blockly.Processing.ORDER_ASSIGNMENT) || '1';
  let branch = Blockly.Processing.statementToCode(block, 'DO');
  
  // FORCE this variable to be declared as float globally
  Blockly.Processing.global_vars_[variable0] = "float " + variable0 + " = 0.0f;";

  let code;
  const isNumber = (val) => !isNaN(parseFloat(val)) && isFinite(val);

  if (isNumber(argument0) && isNumber(argument1) && isNumber(increment)) {
    const up = Number(argument0) <= Number(argument1);
    code = 'for (' + variable0 + ' = ' + argument0 + '; ' + 
        variable0 + (up ? ' <= ' : ' >= ') + argument1 + '; ' + 
        variable0;
    const step = Math.abs(Number(increment));
    if (step === 1) {
      code += up ? '++' : '--';
    } else {
      code += (up ? ' += ' : ' -= ') + step;
    }
    code += ') {\n' + branch + '}\n';
  } else {
    code = 'for (' + variable0 + ' = floatVal(' + argument0 + '); ' + 
        variable0 + ' <= floatVal(' + argument1 + '); ' + 
        variable0 + ' += floatVal(' + increment + ')) {\n' + branch + '}\n';
  }
  return code;
};

Blockly.Processing.forBlock['controls_forEach'] = function(block) {
  const variable0 = Blockly.Processing.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  const argument0 = Blockly.Processing.valueToCode(block, 'LIST', Blockly.Processing.ORDER_ASSIGNMENT) || 'new ArrayList()';
  let branch = Blockly.Processing.statementToCode(block, 'DO');
  
  // Java style enhanced for-loop. Defaulting to Object type.
  return 'for (Object ' + variable0 + ' : ' + argument0 + ') {\n' + branch + '}\n';
};

Blockly.Processing.forBlock['controls_flow_statements'] = function(block) {
  switch (block.getFieldValue('FLOW')) {
    case 'BREAK':
      return 'break;\n';
    case 'CONTINUE':
      return 'continue;\n';
  }
  throw Error('Unknown flow statement.');
};
