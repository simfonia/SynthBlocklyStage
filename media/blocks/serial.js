/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Serial communication blocks for Processing.
 */

Blockly.defineBlocksWithJsonArray([
  {
    "type": "serial_init",
    "message0": "%{BKY_SERIAL_INIT}",
    "args0": [
      { "type": "field_number", "name": "INDEX", "value": 0, "min": 0 },
      {
        "type": "field_dropdown",
        "name": "BAUD",
        "options": [
          ["9600", "9600"], ["19200", "19200"], ["38400", "38400"], 
          ["57600", "57600"], ["115200", "115200"]
        ]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#2c3e50",
    "tooltip": "啟動與 Arduino 的通訊。索引 0 通常是第一個接上的裝置。"
  },
  {
    "type": "serial_available",
    "message0": "%{BKY_SERIAL_AVAILABLE}",
    "output": "Boolean",
    "colour": "#2c3e50",
    "tooltip": "檢查序列埠緩衝區是否有新資料。"
  },
  {
    "type": "serial_read_string",
    "message0": "%{BKY_SERIAL_READ_STRING}",
    "output": "String",
    "colour": "#2c3e50",
    "tooltip": "從序列埠讀取文字直到遇到換行符號。"
  },
  {
    "type": "sb_serial_write",
    "message0": "%{BKY_SERIAL_WRITE}",
    "args0": [
      { "type": "input_value", "name": "CONTENT" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#2c3e50",
    "tooltip": "寫入資料到序列埠 (Send)"
  },
  {
    "type": "sb_serial_data_received",
    "message0": "%{BKY_SERIAL_DATA_RECEIVED}",
    "args0": [
      { "type": "input_dummy" },
      { "type": "field_variable", "name": "DATA", "variable": "serial_data" },
      { "type": "input_statement", "name": "DO" }
    ],
    "colour": "#2c3e50",
    "tooltip": "當序列埠收到以換行符號結尾的資料時，自動執行內部的程式碼。"
  },
  {
    "type": "serial_check_mask",
    "message0": "%{BKY_SERIAL_CHECK_MASK}",
    "args0": [
      { "type": "input_value", "name": "MASK", "check": "Number" },
      { "type": "input_value", "name": "KEY", "check": "Number" }
    ],
    "output": "Boolean",
    "inputsInline": true,
    "colour": "#2c3e50",
    "tooltip": "用於判斷位元遮罩中特定的按鍵是否被按下。"
  }
]);
