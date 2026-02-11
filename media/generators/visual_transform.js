/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Visual Transform Generators: Rotate, Translate, Scale, and Matrix isolation.
 */

Blockly.Processing.registerGenerator("visual_rotate", function (block) {
  const angle = Blockly.Processing.valueToCode(block, "ANGLE", Blockly.Processing.ORDER_ATOMIC) || "0";
  return `rotate(radians(floatVal(${angle})));\n`;
});

Blockly.Processing.registerGenerator("visual_translate", function (block) {
  const x = Blockly.Processing.valueToCode(block, "X", Blockly.Processing.ORDER_ATOMIC) || "0";
  const y = Blockly.Processing.valueToCode(block, "Y", Blockly.Processing.ORDER_ATOMIC) || "0";
  return `translate(floatVal(${x}), floatVal(${y}));\n`;
});

Blockly.Processing.registerGenerator("visual_scale", function (block) {
  const s = Blockly.Processing.valueToCode(block, "S", Blockly.Processing.ORDER_ATOMIC) || "1.0";
  return `scale(floatVal(${s}));\n`;
});

Blockly.Processing.registerGenerator("visual_push_pop", function (block) {
  const branch = Blockly.Processing.statementToCode(block, 'STACK');
  return `pushMatrix();\npushStyle();\n${branch}popStyle();\npopMatrix();\n`;
});