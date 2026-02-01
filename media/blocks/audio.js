/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Audio blocks for Processing (Minim library).
 * Includes Standard, Harmonic, and Additive synthesis blocks.
 */

// --- MUTATORS (Moved from audio_custom.js) ---

const HARMONIC_PARTIALS_MUTATOR = {
  itemCount_: 3,
  
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    return container;
  },

  domToMutation: function(xmlElement) {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
    this.updateShape_();
  },

  decompose: function(workspace) {
    const containerBlock = workspace.newBlock('sb_harmonic_partial_container');
    containerBlock.initSvg();
    let connection = containerBlock.nextConnection;
    for (let i = 0; i < this.itemCount_; i++) {
      const itemBlock = workspace.newBlock('sb_harmonic_partial_item');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    return containerBlock;
  },

  compose: function(containerBlock) {
    let itemBlock = containerBlock.getNextBlock();
    this.itemCount_ = 0;
    while (itemBlock) {
      this.itemCount_++;
      itemBlock = itemBlock.getNextBlock();
    }
    this.updateShape_();
  },

  updateShape_: function() {
    // 1. Save existing connections
    const connections = [];
    for (let i = 1; i <= 100; i++) {
      const input = this.getInput('PARTIAL' + i);
      if (!input) break;
      connections.push(input.connection.targetConnection);
    }

    // 2. Remove old
    let i = 1;
    while (this.getInput('PARTIAL' + i)) {
      this.removeInput('PARTIAL' + i);
      i++;
    }

    // 3. Rebuild and Restore
    for (let i = 1; i <= this.itemCount_; i++) {
      const input = this.appendValueInput('PARTIAL' + i)
          .setCheck('Number')
          .appendField(Blockly.Msg['AUDIO_HARMONIC_FIELD'].replace('%1', i));
      if (connections[i-1]) {
        input.connection.connect(connections[i-1]);
      }
    }
  }
};

const ADDITIVE_SYNTH_MUTATOR = {
  itemCount_: 2,
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    return container;
  },
  domToMutation: function(xmlElement) {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
    this.updateShape_();
  },
  decompose: function(workspace) {
    const containerBlock = workspace.newBlock('sb_additive_synth_container');
    containerBlock.initSvg();
    let connection = containerBlock.nextConnection;
    for (let i = 0; i < this.itemCount_; i++) {
      const itemBlock = workspace.newBlock('sb_additive_synth_item');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    return containerBlock;
  },
  compose: function(containerBlock) {
    let itemBlock = containerBlock.getNextBlock();
    this.itemCount_ = 0;
    while (itemBlock) {
      this.itemCount_++;
      itemBlock = itemBlock.getNextBlock();
    }
    this.updateShape_();
  },
  updateShape_: function() {
    // 1. Save field data
    const fieldValues = [];
    for (let i = 1; i <= 100; i++) {
      if (!this.getField('WAVE' + i)) break;
      fieldValues.push({
        wave: this.getFieldValue('WAVE' + i),
        ratio: this.getFieldValue('RATIO' + i),
        amp: this.getFieldValue('AMP' + i)
      });
    }

    // 2. Remove old
    let i = 1;
    while (this.getInput('COMP' + i)) { this.removeInput('COMP' + i); i++; }

    // 3. Rebuild and Restore
    for (let i = 1; i <= this.itemCount_; i++) {
      this.appendDummyInput('COMP' + i)
          .appendField("波形")
          .appendField(new Blockly.FieldDropdown([["Triangle","TRIANGLE"],["Sine","SINE"],["Square","SQUARE"],["Saw","SAW"]]), "WAVE" + i)
          .appendField("倍率")
          .appendField(new Blockly.FieldTextInput("1.0"), "RATIO" + i)
          .appendField("振幅")
          .appendField(new Blockly.FieldTextInput("0.5"), "AMP" + i);
      
      if (fieldValues[i-1]) {
        this.setFieldValue(fieldValues[i-1].wave, 'WAVE' + i);
        this.setFieldValue(fieldValues[i-1].ratio, 'RATIO' + i);
        this.setFieldValue(fieldValues[i-1].amp, 'AMP' + i);
      }
    }
  }
};

// --- DYNAMIC DROPDOWN FOR INSTRUMENTS ---
const getInstrumentDropdown = function() {
  const instrumentBlocks = Blockly.getMainWorkspace().getBlocksByType('sb_instrument_container');
  const options = [];
  for (let block of instrumentBlocks) {
    const name = block.getFieldValue('NAME');
    if (name) {
      options.push([name, name]);
    }
  }
  if (options.length === 0) {
    options.push(['(無樂器)', 'none']);
  }
  return options;
};

// --- REGISTER BLOCKS ---

Blockly.defineBlocksWithJsonArray([
  // Mutator Helper Blocks
  {
    "type": "sb_harmonic_partial_container",
    "message0": "諧波清單",
    "nextStatement": null,
    "enableContextMenu": false,
    "colour": "#E74C3C"
  },
  {
    "type": "sb_harmonic_partial_item",
    "message0": "泛音層級",
    "previousStatement": null,
    "nextStatement": null,
    "enableContextMenu": false,
    "colour": "#E74C3C"
  },
  {
    "type": "sb_additive_synth_container",
    "message0": "振盪器清單",
    "nextStatement": null,
    "enableContextMenu": false,
    "colour": "#E74C3C"
  },
  {
    "type": "sb_additive_synth_item",
    "message0": "振盪器組件",
    "previousStatement": null,
    "nextStatement": null,
    "enableContextMenu": false,
    "colour": "#E74C3C"
  },

  // Standard Audio Blocks
  {
    "type": "sb_minim_init",
    "message0": "啟動 Minim 音訊引擎",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SOUND_SOURCES_HUE}",
    "tooltip": "初始化 Minim 音訊引擎（應放於 setup 最上方）。%{BKY_HELP_HINT}",
    "helpUrl": window.docsBaseUri + "sound_sources_zh-hant.html"
  },
  {
    "type": "sb_load_sample",
    "message0": "載入音訊樣本 名稱 %1 檔案路徑 %2",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "kick" },
      { "type": "field_input", "name": "PATH", "text": "kick.wav" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SOUND_SOURCES_HUE}",
    "tooltip": "從 data 資料夾載入音訊檔案。"
  },
  {
    "type": "sb_trigger_sample",
    "message0": "觸發音訊播放 %1 力度 %2",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "kick" },
      { "type": "input_value", "name": "VELOCITY", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SOUND_SOURCES_HUE}",
    "tooltip": "立即播放指定的音訊樣本一次。"
  },
  {
    "type": "sb_select_current_instrument",
    "message0": "%{BKY_AUDIO_SELECT_INSTRUMENT}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "NAME",
        "options": getInstrumentDropdown
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_INSTRUMENT_CONTROL_HUE}",
    "tooltip": "%{BKY_AUDIO_SELECT_INSTRUMENT_TOOLTIP}"
  },
  {
    "type": "sb_play_note",
    "message0": "%{BKY_AUDIO_PLAY_NOTE}",
    "args0": [
      { "type": "input_value", "name": "PITCH", "check": "Number" },
      { "type": "input_value", "name": "VELOCITY", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "開始播放一個持續音。"
  },
  {
    "type": "sb_stop_note",
    "message0": "%{BKY_AUDIO_STOP_NOTE}",
    "args0": [
      { "type": "input_value", "name": "PITCH", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "觸發 ADSR 的 Release 階段並停止發聲。"
  },
  {
    "type": "sb_play_melody",
    "message0": "%{BKY_AUDIO_PLAY_MELODY}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "INSTRUMENT",
        "options": getInstrumentDropdown
      },
      { "type": "input_dummy" },
      {
        "type": "field_multilinetext",
        "name": "MELODY",
        "text": "C4Q, E4Q, G4H\nF4Q, A4Q, C5H"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_PLAY_MELODY_TOOLTIP}%{BKY_HELP_HINT}",
    "helpUrl": window.docsBaseUri + "melody_zh-hant.html"
  },
  {
    "type": "sb_rhythm_sequence",
    "message0": "%{BKY_AUDIO_RHYTHM_SEQUENCE}",
    "args0": [
      { "type": "field_input", "name": "SOURCE", "text": "KICK" },
      { "type": "field_input", "name": "PATTERN", "text": "x---x---x---x---" },
      { "type": "input_value", "name": "MEASURE", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "在指定小節演奏 16 格節奏。x: 擊打, -: 延續, .: 休止。"
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
          "helpUrl": window.docsBaseUri + "melody_zh-hant.html"
        },
        {
          "type": "sb_play_chord_by_name",
          "message0": "%{BKY_AUDIO_PLAY_CHORD_BY_NAME}",
          "args0": [
            { "type": "field_input", "name": "NAME", "text": "CM7" },
            { "type": "field_input", "name": "DUR", "text": "4n" },
            { "type": "input_value", "name": "VELOCITY", "check": "Number" }
          ],
          "previousStatement": null,
          "nextStatement": null,
          "colour": "%{BKY_PERFORMANCE_HUE}",
          "tooltip": "根據名稱演奏已定義的和弦。%{BKY_HELP_HINT}",
          "helpUrl": window.docsBaseUri + "melody_zh-hant.html"
        },    // Custom Synths (Container Style - No Name)
    {
      "type": "sb_create_harmonic_synth",
      "message0": "%{BKY_AUDIO_CREATE_HARMONIC_SYNTH}",
      "previousStatement": null,
      "nextStatement": null,
          "colour": "%{BKY_SOUND_SOURCES_HUE}",
          "tooltip": "%{BKY_AUDIO_CREATE_HARMONIC_SYNTH_TOOLTIP}%{BKY_HELP_HINT}",
          "mutator": "harmonic_mutator",
          "helpUrl": window.docsBaseUri + "custom_synth_zh-hant.html"
        },
        {
          "type": "sb_create_additive_synth",
          "message0": "%{BKY_AUDIO_CREATE_ADDITIVE_SYNTH}",
          "previousStatement": null,
          "nextStatement": null,
          "colour": "%{BKY_SOUND_SOURCES_HUE}",
          "tooltip": "%{BKY_AUDIO_CREATE_ADDITIVE_SYNTH_TOOLTIP}%{BKY_HELP_HINT}",
          "mutator": "additive_mutator",
          "helpUrl": window.docsBaseUri + "custom_synth_zh-hant.html"
        },
  {
    "type": "sb_audio_is_playing",
    "message0": "%{BKY_AUDIO_IS_PLAYING}",
    "output": "Boolean",
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_IS_PLAYING_TOOLTIP}"
  }
]);

// Register Mutators
Blockly.Extensions.registerMutator('harmonic_mutator', HARMONIC_PARTIALS_MUTATOR, undefined, ['sb_harmonic_partial_item']);
Blockly.Extensions.registerMutator('additive_mutator', ADDITIVE_SYNTH_MUTATOR, undefined, ['sb_additive_synth_item']);


// --- INSTRUMENT CONTAINER SYSTEM ---

Blockly.Blocks['sb_instrument_container'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['SB_INSTRUMENT_CONTAINER_MESSAGE'].replace('%1', '').replace('%2', '').trim())
        .appendField(new Blockly.FieldTextInput("MySynth"), "NAME");
    this.appendStatementInput("STACK")
        .setCheck(null);
    this.setColour(Blockly.Msg['SOUND_SOURCES_HUE'] || "#E74C3C"); // Audio color
    this.setTooltip(Blockly.Msg['SB_INSTRUMENT_CONTAINER_TOOLTIP']);
    this.setHelpUrl("");
  }
};

Blockly.Blocks['sb_set_adsr'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['SB_SET_ADSR_MESSAGE']);
    this.appendValueInput("A")
        .setCheck("Number")
        .appendField("A (Attack)");
    this.appendValueInput("D")
        .setCheck("Number")
        .appendField("D (Decay)");
    this.appendValueInput("S")
        .setCheck("Number")
        .appendField("S (Sustain)");
    this.appendValueInput("R")
        .setCheck("Number")
        .appendField("R (Release)");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(Blockly.Msg['SOUND_SOURCES_HUE'] || "#E74C3C");
    this.setTooltip(Blockly.Msg['SB_SET_ADSR_TOOLTIP']);
  }
};

Blockly.Blocks['sb_set_wave'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['SB_SET_WAVE_MESSAGE'])
        .appendField(new Blockly.FieldDropdown([
          ["Sine", "SINE"], 
          ["Square", "SQUARE"], 
          ["Triangle", "TRIANGLE"], 
          ["Sawtooth", "SAW"]
        ]), "TYPE");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(Blockly.Msg['SOUND_SOURCES_HUE'] || "#E74C3C");
    this.setTooltip(Blockly.Msg['SB_SET_WAVE_TOOLTIP']);
  }
};