/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Audio blocks for Processing (Minim library).
 */

Blockly.defineBlocksWithJsonArray([
  {
    "type": "audio_minim_init",
    "message0": "啟動 Minim 音訊引擎",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#E74C3C",
    "tooltip": "初始化 Minim 函式庫。必須在使用任何音訊功能前執行（通常放在 setup）。"
  },
  {
    "type": "audio_load_sample",
    "message0": "載入音訊樣本 名稱 %1 檔案路徑 %2",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "kick" },
      { "type": "field_input", "name": "PATH", "text": "kick.wav" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#E74C3C",
    "tooltip": "從 data 資料夾載入音訊檔案。"
  },
  {
    "type": "audio_trigger_sample",
    "message0": "觸發音訊播放 %1 力度 %2",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "kick" },
      { "type": "input_value", "name": "VELOCITY", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#E74C3C",
    "tooltip": "立即播放指定的音訊樣本一次。"
  },
  {
    "type": "audio_sample_property",
    "message0": "樣本 %1 的 %2",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "kick" },
      {
        "type": "field_dropdown",
        "name": "PROP",
        "options": [
          ["緩衝區大小 (bufferSize)", "bufferSize()"],
          ["混合聲道數據 [i] (mix.get)", "mix.get"]
        ]
      }
    ],
    "output": "Number",
    "colour": "#E74C3C"
  },
  {
    "type": "audio_sample_mix_get",
    "message0": "樣本 %1 的聲道數據 索引 %2",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "kick" },
      { "type": "input_value", "name": "INDEX", "check": "Number" }
    ],
    "output": "Number",
    "colour": "#E74C3C"
  },
  {
    "type": "audio_set_current_sample",
    "message0": "設定目前繪圖樣本為 %1",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "kick" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#E74C3C",
    "tooltip": "將指定的樣本設為全域變數 currentSample，供繪圖使用。"
  },
  {
    "type": "audio_current_sample_property",
    "message0": "目前繪圖樣本的 %1",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "PROP",
        "options": [
          ["緩衝區大小 (bufferSize)", "bufferSize()"],
          ["混合聲道數據 [i] (mix.get)", "mix.get"]
        ]
      }
    ],
    "output": "Number",
    "colour": "#E74C3C"
  },
  {
    "type": "audio_current_sample_mix_get",
    "message0": "目前繪圖樣本的聲道數據 索引 %1",
    "args0": [
      { "type": "input_value", "name": "INDEX", "check": "Number" }
    ],
    "output": "Number",
    "colour": "#E74C3C"
  }
]);
