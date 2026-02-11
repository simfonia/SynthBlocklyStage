/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Audio Performance Blocks: Playing Notes, Melodies, and Sequencing.
 */

Blockly.defineBlocksWithJsonArray([
  {
    "type": "sb_rhythm_v2_container",
    "message0": "音軌清單",
    "nextStatement": null,
    "enableContextMenu": false,
    "colour": "#E67E22"
  },
  {
    "type": "sb_rhythm_v2_item",
    "message0": "音軌",
    "previousStatement": null,
    "nextStatement": null,
    "enableContextMenu": false,
    "colour": "#E67E22"
  },
  {
    "type": "sb_play_drum",
    "message0": "%{BKY_SB_PLAY_DRUM_MESSAGE}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "TYPE",
        "options": [
          ["Kick", "KICK"],
          ["Snare", "SNARE"],
          ["Hi-Hat (Closed)", "CH"],
          ["Hi-Hat (Open)", "OH"],
          ["Clap", "CLAP"]
        ]
      },
      { "type": "input_value", "name": "VELOCITY", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "inputsInline": true,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_SB_PLAY_DRUM_TOOLTIP}"
  },
  {
    "type": "sb_transport_count_in",
    "message0": "%{BKY_AUDIO_COUNT_IN}",
    "args0": [
      { "type": "input_value", "name": "MEASURES", "check": "Number" },
      { "type": "input_value", "name": "BEATS", "check": "Number" },
      { "type": "input_value", "name": "BEAT_UNIT", "check": "Number" },
      { "type": "input_value", "name": "VELOCITY", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "inputsInline": true,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "在正式演奏前播放預備拍（節拍器聲音）。"
  },
  {
    "type": "sb_transport_set_bpm",
    "message0": "%{BKY_AUDIO_SET_BPM}",
    "args0": [
      { "type": "input_value", "name": "BPM", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "設定全域演奏速度（每分鐘拍數）。"
  },
  {
    "type": "sb_tone_loop",
    "message0": "%{BKY_AUDIO_TONE_LOOP}",
    "args0": [
      { "type": "field_input", "name": "INTERVAL", "text": "1m" },
      { "type": "input_statement", "name": "DO" }
    ],
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_TONE_LOOP_TOOLTIP}",
    "hat": true
  },
  {
    "type": "sb_perform",
    "message0": "%{BKY_AUDIO_PERFORM_ONCE}",
    "args0": [
      { "type": "input_statement", "name": "DO" }
    ],
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_PERFORM_ONCE_TOOLTIP}",
    "hat": true
  },
  {
    "type": "sb_define_chord",
    "message0": "%{BKY_AUDIO_DEFINE_CHORD}",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "CM7" },
      { "type": "field_input", "name": "NOTES", "text": "C4,E4,G4,B4" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "定義一個自訂和弦名稱，可在旋律中使用。%{BKY_HELP_HINT}",
    "helpUrl": "melody"
  },
  {
    "type": "sb_audio_is_playing",
    "message0": "%{BKY_AUDIO_IS_PLAYING}",
    "output": "Boolean",
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_IS_PLAYING_TOOLTIP}"
  },
  {
    "type": "sb_wait_until_finished",
    "message0": "%{BKY_AUDIO_WAIT_UNTIL_FINISHED}",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_WAIT_UNTIL_FINISHED_TOOLTIP}"
  },
  {
    "type": "sb_wait_musical",
    "message0": "%{BKY_SB_WAIT_MUSICAL}",
    "args0": [
      { "type": "input_value", "name": "VALUE", "check": "Number" },
      {
        "type": "field_dropdown",
        "name": "UNIT",
        "options": [
          ["%{BKY_SB_WAIT_UNIT_BEATS}", "BEATS"],
          ["%{BKY_SB_WAIT_UNIT_MEASURES}", "MEASURES"],
          ["%{BKY_SB_WAIT_UNIT_S}", "SECONDS"],
          ["%{BKY_SB_WAIT_UNIT_MS}", "MS"],
          ["%{BKY_SB_WAIT_UNIT_MICROS}", "MICROS"]
        ]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_SB_WAIT_MUSICAL_TOOLTIP}"
  },
  {
    "type": "sb_musical_section",
    "message0": "%{BKY_SB_MUSICAL_SECTION}",
    "args0": [
      { "type": "input_value", "name": "DURATION", "check": "Number" },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "STACK" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_SB_MUSICAL_SECTION_TOOLTIP}"
  }
]);

// Hand-coded blocks with Custom Fields
Blockly.Blocks['sb_rhythm_sequencer_v2'] = {
  init: function () {
    this.jsonInit({
      "type": "sb_rhythm_sequencer_v2",
      "message0": "%{BKY_AUDIO_RHYTHM_V2_HEADER}",
      "args0": [
        { "type": "field_input", "name": "MEASURE", "text": "1" },
        { "type": "field_input", "name": "BEATS", "text": "4" },
        { "type": "field_input", "name": "DENOMINATOR", "text": "4" },
        { "type": "field_input", "name": "RESOLUTION", "text": "4" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "%{BKY_PERFORMANCE_HUE}",
      "mutator": "rhythm_v2_mutator"
    });
  }
};

Blockly.Blocks['sb_play_note'] = {
  init: function () {
    this.appendDummyInput().appendField(Blockly.Msg['AUDIO_PLAY_NOTE']).appendField(window.SB_Utils.createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "NAME");
    this.appendValueInput("PITCH").setCheck(["Number", "String"]).appendField(Blockly.Msg['AUDIO_PLAY_NOTE_PITCH']);
    this.appendValueInput("VELOCITY").setCheck("Number").appendField(Blockly.Msg['AUDIO_PLAY_NOTE_VEL']);
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setInputsInline(true); this.setColour("#D35400");
    this.setTooltip(Blockly.Msg['AUDIO_PLAY_NOTE_TOOLTIP']);
  }
};

Blockly.Blocks['sb_stop_note'] = {
  init: function () {
    this.appendDummyInput().appendField(Blockly.Msg['AUDIO_STOP_NOTE']).appendField(window.SB_Utils.createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "NAME");
    this.appendValueInput("PITCH").setCheck(["Number", "String"]).appendField(Blockly.Msg['AUDIO_STOP_NOTE_PITCH']);
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setInputsInline(true); this.setColour("#D35400");
    this.setTooltip(Blockly.Msg['AUDIO_STOP_NOTE_TOOLTIP']);
  }
};

Blockly.Blocks['sb_select_current_instrument'] = {
  init: function () {
    this.appendDummyInput().appendField(Blockly.Msg['AUDIO_SELECT_INSTRUMENT'].replace('%1', '').trim()).appendField(window.SB_Utils.createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "NAME");
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setColour(Blockly.Msg['PERFORMANCE_HUE'] || "#D22F73");
    this.setTooltip(Blockly.Msg['AUDIO_SELECT_INSTRUMENT_TOOLTIP']);
  }
};

Blockly.Blocks['sb_trigger_sample'] = {
  init: function () {
    this.appendDummyInput().appendField(Blockly.Msg['AUDIO_TRIGGER_SAMPLE']).appendField(window.SB_Utils.createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "NAME");
    this.appendDummyInput().appendField(Blockly.Msg['AUDIO_TRIGGER_SAMPLE_NOTE']).appendField(new Blockly.FieldTextInput("C4Q"), "NOTE");
    this.appendValueInput("VELOCITY").setCheck("Number").appendField(Blockly.Msg['AUDIO_TRIGGER_SAMPLE_VEL']);
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setInputsInline(true); this.setColour(Blockly.Msg['PERFORMANCE_HUE'] || "#E67E22");
    this.setTooltip(Blockly.Msg['AUDIO_TRIGGER_SAMPLE_TOOLTIP']);
  }
};

Blockly.Blocks['sb_play_chord_by_name'] = {
  init: function () {
    this.appendDummyInput().appendField(Blockly.Msg['AUDIO_PLAY_CHORD_BY_NAME']).appendField(window.SB_Utils.createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "INST_NAME").appendField(new Blockly.FieldTextInput("CM7"), "NAME");
    this.appendValueInput("DUR").setCheck(["Number", "String"]).appendField(Blockly.Msg['AUDIO_PLAY_CHORD_BY_NAME_DUR']);
    this.appendValueInput("VELOCITY").setCheck("Number").appendField(Blockly.Msg['AUDIO_PLAY_CHORD_BY_NAME_VEL']);
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setInputsInline(true); this.setColour(Blockly.Msg['PERFORMANCE_HUE'] || "#E67E22");
    this.setTooltip(Blockly.Msg['AUDIO_PLAY_CHORD_BY_NAME_TOOLTIP']);
  }
};

Blockly.Blocks['sb_play_melody'] = {
  init: function () {
    this.appendDummyInput().appendField(Blockly.Msg['AUDIO_PLAY_MELODY']).appendField(window.SB_Utils.createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "INSTRUMENT");
    this.appendDummyInput().appendField(Blockly.Msg['AUDIO_PLAY_MELODY_SCORE']).appendField(new window.FieldMultilineInput("C4Q, E4Q, G4H"), "MELODY");
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setColour(Blockly.Msg['PERFORMANCE_HUE'] || "#E67E22");
    this.setTooltip(Blockly.Msg['AUDIO_PLAY_MELODY_TOOLTIP']);
  }
};

Blockly.Blocks['sb_rhythm_sequence'] = {
  init: function () {
    var measureLabel = (Blockly.Msg['AUDIO_RHYTHM_SEQUENCE_MEASURE'] || "第 %1 小節").split('%1');
    this.appendDummyInput().appendField(Blockly.Msg['AUDIO_RHYTHM_SEQUENCE']).appendField(window.SB_Utils.createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "SOURCE")
        .appendField(Blockly.Msg['AUDIO_RHYTHM_SEQUENCE_MODE'] || "Mode")
        .appendField(new Blockly.FieldDropdown([[Blockly.Msg['AUDIO_RHYTHM_MODE_MONO'], "FALSE"], [Blockly.Msg['AUDIO_RHYTHM_MODE_CHORD'], "TRUE"]]), "CHORD_MODE");
    this.appendValueInput("MEASURE").setCheck("Number").appendField(measureLabel[0] || "");
    this.appendDummyInput().appendField(measureLabel[1] || "").appendField(Blockly.Msg['AUDIO_RHYTHM_SEQUENCE_PATTERN']).appendField(new Blockly.FieldTextInput("x--- x--- x--- x---"), "PATTERN");
    this.appendValueInput("VELOCITY").setCheck("Number").appendField(Blockly.Msg['AUDIO_RHYTHM_SEQUENCE_VELOCITY']);
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setInputsInline(true); this.setColour(Blockly.Msg['PERFORMANCE_HUE'] || "#E67E22");
    this.setTooltip(Blockly.Msg['AUDIO_RHYTHM_SEQUENCE_TOOLTIP']);
  }
};

// Register Mutators
Blockly.Extensions.registerMutator('rhythm_v2_mutator', window.SB_Utils.RHYTHM_V2_MUTATOR, undefined, ['sb_rhythm_v2_item']);
