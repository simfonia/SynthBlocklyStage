/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 * @fileoverview Helper functions for generating Processing (Java) for blocks.
 */

Blockly.Processing = new Blockly.Generator('Processing');
Blockly.Processing.forBlock = {}; // Modern Blockly registration point

/**
 * List of reserved words for Processing (Java).
 */
Blockly.Processing.addReservedWords(
    'setup,draw,if,else,for,switch,case,while,do,break,continue,return,void,boolean,char,byte,int,long,float,double,String,Array,color,PImage,PFont,PShape,size,background,fill,noFill,stroke,noStroke,strokeWeight,rect,ellipse,line,point,triangle,quad,arc,curve,bezier,map,constrain,abs,min,max,sin,cos,tan,random,println,millis,width,height,mouseX,mouseY,mousePressed,keyPressed,key,keyCode'
);

Blockly.Processing.ORDER_ATOMIC = 0;
Blockly.Processing.ORDER_NEW = 1.1;
Blockly.Processing.ORDER_MEMBER = 1.2;
Blockly.Processing.ORDER_FUNCTION_CALL = 2;
Blockly.Processing.ORDER_MULTIPLICATION = 5.1;
Blockly.Processing.ORDER_DIVISION = 5.2;
Blockly.Processing.ORDER_ADDITION = 6.2;
Blockly.Processing.ORDER_SUBTRACTION = 6.1;
Blockly.Processing.ORDER_RELATIONAL = 8;
Blockly.Processing.ORDER_EQUALITY = 9;
Blockly.Processing.ORDER_LOGICAL_AND = 13;
Blockly.Processing.ORDER_LOGICAL_OR = 14;
Blockly.Processing.ORDER_ASSIGNMENT = 16;
Blockly.Processing.ORDER_NONE = 99;

/**
 * Initialize the generator.
 */
Blockly.Processing.init = function(workspace) {
  Blockly.Processing.imports_ = Object.create(null);
  Blockly.Processing.global_vars_ = Object.create(null);
  Blockly.Processing.definitions_ = Object.create(null); 
  Blockly.Processing.setups_ = Object.create(null);

  if (!Blockly.Processing.nameDB_) {
    Blockly.Processing.nameDB_ = new Blockly.Names(Blockly.Processing.RESERVED_WORDS_);
  } else {
    Blockly.Processing.nameDB_.reset();
  }
  Blockly.Processing.nameDB_.setVariableMap(workspace.getVariableMap());
};

/**
 * Finish the code generation.
 */
Blockly.Processing.finish = function(code) {
  // 1. Imports
  const imports = Object.values(Blockly.Processing.imports_).sort().join('\n');
  // 2. Global variables
  const globalVars = Object.values(Blockly.Processing.global_vars_).sort().join('\n');
  // 3. Setup function
  const setups = Object.values(Blockly.Processing.setups_);
  const setup = 'void setup() {\n  ' + setups.join('\n  ') + '\n}\n';
  // 4. Draw function
  const draw = 'void draw() {\n  ' + code.replace(/\n/g, '\n  ') + '\n}\n';

  let finalCode = '';
  if (imports) finalCode += imports + '\n\n';
  if (globalVars) finalCode += globalVars + '\n\n';
  
  const definitions = Object.values(Blockly.Processing.definitions_).join('\n\n');
  if (definitions) finalCode += definitions + '\n\n';

  finalCode += setup + '\n' + draw;

  // Cleanup
  delete Blockly.Processing.imports_;
  delete Blockly.Processing.global_vars_;
  delete Blockly.Processing.definitions_;
  delete Blockly.Processing.setups_;
  Blockly.Processing.nameDB_.reset();

  return finalCode;
};

Blockly.Processing.scrubNakedValue = function(line) {
  return line + ';\n';
};

Blockly.Processing.quote_ = function(string) {
  return '"' + string.replace(/\\/g, '\\\\').replace(/"/g, '"') + '"';
};

Blockly.Processing.scrub_ = function(block, code) {
  var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  var nextCode = Blockly.Processing.blockToCode(nextBlock);
  return code + nextCode;
};

// =============================================================================
// BUILT-IN COMMON GENERATORS
// =============================================================================

Blockly.Processing.forBlock['math_number'] = function(block) {
  const code = parseFloat(block.getFieldValue('NUM'));
  const order = code >= 0 ? Blockly.Processing.ORDER_ATOMIC : Blockly.Processing.ORDER_UNARY_NEGATION;
  return [String(code), order];
};

Blockly.Processing.forBlock['math_arithmetic'] = function(block) {
  const OPERATORS = {
    'ADD': [' + ', Blockly.Processing.ORDER_ADDITION],
    'MINUS': [' - ', Blockly.Processing.ORDER_SUBTRACTION],
    'MULTIPLY': [' * ', Blockly.Processing.ORDER_MULTIPLICATION],
    'DIVIDE': [' / ', Blockly.Processing.ORDER_DIVISION]
  };
  const tuple = OPERATORS[block.getFieldValue('OP')];
  const operator = tuple[0];
  const order = tuple[1];
  const argument0 = Blockly.Processing.valueToCode(block, 'A', order) || '0';
  const argument1 = Blockly.Processing.valueToCode(block, 'B', order) || '0';
  return [argument0 + operator + argument1, order];
};

Blockly.Processing.forBlock['logic_compare'] = function(block) {
  const operator = { 'EQ': '==', 'NEQ': '!=', 'LT': '<', 'LTE': '<=', 'GT': '>', 'GTE': '>=' }[block.getFieldValue('OP')];
  const order = Blockly.Processing.ORDER_RELATIONAL;
  const argument0 = Blockly.Processing.valueToCode(block, 'A', order) || '0';
  const argument1 = Blockly.Processing.valueToCode(block, 'B', order) || '0';
  return [argument0 + ' ' + operator + ' ' + argument1, order];
};

Blockly.Processing.forBlock['variables_get'] = function(block) {
  const varId = block.getFieldValue('VAR');
  let varName = Blockly.Processing.nameDB_.getName(varId, Blockly.Variables.NAME_TYPE);
  
  // FORCE LITERAL NAMES for common variables to ensure UI/logic sync
  const forceNames = ['waveScale', 'masterGain', 'pitch', 'velocity', 'channel', 'isMidiMode', 'trailAlpha'];
  const actualName = block.workspace.getVariableMap().getVariableById(varId)?.name;
  if (actualName && forceNames.includes(actualName)) {
      varName = actualName;
  }

  // Auto-declare if absolutely unknown (don't overwrite existing init)
  if (!Blockly.Processing.global_vars_[varName]) {
      Blockly.Processing.global_vars_[varName] = "float " + varName + ";";
  }
  
  return [varName, Blockly.Processing.ORDER_ATOMIC];
};

Blockly.Processing.forBlock['variables_set'] = function(block) {
  const argument0 = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_ASSIGNMENT) || '0';
  const varId = block.getFieldValue('VAR');
  let varName = Blockly.Processing.nameDB_.getName(varId, Blockly.Variables.NAME_TYPE);

  const forceNames = ['waveScale', 'masterGain', 'pitch', 'velocity', 'channel', 'isMidiMode', 'trailAlpha'];
  const actualName = block.workspace.getVariableMap().getVariableById(varId)?.name;
  if (actualName && forceNames.includes(actualName)) {
      varName = actualName;
  }
  
  // Explicit set takes precedence
  if (!Blockly.Processing.global_vars_[varName] || !Blockly.Processing.global_vars_[varName].includes('=')) {
      Blockly.Processing.global_vars_[varName] = "float " + varName + " = 0;"; 
  }
  return varName + ' = ' + argument0 + ';\n';
};

// Control For Loop
Blockly.Processing.forBlock['controls_for'] = function(block) {
  const variable0 = Blockly.Processing.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  const argument0 = Blockly.Processing.valueToCode(block, 'FROM', Blockly.Processing.ORDER_ASSIGNMENT) || '0';
  const argument1 = Blockly.Processing.valueToCode(block, 'TO', Blockly.Processing.ORDER_ASSIGNMENT) || '0';
  const increment = Blockly.Processing.valueToCode(block, 'BY', Blockly.Processing.ORDER_ASSIGNMENT) || '1';
  let branch = Blockly.Processing.statementToCode(block, 'DO');
  branch = Blockly.Processing.addLoopTrap(branch, block);
  let code;
  
  const isNumber = (val) => !isNaN(parseFloat(val)) && isFinite(val);

  if (isNumber(argument0) && isNumber(argument1) && isNumber(increment)) {
    // All numeric constants
    const up = Number(argument0) <= Number(argument1);
    code = 'for (int ' + variable0 + ' = ' + argument0 + '; ' +
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
    // Dynamic values
    code = 'for (int ' + variable0 + ' = ' + argument0 + '; ' +
        variable0 + ' <= ' + argument1 + '; ' +
        variable0 + ' += ' + increment + ') {\n' + branch + '}\n';
  }
  return code;
};

// Control If (already exists, but adding for context reference)
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