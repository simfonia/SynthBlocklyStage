/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * MIDI blocks for Processing (MidiBus library).
 */

Blockly.defineBlocksWithJsonArray([
  {
    "type": "midi_init",
    "message0": "啟動 MIDI 監聽 裝置名稱 %1",
    "args0": [
      { "type": "field_input", "name": "DEVICE", "text": "0" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#5B67E7",
    "tooltip": "初始化 MidiBus 函式庫。裝置名稱通常設為 0。"
  },
  {
    "type": "midi_on_note",
    "message0": "當收到 MIDI 音符 ON %1 %2 頻道 %3 鍵號 %4 力度 %5 %6 %7",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_dummy" },
      { "type": "field_variable", "name": "CHANNEL", "variable": "channel" },
      { "type": "field_variable", "name": "PITCH", "variable": "pitch" },
      { "type": "field_variable", "name": "VELOCITY", "variable": "velocity" },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "DO" }
    ],
    "colour": "#5B67E7",
    "tooltip": "當外部 MIDI 裝置按下琴鍵時執行的動作。",
    "hat": true
  }
]);
