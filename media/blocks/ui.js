/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * UI blocks for Processing (ControlP5 library).
 */

Blockly.defineBlocksWithJsonArray([
  {
    "type": "ui_init",
    "message0": "啟動 UI 系統 (ControlP5)",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#FFB300",
    "tooltip": "初始化 ControlP5 介面庫。應放在 setup 中。"
  },
  {
    "type": "ui_add_slider",
    "message0": "新增滑桿 %1 位置 x %2 y %3 寬 %4 高 %5 %6 範圍 %7 到 %8 初始值 %9 標籤 %10",
    "args0": [
      { "type": "field_input", "name": "VAR", "text": "masterGain" },
      { "type": "field_number", "name": "X", "value": 820 },
      { "type": "field_number", "name": "Y", "value": 130 },
      { "type": "field_number", "name": "W", "value": 150 },
      { "type": "field_number", "name": "H", "value": 20 },
      { "type": "input_dummy" },
      { "type": "field_number", "name": "MIN", "value": -40 },
      { "type": "field_number", "name": "MAX", "value": 6 },
      { "type": "field_number", "name": "VAL", "value": -10 },
      { "type": "field_input", "name": "LABEL", "text": "GAIN" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#FFB300"
  },
  {
    "type": "ui_add_toggle",
    "message0": "新增切換開關 名稱 %1 位置 x %2 y %3 初始狀態 %4 標籤 %5",
    "args0": [
      { "type": "field_input", "name": "VAR", "text": "isMidiMode" },
      { "type": "field_number", "name": "X", "value": 820 },
      { "type": "field_number", "name": "Y", "value": 30 },
      { "type": "field_checkbox", "name": "STATE", "checked": true },
      { "type": "field_input", "name": "LABEL", "text": "MODE" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#FFB300"
  },
  {
    "type": "ui_set_font_size",
    "message0": "設定 UI 字體大小 %1",
    "args0": [
      { "type": "field_number", "name": "SIZE", "value": 20, "min": 8, "max": 60 }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#FFB300"
  }
]);
