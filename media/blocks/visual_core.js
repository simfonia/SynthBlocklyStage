/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Visual Core Blocks: Canvas setup, Stage, and Color utils.
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
    "type": "visual_color_picker",
    "message0": "%1",
    "args0": [
      { "type": "field_colour", "name": "COLOR", "colour": "#ff0000" }
    ],
    "output": null,
    "colour": "#3498DB",
    "tooltip": "選取一個顏色數值。"
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
    "type": "visual_frame_rate",
    "message0": "%{BKY_VISUAL_FRAME_RATE}",
    "args0": [
      { "type": "input_value", "name": "FPS", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "%{BKY_VISUAL_FRAME_RATE_TOOLTIP}"
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
  }
]);

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
      "tooltip": "%{BKY_VISUAL_STAGE_SETUP_TOOLTIP}%{BKY_HELP_HINT}",
      "helpUrl": window.docsBaseUri + "visual_stage_zh-hant.html"
    });
    this.setInputsInline(false);
  }
};
