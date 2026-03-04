/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Visual Geometry Blocks: Shapes, Fills, and Strokes.
 */

Blockly.defineBlocksWithJsonArray([
  {
    "type": "visual_rect",
    "message0": "%{BKY_VISUAL_RECT}",
    "args0": [
      { "type": "input_value", "name": "X" },
      { "type": "input_value", "name": "Y" },
      { "type": "input_value", "name": "W" },
      { "type": "input_value", "name": "H" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "%{BKY_VISUAL_RECT_TOOLTIP}"
  },
  {
    "type": "visual_ellipse",
    "message0": "%{BKY_VISUAL_ELLIPSE}",
    "args0": [
      { "type": "input_value", "name": "X" },
      { "type": "input_value", "name": "Y" },
      { "type": "input_value", "name": "W" },
      { "type": "input_value", "name": "H" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "%{BKY_VISUAL_ELLIPSE_TOOLTIP}"
  },
  {
    "type": "visual_triangle",
    "message0": "%{BKY_VISUAL_TRIANGLE}",
    "args0": [
      { "type": "input_value", "name": "X1" },
      { "type": "input_value", "name": "Y1" },
      { "type": "input_value", "name": "X2" },
      { "type": "input_value", "name": "Y2" },
      { "type": "input_value", "name": "X3" },
      { "type": "input_value", "name": "Y3" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "%{BKY_VISUAL_TRIANGLE_TOOLTIP}"
  },
  {
    "type": "visual_line",
    "message0": "%{BKY_VISUAL_LINE}",
    "args0": [
      { "type": "input_value", "name": "X1" },
      { "type": "input_value", "name": "Y1" },
      { "type": "input_value", "name": "X2" },
      { "type": "input_value", "name": "Y2" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "%{BKY_VISUAL_LINE_TOOLTIP}"
  },
  {
    "type": "visual_fill",
    "message0": "%{BKY_VISUAL_FILL}",
    "args0": [
      { "type": "input_value", "name": "COLOR" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "%{BKY_VISUAL_FILL_TOOLTIP}"
  },
  {
    "type": "visual_stroke",
    "message0": "%{BKY_VISUAL_STROKE}",
    "args0": [
      { "type": "input_value", "name": "COLOR" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "%{BKY_VISUAL_STROKE_TOOLTIP}"
  },
  {
    "type": "visual_stroke_weight",
    "message0": "%{BKY_VISUAL_STROKE_WEIGHT}",
    "args0": [
      { "type": "input_value", "name": "WEIGHT" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "%{BKY_VISUAL_STROKE_WEIGHT_TOOLTIP}"
  },
  {
    "type": "visual_no_stroke",
    "message0": "%{BKY_VISUAL_NO_STROKE}",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB"
  },
  {
    "type": "visual_no_fill",
    "message0": "%{BKY_VISUAL_NO_FILL}",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB"
  }
]);
