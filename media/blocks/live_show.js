/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Live Show and Interactive Control blocks.
 */

Blockly.defineBlocksWithJsonArray([
  {
    "type": "live_set_param",
    "message0": "%{BKY_LIVE_SET_PARAM}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "PARAM",
        "options": [
          ["%{BKY_LIVE_PARAM_WAVE_SCALE}", "waveScale"],
          ["%{BKY_LIVE_PARAM_TRAIL_ALPHA}", "trailAlpha"],
          ["%{BKY_LIVE_PARAM_FG_HUE}", "fgHue"],
          ["%{BKY_LIVE_PARAM_MASTER_GAIN}", "masterGain"],
          ["%{BKY_LIVE_PARAM_TRANSPOSE}", "pitchTranspose"],
          ["%{BKY_LIVE_PARAM_ADSR_A}", "adsrA"],
          ["%{BKY_LIVE_PARAM_ADSR_D}", "adsrD"],
          ["%{BKY_LIVE_PARAM_ADSR_S}", "adsrS"],
          ["%{BKY_LIVE_PARAM_ADSR_R}", "adsrR"]
        ]
      },
      { "type": "input_value", "name": "VALUE", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#2C3E50",
    "tooltip": "即時改變舞台視覺或音訊參數。按右鍵選擇「說明」查看數值範圍。"
  },
  {
    "type": "live_get_param",
    "message0": "%{BKY_LIVE_GET_PARAM}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "PARAM",
        "options": [
          ["%{BKY_LIVE_PARAM_WAVE_SCALE}", "waveScale"],
          ["%{BKY_LIVE_PARAM_TRAIL_ALPHA}", "trailAlpha"],
          ["%{BKY_LIVE_PARAM_FG_HUE}", "fgHue"],
          ["%{BKY_LIVE_PARAM_MASTER_GAIN}", "masterGain"],
          ["%{BKY_LIVE_PARAM_TRANSPOSE}", "pitchTranspose"]
        ]
      }
    ],
    "output": "Number",
    "colour": "#2C3E50",
    "tooltip": "讀取目前的舞台參數數值。"
  },
  {
    "type": "sb_log_to_screen",
    "message0": "%{BKY_SB_LOG_TO_SCREEN}",
    "args0": [
      { "type": "input_value", "name": "MSG" },
      {
        "type": "field_dropdown",
        "name": "TYPE",
        "options": [
          ["%{BKY_SB_LOG_TYPE_INFO}", "INFO"],
          ["%{BKY_SB_LOG_TYPE_MSG}", "MSG"],
          ["%{BKY_SB_LOG_TYPE_WARN}", "WARN"],
          ["%{BKY_SB_LOG_TYPE_ERR}", "ERR"]
        ]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#2C3E50",
    "tooltip": "%{BKY_SB_LOG_TO_SCREEN_TOOLTIP}"
  }
]);
