/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * UI blocks for Processing (ControlP5 library).
 */

Blockly.Blocks['ui_key_event'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['UI_KEY_EVENT'].split('%1')[0])
        .appendField(new Blockly.FieldDropdown(() => window.getAvailableKeys(this)), "KEY")
        .appendField(Blockly.Msg['UI_KEY_EVENT'].split('%1')[1].split('%2')[0])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['UI_KEY_PRESSED'], "PRESSED"],
          [Blockly.Msg['UI_KEY_RELEASED'], "RELEASED"]
        ]), "MODE")
        .appendField(Blockly.Msg['UI_KEY_EVENT'].split('%2')[1] || "")
        .appendField(new Blockly.FieldLabel(""), "CONFLICT_LABEL");
    this.appendStatementInput("DO")
        .setCheck(null)
        .appendField(Blockly.Msg['BKY_CONTROLS_DO']);
    this.setColour("#2c3e50");
    this.setTooltip(Blockly.Msg['UI_KEY_EVENT_TOOLTIP']);
  }
};

Blockly.defineBlocksWithJsonArray([
  {
    "type": "ui_init",
    "message0": "%{BKY_UI_INIT}",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#FFB300",
    "tooltip": "%{BKY_UI_INIT_TOOLTIP}"
  },
  {
    "type": "ui_add_slider",
    "message0": "%{BKY_UI_ADD_SLIDER}",
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
    "message0": "%{BKY_UI_ADD_TOGGLE}",
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
    "message0": "%{BKY_UI_SET_FONT_SIZE}",
    "args0": [
      { "type": "field_number", "name": "SIZE", "value": 20, "min": 8, "max": 60 }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#FFB300"
  }
]);
