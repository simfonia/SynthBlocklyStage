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
    "message0": "%{BKY_VISUAL_SIZE}",
    "args0": [
      { "type": "field_number", "name": "WIDTH", "value": 800, "min": 100 },
      { "type": "field_number", "name": "HEIGHT", "value": 600, "min": 100 }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "%{BKY_VISUAL_SIZE_TOOLTIP}"
  },
  {
    "type": "visual_background",
    "message0": "%{BKY_VISUAL_BACKGROUND}",
    "args0": [
      { "type": "input_value", "name": "COLOR" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "%{BKY_VISUAL_BACKGROUND_TOOLTIP}"
  },
  {
    "type": "visual_color_picker",
    "message0": "%1",
    "args0": [
      { "type": "field_colour", "name": "COLOR", "colour": "#ff0000" }
    ],
    "output": null,
    "colour": "#3498DB",
    "tooltip": "%{BKY_VISUAL_COLOR_PICKER_TOOLTIP}"
  },
  {
    "type": "visual_constant",
    "message0": "%1",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "CONSTANT",
        "options": [
          ["%{BKY_VISUAL_CONSTANT_WIDTH}", "width"],
          ["%{BKY_VISUAL_CONSTANT_HEIGHT}", "height"],
          ["%{BKY_VISUAL_CONSTANT_MOUSE_X}", "mouseX"],
          ["%{BKY_VISUAL_CONSTANT_MOUSE_Y}", "mouseY"]
        ]
      }
    ],
    "output": "Number",
    "colour": "#3498DB",
    "tooltip": "%{BKY_VISUAL_CONSTANT_TOOLTIP}"
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
    "tooltip": "%{BKY_VISUAL_STAGE_SET_COLOR_TOOLTIP}"
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
      "helpUrl": window.docsBaseUri + "visual_stage" + (Blockly.Msg['HELP_LANG_SUFFIX'] || "_zh-hant.html")
    });
    this.setInputsInline(false);
  }
};
