/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Math blocks for Processing.
 */

Blockly.defineBlocksWithJsonArray([
  {
    "type": "math_map",
    "message0": "重新對應數值 %1 從 [ %2, %3 ] 到 [ %4, %5 ]",
    "args0": [
      { "type": "input_value", "name": "VALUE" },
      { "type": "input_value", "name": "FROM_LOW" },
      { "type": "input_value", "name": "FROM_HIGH" },
      { "type": "input_value", "name": "TO_LOW" },
      { "type": "input_value", "name": "TO_HIGH" }
    ],
    "output": "Number",
    "colour": "#5C68A6",
    "tooltip": "將數值從一個範圍線性映射到另一個範圍。"
  }
]);
