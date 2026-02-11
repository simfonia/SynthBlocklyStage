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
    "message0": "繪製矩形 x %1 y %2 寬 %3 高 %4",
    "args0": [
      { "type": "input_value", "name": "X" },
      { "type": "input_value", "name": "Y" },
      { "type": "input_value", "name": "W" },
      { "type": "input_value", "name": "H" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "在指定座標繪製一個矩形。"
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
    "tooltip": "繪製一個圓形或橢圓形。"
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
    "tooltip": "在三個頂點之間繪製三角形。"
  },
  {
    "type": "visual_line",
    "message0": "繪製直線 x1 %1 y1 %2 到 x2 %3 y2 %4",
    "args0": [
      { "type": "input_value", "name": "X1" },
      { "type": "input_value", "name": "Y1" },
      { "type": "input_value", "name": "X2" },
      { "type": "input_value", "name": "Y2" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "在兩點之間繪製一條直線。"
  },
  {
    "type": "visual_fill",
    "message0": "設定填充顏色 %1",
    "args0": [
      { "type": "input_value", "name": "COLOR" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "設定填充顏色。"
  },
  {
    "type": "visual_stroke",
    "message0": "設定邊框顏色 %1",
    "args0": [
      { "type": "input_value", "name": "COLOR" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "設定後續繪圖形狀的邊框顏色。"
  },
  {
    "type": "visual_stroke_weight",
    "message0": "設定邊框粗細 %1",
    "args0": [
      { "type": "input_value", "name": "WEIGHT" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "設定邊框的寬度（像素）。"
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
