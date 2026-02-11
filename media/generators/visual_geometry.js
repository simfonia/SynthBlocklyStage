/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Visual Geometry Generators: Shapes and Styles.
 */

Blockly.Processing.registerGenerator("visual_rect", function (block) {
  const x = Blockly.Processing.valueToCode(block, "X", Blockly.Processing.ORDER_ATOMIC) || "0";
  const y = Blockly.Processing.valueToCode(block, "Y", Blockly.Processing.ORDER_ATOMIC) || "0";
  const w = Blockly.Processing.valueToCode(block, "W", Blockly.Processing.ORDER_ATOMIC) || "100";
  const h = Blockly.Processing.valueToCode(block, "H", Blockly.Processing.ORDER_ATOMIC) || "100";
  return `rect(floatVal(${x}), floatVal(${y}), floatVal(${w}), floatVal(${h}));\n`;
});

Blockly.Processing.registerGenerator("visual_ellipse", function (block) {
  const x = Blockly.Processing.valueToCode(block, "X", Blockly.Processing.ORDER_ATOMIC) || "0";
  const y = Blockly.Processing.valueToCode(block, "Y", Blockly.Processing.ORDER_ATOMIC) || "0";
  const w = Blockly.Processing.valueToCode(block, "W", Blockly.Processing.ORDER_ATOMIC) || "100";
  const h = Blockly.Processing.valueToCode(block, "H", Blockly.Processing.ORDER_ATOMIC) || "100";
  return `ellipse(floatVal(${x}), floatVal(${y}), floatVal(${w}), floatVal(${h}));\n`;
});

Blockly.Processing.registerGenerator("visual_triangle", function (block) {
  const x1 = Blockly.Processing.valueToCode(block, "X1", Blockly.Processing.ORDER_ATOMIC) || "0";
  const y1 = Blockly.Processing.valueToCode(block, "Y1", Blockly.Processing.ORDER_ATOMIC) || "0";
  const x2 = Blockly.Processing.valueToCode(block, "X2", Blockly.Processing.ORDER_ATOMIC) || "50";
  const y2 = Blockly.Processing.valueToCode(block, "Y2", Blockly.Processing.ORDER_ATOMIC) || "0";
  const x3 = Blockly.Processing.valueToCode(block, "X3", Blockly.Processing.ORDER_ATOMIC) || "25";
  const y3 = Blockly.Processing.valueToCode(block, "Y3", Blockly.Processing.ORDER_ATOMIC) || "50";
  return `triangle(floatVal(${x1}), floatVal(${y1}), floatVal(${x2}), floatVal(${y2}), floatVal(${x3}), floatVal(${y3}));\n`;
});

Blockly.Processing.registerGenerator("visual_line", function (block) {
  const x1 = Blockly.Processing.valueToCode(block, "X1", Blockly.Processing.ORDER_ATOMIC) || "0";
  const y1 = Blockly.Processing.valueToCode(block, "Y1", Blockly.Processing.ORDER_ATOMIC) || "0";
  const x2 = Blockly.Processing.valueToCode(block, "X2", Blockly.Processing.ORDER_ATOMIC) || "100";
  const y2 = Blockly.Processing.valueToCode(block, "Y2", Blockly.Processing.ORDER_ATOMIC) || "100";
  return `line(floatVal(${x1}), floatVal(${y1}), floatVal(${x2}), floatVal(${y2}));\n`;
});

Blockly.Processing.registerGenerator("visual_fill", function (block) {
  const color = Blockly.Processing.valueToCode(block, "COLOR", Blockly.Processing.ORDER_ATOMIC) || "color(255)";
  return `fill(${color});\n`;
});

Blockly.Processing.registerGenerator("visual_stroke", function (block) {
  const color = Blockly.Processing.valueToCode(block, "COLOR", Blockly.Processing.ORDER_ATOMIC) || "color(0)";
  return `stroke(${color});\n`;
});

Blockly.Processing.registerGenerator("visual_stroke_weight", function (block) {
  const weight = Blockly.Processing.valueToCode(block, "WEIGHT", Blockly.Processing.ORDER_ATOMIC) || "1";
  return `strokeWeight(floatVal(${weight}));\n`;
});

Blockly.Processing.registerGenerator("visual_no_stroke", function (block) {
  return "noStroke();\n";
});

Blockly.Processing.registerGenerator("visual_no_fill", function (block) {
  return "noFill();\n";
});