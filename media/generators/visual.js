/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Visual/Drawing generators for Processing.
 */

Blockly.Processing.forBlock['visual_size'] = function(block) {
  const w = block.getFieldValue('WIDTH');
  const h = block.getFieldValue('HEIGHT');
  return `size(${w}, ${h});\n`;
};

Blockly.Processing.forBlock['visual_background'] = function(block) {
  const r = Blockly.Processing.valueToCode(block, 'R', Blockly.Processing.ORDER_ATOMIC) || '0';
  const g = Blockly.Processing.valueToCode(block, 'G', Blockly.Processing.ORDER_ATOMIC);
  const b = Blockly.Processing.valueToCode(block, 'B', Blockly.Processing.ORDER_ATOMIC);
  
  if (g && b) return `background(${r}, ${g}, ${b});\n`;
  return `background(${r});\n`;
};

Blockly.Processing.forBlock['visual_rect'] = function(block) {
  const x = Blockly.Processing.valueToCode(block, 'X', Blockly.Processing.ORDER_ATOMIC) || '0';
  const y = Blockly.Processing.valueToCode(block, 'Y', Blockly.Processing.ORDER_ATOMIC) || '0';
  const w = Blockly.Processing.valueToCode(block, 'W', Blockly.Processing.ORDER_ATOMIC) || '100';
  const h = Blockly.Processing.valueToCode(block, 'H', Blockly.Processing.ORDER_ATOMIC) || '100';
  return `rect(${x}, ${y}, ${w}, ${h});\n`;
};

Blockly.Processing.forBlock['visual_line'] = function(block) {
  const x1 = Blockly.Processing.valueToCode(block, 'X1', Blockly.Processing.ORDER_ATOMIC) || '0';
  const y1 = Blockly.Processing.valueToCode(block, 'Y1', Blockly.Processing.ORDER_ATOMIC) || '0';
  const x2 = Blockly.Processing.valueToCode(block, 'X2', Blockly.Processing.ORDER_ATOMIC) || '0';
  const y2 = Blockly.Processing.valueToCode(block, 'Y2', Blockly.Processing.ORDER_ATOMIC) || '0';
  return `line(${x1}, ${y1}, ${x2}, ${y2});\n`;
};

Blockly.Processing.forBlock['visual_fill'] = function(block) {
  const r = Blockly.Processing.valueToCode(block, 'R', Blockly.Processing.ORDER_ATOMIC) || '255';
  const g = Blockly.Processing.valueToCode(block, 'G', Blockly.Processing.ORDER_ATOMIC);
  const b = Blockly.Processing.valueToCode(block, 'B', Blockly.Processing.ORDER_ATOMIC);
  const a = Blockly.Processing.valueToCode(block, 'A', Blockly.Processing.ORDER_ATOMIC);
  
  if (g && b && a) return `fill(${r}, ${g}, ${b}, ${a});\n`;
  if (g && b) return `fill(${r}, ${g}, ${b});\n`;
  if (a) return `fill(${r}, ${a});\n`;
  return `fill(${r});\n`;
};

Blockly.Processing.forBlock['visual_stroke'] = function(block) {
  const r = Blockly.Processing.valueToCode(block, 'R', Blockly.Processing.ORDER_ATOMIC) || '0';
  const g = Blockly.Processing.valueToCode(block, 'G', Blockly.Processing.ORDER_ATOMIC);
  const b = Blockly.Processing.valueToCode(block, 'B', Blockly.Processing.ORDER_ATOMIC);
  
  if (g && b) return `stroke(${r}, ${g}, ${b});\n`;
  return `stroke(${r});\n`;
};

Blockly.Processing.forBlock['visual_stroke_weight'] = function(block) {
  const weight = Blockly.Processing.valueToCode(block, 'WEIGHT', Blockly.Processing.ORDER_ATOMIC) || '1';
  return `strokeWeight(${weight});\n`;
};

Blockly.Processing.forBlock['visual_no_stroke'] = function(block) {
  return `noStroke();\n`;
};

Blockly.Processing.forBlock['visual_no_fill'] = function(block) {
  return `noFill();\n`;
};

Blockly.Processing.forBlock['visual_constant'] = function(block) {
  const constant = block.getFieldValue('CONSTANT');
  return [constant, Blockly.Processing.ORDER_ATOMIC];
};

Blockly.Processing.forBlock['visual_pixel_density'] = function(block) {
  return `pixelDensity(displayDensity());\n`;
};
