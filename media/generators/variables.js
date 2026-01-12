/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Variable generators for Processing (Java).
 */

Blockly.Processing.forBlock['variables_get'] = function(block) {
  const varId = block.getFieldValue('VAR');
  let varName = Blockly.Processing.nameDB_.getName(varId, Blockly.Variables.NAME_TYPE);
  
  // FORCE LITERAL NAMES & TYPES
  const forceNames = ['waveScale', 'masterGain', 'pitch', 'velocity', 'channel', 'isMidiMode', 'trailAlpha', 'stageBgColor', 'stageFgColor', 'adsrA', 'adsrD', 'adsrS', 'adsrR'];
  const intVars = ['stageBgColor', 'stageFgColor', 'pitch', 'velocity', 'channel'];
  
  const actualName = block.workspace.getVariableMap().getVariableById(varId)?.name;
  if (actualName && forceNames.includes(actualName)) {
      varName = actualName;
  }

  // Auto-declare if not defined
  if (!Blockly.Processing.global_vars_[varName]) {
      const type = intVars.includes(varName) ? "int" : "float";
      Blockly.Processing.global_vars_[varName] = type + " " + varName + ";";
  }
  
  return [varName, Blockly.Processing.ORDER_ATOMIC];
};

Blockly.Processing.forBlock['variables_set'] = function(block) {
  const argument0 = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_ASSIGNMENT) || '0';
  const varId = block.getFieldValue('VAR');
  let varName = Blockly.Processing.nameDB_.getName(varId, Blockly.Variables.NAME_TYPE);

  const forceNames = ['waveScale', 'masterGain', 'pitch', 'velocity', 'channel', 'isMidiMode', 'trailAlpha', 'stageBgColor', 'stageFgColor', 'adsrA', 'adsrD', 'adsrS', 'adsrR'];
  const intVars = ['stageBgColor', 'stageFgColor', 'pitch', 'velocity', 'channel'];
  
  const actualName = block.workspace.getVariableMap().getVariableById(varId)?.name;
  if (actualName && forceNames.includes(actualName)) {
      varName = actualName;
  }
  
  // Ensure declaration exists
  if (!Blockly.Processing.global_vars_[varName] || !Blockly.Processing.global_vars_[varName].includes('=')) {
      const type = intVars.includes(varName) ? "int" : "float";
      Blockly.Processing.global_vars_[varName] = type + " " + varName + " = 0;"; 
  }
  return varName + ' = ' + argument0 + ';\n';
};
