/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Serial communication generators for Processing (Java).
 */

Blockly.Processing.forBlock['serial_init'] = function(block) {
  const index = block.getFieldValue('INDEX');
  const baud = block.getFieldValue('BAUD');
  
  Blockly.Processing.addImport("import processing.serial.*;");
  
  // Note: myPort is now pre-declared in visual_stage_setup to support dynamic UI
  return `println("--- Available Serial Ports ---");\n` +
         `println(Serial.list());\n` +
         `serialBaud = ${baud};\n` +
         `try {\n` +
         `  myPort = new Serial(this, Serial.list()[${index}], serialBaud);\n` +
         `  myPort.bufferUntil('\\n');\n` +
         `} catch (Exception e) {\n` +
         `  println("Serial Init Failed: " + e.getMessage());\n` +
         `}\n`;
};

Blockly.Processing.forBlock['serial_available'] = function(block) {
  return ["(myPort != null && myPort.available() > 0)", Blockly.Processing.ORDER_ATOMIC];
};

Blockly.Processing.forBlock['serial_read_string'] = function(block) {
  const code = "myPort.readStringUntil('\n').trim()";
  return [code, Blockly.Processing.ORDER_FUNCTION_CALL];
};

Blockly.Processing.forBlock['sb_serial_write'] = function(block) {
  const content = Blockly.Processing.valueToCode(block, 'CONTENT', Blockly.Processing.ORDER_ATOMIC) || '""';
  return `if (myPort != null) myPort.write(${content});\n`;
};

Blockly.Processing.forBlock['sb_serial_data_received'] = function(block) {
  const varId = block.getFieldValue('DATA');
  const varName = Blockly.Processing.nameDB_.getName(varId, Blockly.Variables.NAME_TYPE);
  const branch = Blockly.Processing.statementToCode(block, 'DO');
  
  // Define global variable for the data
  Blockly.Processing.global_vars_[varName] = "String " + varName + " = \"\";";
  
  // Use serialEvent(Serial p) for the hat block implementation
  const code = `
void serialEvent(Serial p) {
  try {
    ${varName} = p.readString();
    if (${varName} != null) {
      ${varName} = ${varName}.toString().trim();
      if (${varName}.toString().length() > 0) {
        println("[Serial] Received: " + ${varName});
        logToScreen("Serial In: " + ${varName}, 0);
        ${branch}
      }
    }
  } catch (Exception e) {
    println("[Serial Error] " + e.getMessage());
    e.printStackTrace();
  }
}
`;
  Blockly.Processing.definitions_['serial_event'] = code;
  return null;
};

Blockly.Processing.forBlock['serial_check_mask'] = function(block) {
  const mask = Blockly.Processing.valueToCode(block, 'MASK', Blockly.Processing.ORDER_BITWISE_AND) || '0';
  const key = block.getFieldValue('KEY') || '1';
  
  // (mask & (1 << (key - 1))) != 0
  const code = "((" + mask + " & (1 << (" + key + " - 1))) != 0)";
  return [code, Blockly.Processing.ORDER_RELATIONAL];
};

Blockly.Processing.forBlock['sb_serial_check_key_mask'] = function(block) {
  const dataVar = Blockly.Processing.valueToCode(block, 'DATA', Blockly.Processing.ORDER_ATOMIC) || '""';
  const keyNum = block.getFieldValue('KEY') || '1';
  
  // Custom Java logic to parse "KEYS:N"
  const code = "((function() { " +
               "if (" + dataVar + " == null || !" + dataVar + ".startsWith(\"KEYS:\")) return false; " +
               "try { int val = Integer.parseInt(" + dataVar + ".split(\":\")[1]); " +
               "return (val & (1 << (" + keyNum + " - 1))) != 0; } catch(Exception e) { return false; } " +
               "})())";
  
  // Note: Java doesn't support anonymous functions like JS in an expression directly. 
  // We should use a helper method instead.
  
  const helperName = Blockly.Processing.provideFunction_('checkKeyMask', `
boolean checkKeyMask(Object dataObj, int key) {
  if (dataObj == null) return false;
  String data = String.valueOf(dataObj).trim();
  int splitIdx = data.indexOf(":");
  if (splitIdx == -1) return false;
  
  String prefix = data.substring(0, splitIdx).toUpperCase();
  String valStr = data.substring(splitIdx + 1).trim();
  
  try {
    int val = Integer.parseInt(valStr);
    if (prefix.equals("KEYS")) {
      // Bitmask mode: check if Nth bit is set
      return (val & (1 << (key - 1))) != 0;
    } else if (prefix.equals("KEY")) {
      // Single key mode: check if index matches
      return val == key;
    }
  } catch(Exception e) {}
  return false;
}
`);
  return [helperName + "(" + dataVar + ", " + keyNum + ")", Blockly.Processing.ORDER_FUNCTION_CALL];
};
