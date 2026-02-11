/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Visual Transform Blocks: Rotate, Translate, Scale, and Matrix isolation.
 */

Blockly.defineBlocksWithJsonArray([
  {
    "type": "visual_rotate",
    "message0": "%{BKY_VISUAL_ROTATE}",
    "args0": [
      { "type": "input_value", "name": "ANGLE", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "旋轉座標系統（角度單位：度）。"
  },
  {
    "type": "visual_translate",
    "message0": "%{BKY_VISUAL_TRANSLATE}",
    "args0": [
      { "type": "input_value", "name": "X" },
      { "type": "input_value", "name": "Y" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "平移原點位置。"
  },
  {
    "type": "visual_push_pop",
    "message0": "%{BKY_VISUAL_PUSH_POP}",
    "args0": [
      { "type": "input_statement", "name": "STACK" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "使用 pushMatrix/popMatrix 與 pushStyle/popStyle 隔離內部的變換與顏色設定。"
  },
  {
    "type": "visual_scale",
    "message0": "%{BKY_VISUAL_SCALE}",
    "args0": [
      { "type": "input_value", "name": "S", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "縮放後續繪圖的大小。"
  }
]);
