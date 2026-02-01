/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * @fileoverview Visual/Drawing blocks for Processing.
 */

Blockly.defineBlocksWithJsonArray([
  {
    "type": "visual_size",
    "message0": "設定畫布大小 寬 %1 高 %2",
    "args0": [
      { "type": "field_number", "name": "WIDTH", "value": 800, "min": 100 },
      { "type": "field_number", "name": "HEIGHT", "value": 600, "min": 100 }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "設定 Processing 執行視窗的大小。應放在 setup 中。"
  },
  {
    "type": "visual_background",
    "message0": "設定背景顏色 %1",
    "args0": [
      { "type": "input_value", "name": "COLOR" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "清除畫面並填充背景顏色。"
  },
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
  },
  {
    "type": "visual_constant",
    "message0": "%1",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "CONSTANT",
        "options": [
          ["寬度 (width)", "width"],
          ["高度 (height)", "height"],
          ["滑鼠 X (mouseX)", "mouseX"],
          ["滑鼠 Y (mouseY)", "mouseY"]
        ]
      }
    ],
    "output": "Number",
    "colour": "#3498DB",
    "tooltip": "取得畫布的大小或滑鼠位置。"
  },
  {
    "type": "visual_pixel_density",
    "message0": "%{BKY_VISUAL_PIXEL_DENSITY}",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "%{BKY_VISUAL_PIXEL_DENSITY_TOOLTIP}"
  },
  {
    "type": "visual_stage_set_color",
    "message0": "%{BKY_VISUAL_STAGE_SET_COLOR}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "TARGET",
        "options": [
          ["%{BKY_VISUAL_STAGE_BG}", "BG"],
          ["%{BKY_VISUAL_STAGE_WAVE}", "WAVE"]
        ]
      },
      { "type": "input_value", "name": "COLOR" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#2C3E50",
    "tooltip": "在 draw 迴圈或事件中動態改變舞台顏色。"
  },
  {
    "type": "visual_color_picker",
    "message0": "%1",
    "args0": [
      { "type": "field_colour", "name": "COLOR", "colour": "#ff0000" }
    ],
    "output": null,
    "colour": "#3498DB",
    "tooltip": "選取一個顏色數值。"
  }
]);

// Manually define visual_stage_setup to ensure vertical layout using JS API
Blockly.Blocks['visual_stage_setup'] = {
  init: function() {
    this.jsonInit({
      "message0": "%{BKY_VISUAL_STAGE_SETUP_TITLE}",
      "args0": [],
      "message1": "%{BKY_VISUAL_STAGE_SETUP_DIMENSIONS}",
      "args1": [
        { "type": "field_number", "name": "W", "value": 1200 },
        { "type": "field_number", "name": "H", "value": 400 }
      ],
      "message2": "%{BKY_VISUAL_STAGE_SETUP_APPEARANCE}",
      "args2": [
        { "type": "field_colour", "name": "BG_COLOR", "colour": "#000000" },
        { "type": "field_colour", "name": "FG_COLOR", "colour": "#FF0096" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "#2C3E50",
      "tooltip": "%{BKY_VISUAL_STAGE_SETUP_TOOLTIP}",
      "helpUrl": window.docsBaseUri + "visual_stage_zh-hant.html"
    });
    // Explicitly force vertical layout
    this.setInputsInline(false);
  }
};
