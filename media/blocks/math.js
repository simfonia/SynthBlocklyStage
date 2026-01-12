/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Math blocks for Processing.
 */

// Delete existing definition to suppress overwrite warning
delete Blockly.Blocks['math_number_property'];

Blockly.defineBlocksWithJsonArray([
  {
    "type": "math_number_property",
    "message0": "%1 %2",
    "args0": [
      { "type": "input_value", "name": "NUMBER_TO_CHECK", "check": "Number" },
      {
        "type": "field_dropdown",
        "name": "PROPERTY",
        "options": [
          ["%{BKY_MATH_IS_EVEN}", "EVEN"],
          ["%{BKY_MATH_IS_ODD}", "ODD"],
          ["%{BKY_MATH_IS_WHOLE}", "WHOLE"],
          ["%{BKY_MATH_IS_POSITIVE}", "POSITIVE"],
          ["%{BKY_MATH_IS_NEGATIVE}", "NEGATIVE"],
          ["%{BKY_MATH_IS_DIVISIBLE_BY}", "DIVISIBLE_BY"]
        ]
      }
    ],
    "inputsInline": true,
    "output": "Boolean",
    "style": "math_blocks",
    "tooltip": "%{BKY_MATH_IS_TOOLTIP}",
    "mutator": "math_is_divisibleby_mutator"
  },
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
