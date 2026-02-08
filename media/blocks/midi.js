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
    "message0": "%{BKY_MIDI_INIT}",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "MIDI_1" },
      { "type": "field_input", "name": "INPUT", "text": "0" },
      { "type": "field_input", "name": "OUTPUT", "text": "0" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#5B67E7",
    "tooltip": "%{BKY_MIDI_INIT_TOOLTIP}",
    "helpUrl": "launchpad"
  },
  {
    "type": "midi_on_note",
    "message0": "%{BKY_MIDI_ON_NOTE}",
    "args0": [
      { "type": "field_input", "name": "BUS_NAME", "text": "MIDI_1" },
      { "type": "input_dummy" },
      { "type": "field_variable", "name": "CHANNEL", "variable": "channel" },
      { "type": "field_variable", "name": "PITCH", "variable": "pitch" },
      { "type": "field_variable", "name": "VELOCITY", "variable": "velocity" },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "DO" }
    ],
    "colour": "#5B67E7",
    "tooltip": "%{BKY_MIDI_ON_NOTE_TOOLTIP}",
    "helpUrl": "launchpad",
    "hat": true
  },
  {
    "type": "midi_off_note",
    "message0": "%{BKY_MIDI_OFF_NOTE}",
    "args0": [
      { "type": "field_input", "name": "BUS_NAME", "text": "MIDI_1" },
      { "type": "input_dummy" },
      { "type": "field_variable", "name": "CHANNEL", "variable": "channel" },
      { "type": "field_variable", "name": "PITCH", "variable": "pitch" },
      { "type": "field_variable", "name": "VELOCITY", "variable": "velocity" },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "DO" }
    ],
    "colour": "#5B67E7",
    "tooltip": "%{BKY_MIDI_OFF_NOTE_TOOLTIP}",
    "helpUrl": "launchpad",
    "hat": true
  },
  {
    "type": "midi_on_controller_change",
    "message0": "%{BKY_MIDI_ON_CONTROLLER_CHANGE}",
    "args0": [
      { "type": "field_input", "name": "BUS_NAME", "text": "MIDI_1" },
      { "type": "input_dummy" },
      { "type": "field_variable", "name": "CHANNEL", "variable": "channel" },
      { "type": "field_variable", "name": "NUMBER", "variable": "number" },
      { "type": "field_variable", "name": "VALUE", "variable": "value" },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "DO" }
    ],
    "colour": "#5B67E7",
    "tooltip": "%{BKY_MIDI_ON_CONTROLLER_CHANGE_TOOLTIP}",
    "helpUrl": "launchpad",
    "hat": true
  },
  {
    "type": "midi_send_note",
    "message0": "向 %1 %2 傳送 MIDI 音符 %3 頻道 %4 鍵號 %5 力度 %6",
    "args0": [
      { "type": "field_input", "name": "BUS_NAME", "text": "MIDI_1" },
      { "type": "input_dummy" },
      { "type": "field_dropdown", "name": "TYPE", "options": [
        ["%{BKY_MIDI_TYPE_ON}", "ON"],
        ["%{BKY_MIDI_TYPE_OFF}", "OFF"]
      ]},
      { "type": "input_value", "name": "CHANNEL", "check": "Number" },
      { "type": "input_value", "name": "PITCH", "check": "Number" },
      { "type": "input_value", "name": "VELOCITY", "check": "Number" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#5B67E7",
    "tooltip": "%{BKY_MIDI_SEND_NOTE_TOOLTIP}",
    "helpUrl": "launchpad"
  },
  {
    "type": "midi_send_cc",
    "message0": "向 %1 傳送 MIDI CC 頻道 %2 號碼 %3 數值 %4",
    "args0": [
      { "type": "field_input", "name": "BUS_NAME", "text": "MIDI_1" },
      { "type": "input_value", "name": "CHANNEL", "check": "Number" },
      { "type": "input_value", "name": "NUMBER", "check": "Number" },
      { "type": "input_value", "name": "VALUE", "check": "Number" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#5B67E7",
    "tooltip": "%{BKY_MIDI_SEND_CC_TOOLTIP}",
    "helpUrl": "launchpad"
  },
  {
    "type": "midi_lp_xy_to_note",
    "message0": "%{BKY_MIDI_LP_XY_TO_NOTE}",
    "args0": [
      { "type": "input_value", "name": "X", "check": "Number" },
      { "type": "input_value", "name": "Y", "check": "Number" }
    ],
    "output": "Number",
    "inputsInline": true,
    "colour": "#5B67E7",
    "tooltip": "%{BKY_MIDI_LP_XY_TO_NOTE_TOOLTIP}",
    "helpUrl": "launchpad"
  }
]);