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

  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    return container;
  },

  domToMutation: function (xmlElement) {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
    this.updateShape_();
  },

  decompose: function (workspace) {
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

  compose: function (containerBlock) {
    let itemBlock = containerBlock.getNextBlock();
    this.itemCount_ = 0;
    while (itemBlock) {
      this.itemCount_++;
      itemBlock = itemBlock.getNextBlock();
    }
    this.updateShape_();
  },

  updateShape_: function () {
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
      if (connections[i - 1]) {
        input.connection.connect(connections[i - 1]);
      }
    }
  }
};

const ADDITIVE_SYNTH_MUTATOR = {
  itemCount_: 2,
  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    return container;
  },
  domToMutation: function (xmlElement) {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
    this.updateShape_();
  },
  decompose: function (workspace) {
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
  compose: function (containerBlock) {
    let itemBlock = containerBlock.getNextBlock();
    this.itemCount_ = 0;
    while (itemBlock) {
      this.itemCount_++;
      itemBlock = itemBlock.getNextBlock();
    }
    this.updateShape_();
  },
  updateShape_: function () {
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
        .appendField(new Blockly.FieldDropdown([["Triangle", "TRIANGLE"], ["Sine", "SINE"], ["Square", "SQUARE"], ["Saw", "SAW"]]), "WAVE" + i)
        .appendField("倍率")
        .appendField(new Blockly.FieldTextInput("1.0"), "RATIO" + i)
        .appendField("振幅")
        .appendField(new Blockly.FieldTextInput("0.5"), "AMP" + i);

      if (fieldValues[i - 1]) {
        this.setFieldValue(fieldValues[i - 1].wave, 'WAVE' + i);
        this.setFieldValue(fieldValues[i - 1].ratio, 'RATIO' + i);
        this.setFieldValue(fieldValues[i - 1].amp, 'AMP' + i);
      }
    }
  }
};

const DRUM_SAMPLER_MUTATOR = {
  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('type', this.getFieldValue('PATH') || 'Kick');
    return container;
  },
  domToMutation: function (xmlElement) {
    this.updateShape_(xmlElement.getAttribute('type') || 'Kick');
  },
  updateShape_: function (type) {
    const inputExists = this.getInput('CUSTOM_PATH');
    if (type === 'CUSTOM') {
      if (!inputExists) {
        this.appendDummyInput('CUSTOM_PATH')
          .appendField(Blockly.Msg['AUDIO_SAMPLER_PATH_FIELD'] || "路徑")
          .appendField(new Blockly.FieldTextInput("drum/kick.wav"), "CUSTOM_PATH_VALUE");
      }
    } else {
      if (inputExists) {
        this.removeInput('CUSTOM_PATH');
      }
    }
  }
};

const MELODIC_SAMPLER_MUTATOR = {
  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('type', this.getFieldValue('TYPE') || 'PIANO');
    return container;
  },
  domToMutation: function (xmlElement) {
    this.updateShape_(xmlElement.getAttribute('type') || 'PIANO');
  },
  updateShape_: function (type) {
    const inputExists = this.getInput('CUSTOM_PATH');
    if (type === 'CUSTOM') {
      if (!inputExists) {
        this.appendDummyInput('CUSTOM_PATH')
          .appendField(Blockly.Msg['AUDIO_SAMPLER_PATH_FIELD'] || "路徑")
          .appendField(new Blockly.FieldTextInput("piano"), "CUSTOM_PATH_VALUE");
      }
    } else {
      if (inputExists) {
        this.removeInput('CUSTOM_PATH');
      }
    }
  }
};

// Helper mixin to trigger updateShape on field change
const SAMPLER_HELPER = {
  onchange: function (e) {
    if (!this.workspace || this.isInFlyout) return;
    // Check if the change is on this block and is the source field
    if (e.type === Blockly.Events.BLOCK_CHANGE && e.blockId === this.id && (e.name === 'PATH' || e.name === 'TYPE')) {
      this.updateShape_(e.newValue);
    }
  }
};

const RHYTHM_V2_MUTATOR = {
  itemCount_: 1,
  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    return container;
  },
  domToMutation: function (xmlElement) {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
    this.updateShape_();
  },
  decompose: function (workspace) {
    const containerBlock = workspace.newBlock('sb_rhythm_v2_container');
    containerBlock.initSvg();
    let connection = containerBlock.nextConnection;
    for (let i = 0; i < this.itemCount_; i++) {
      const itemBlock = workspace.newBlock('sb_rhythm_v2_item');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    return containerBlock;
  },
  compose: function (containerBlock) {
    let itemBlock = containerBlock.getNextBlock();
    this.itemCount_ = 0;
    while (itemBlock) {
      this.itemCount_++;
      itemBlock = itemBlock.getNextBlock();
    }
    this.updateShape_();
  },
  updateShape_: function () {
    const trackData = [];
    for (let i = 0; i < 50; i++) {
      if (!this.getField('INST' + i)) break;
      trackData.push({
        inst: this.getFieldValue('INST' + i),
        vel: this.getFieldValue('VEL' + i),
        mode: this.getFieldValue('MODE' + i),
        pattern: this.getFieldValue('PATTERN' + i)
      });
    }
    let i = 0;
    while (this.getInput('TRACK' + i)) { this.removeInput('TRACK' + i); i++; }
    for (let i = 0; i < this.itemCount_; i++) {
      const input = this.appendDummyInput('TRACK' + i)
        .appendField("樂器")
        .appendField(createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), 'INST' + i)
        .appendField("力度")
        .appendField(new Blockly.FieldTextInput("100"), 'VEL' + i)
        .appendField("模式")
        .appendField(new Blockly.FieldDropdown([["單音", "FALSE"], ["和弦", "TRUE"]]), 'MODE' + i)
        .appendField("節奏")
        .appendField(new Blockly.FieldTextInput("x--- x--- x--- x---"), 'PATTERN' + i);
      if (trackData[i]) {
        this.setFieldValue(trackData[i].inst, 'INST' + i);
        this.setFieldValue(trackData[i].vel, 'VEL' + i);
        this.setFieldValue(trackData[i].mode, 'MODE' + i);
        this.setFieldValue(trackData[i].pattern, 'PATTERN' + i);
      }
    }
  }
};

const SETUP_EFFECT_MUTATOR = {
  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('effect_type', this.getFieldValue('EFFECT_TYPE') || 'filter');
    if (this.getFieldValue('EFFECT_TYPE') === 'filter') {
      container.setAttribute('filter_type_value', this.getFieldValue('FILTER_TYPE_VALUE') || 'lowpass');
      container.setAttribute('filter_rolloff_value', this.getFieldValue('FILTER_ROLLOFF_VALUE') || '-12');
    }
    return container;
  },
  domToMutation: function (xmlElement) {
    this.updateShape_(xmlElement.getAttribute('effect_type') || 'filter', xmlElement);
  },
  updateShape_: function (type, xmlElement) {
    const params = [
      'FILTER_TYPE', 'FILTER_FREQ', 'FILTER_Q', 'FILTER_ROLLOFF',
      'DELAY_TIME', 'FEEDBACK',
      'BITDEPTH',
      'THRESHOLD', 'RATIO', 'ATTACK', 'RELEASE', 'MAKEUP',
      'WET', 'DISTORTION_AMOUNT', 'DECAY', 'PREDELAY',
      'RATE', 'DEPTH', 'MOD_TYPE', 'SWEEP_INPUT', 'SWEEP_DEPTH_INPUT', 'JITTER_INPUT'
    ];
    params.forEach(p => { if (this.getInput(p)) this.removeInput(p); });

    // 輔助函式：建立影子積木
    const addShadow = (inputName, num) => {
      const input = this.getInput(inputName);
      if (input && input.connection && !xmlElement) {
        const shadow = Blockly.utils.xml.textToDom(
          '<shadow type="math_number"><field name="NUM">' + num + '</field></shadow>'
        );
        input.connection.setShadowDom(shadow);
      }
    };

    if (type === 'filter') {
      this.appendDummyInput('FILTER_TYPE').setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_FILTER_INTERNAL_TYPE_FIELD'])
        .appendField(new Blockly.FieldDropdown([["lowpass", "lowpass"], ["highpass", "highpass"], ["bandpass", "bandpass"]]), "FILTER_TYPE_VALUE");
      this.appendValueInput('FILTER_FREQ').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_FILTER_FREQ_FIELD']);
      this.appendValueInput('FILTER_Q').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_FILTER_Q_FIELD']);
      this.appendDummyInput('FILTER_ROLLOFF').setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_ROLLOFF_FIELD'])
        .appendField(new Blockly.FieldDropdown([["-12dB", "-12"], ["-24dB", "-24"], ["-48dB", "-48"]]), "FILTER_ROLLOFF_VALUE");

      addShadow('FILTER_FREQ', 1000);
      addShadow('FILTER_Q', 0.5);

      if (xmlElement) {
        this.setFieldValue(xmlElement.getAttribute('filter_type_value') || 'lowpass', 'FILTER_TYPE_VALUE');
        this.setFieldValue(xmlElement.getAttribute('filter_rolloff_value') || '-12', 'FILTER_ROLLOFF_VALUE');
      }
    } else if (type === 'delay') {
      this.appendValueInput('DELAY_TIME').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_DELAY_TIME_FIELD']);
      this.appendValueInput('FEEDBACK').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_FEEDBACK_FIELD']);

      addShadow('DELAY_TIME', 0.5);
      addShadow('FEEDBACK', 0.5);
    } else if (type === 'bitcrush') {
      this.appendValueInput('BITDEPTH').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_BITDEPTH_FIELD']);

      addShadow('BITDEPTH', 8);
    } else if (type === 'waveshaper') {
      this.appendValueInput('DISTORTION_AMOUNT').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_DISTORTION_AMOUNT_FIELD']);

      addShadow('DISTORTION_AMOUNT', 2);
    } else if (type === 'reverb') {
      this.appendValueInput('ROOMSIZE').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_ROOMSIZE_FIELD']);
      this.appendValueInput('DAMPING').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_DAMPING_FIELD']);
      this.appendValueInput('WET').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_WET_FIELD']);

      addShadow('ROOMSIZE', 0.5);
      addShadow('DAMPING', 0.5);
      addShadow('WET', 0.3);
    } else if (type === 'flanger') {
      this.appendValueInput('DELAY_TIME').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_DELAY_TIME_FIELD']);
      this.appendValueInput('RATE').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_RATE_FIELD']);
      this.appendValueInput('DEPTH').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_DEPTH_FIELD']);
      this.appendValueInput('FEEDBACK').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_FEEDBACK_FIELD']);

      addShadow('DELAY_TIME', 1);
      addShadow('RATE', 0.5);
      addShadow('DEPTH', 1);
      addShadow('FEEDBACK', 0.5);
    } else if (type === 'compressor') {
      this.appendValueInput('THRESHOLD').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_THRESHOLD_FIELD']);
      this.appendValueInput('RATIO').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_RATIO_FIELD']);
      this.appendValueInput('ATTACK').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_ATTACK_FIELD']);
      this.appendValueInput('RELEASE').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_RELEASE_FIELD']);
      this.appendValueInput('MAKEUP').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_MAKEUP_FIELD']);

      addShadow('THRESHOLD', -20);
      addShadow('RATIO', 4);
      addShadow('ATTACK', 0.01);
      addShadow('RELEASE', 0.25);
      addShadow('MAKEUP', 0);
    } else if (type === 'limiter') {
      this.appendValueInput('THRESHOLD').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_THRESHOLD_FIELD']);
      this.appendValueInput('ATTACK').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_ATTACK_FIELD']);
      this.appendValueInput('RELEASE').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_RELEASE_FIELD']);

      addShadow('THRESHOLD', -3);
      addShadow('ATTACK', 0.001);
      addShadow('RELEASE', 0.1);
    } else if (type === 'autofilter') {
      this.appendValueInput('RATE').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_RATE_FIELD']);
      this.appendValueInput('DEPTH').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_DEPTH_FIELD']);
      this.appendValueInput('FILTER_Q').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_FILTER_Q_FIELD']);
      addShadow('RATE', 0.5); addShadow('DEPTH', 20); addShadow('FILTER_Q', 0.4);
    } else if (type === 'pitchmod') {
      this.appendDummyInput('MOD_TYPE').setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_MOD_TYPE_FIELD'])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['SB_EFFECT_MOD_TYPE_JITTER'] || "Jitter", "NOISE"],
          [Blockly.Msg['SB_EFFECT_MOD_TYPE_VIBRATO'] || "Vibrato", "SINE"]
        ]), "TYPE");
      this.appendValueInput('RATE').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_RATE_FIELD']);
      this.appendValueInput('DEPTH').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg['SB_EFFECT_DEPTH_FIELD']);
      addShadow('RATE', 5); addShadow('DEPTH', 10);
    }
  }
};

const EFFECT_HELPER = {
  onchange: function (e) {
    if (!this.workspace || this.isInFlyout) return;
    if (e.type === Blockly.Events.BLOCK_CHANGE && e.blockId === this.id && e.name === 'EFFECT_TYPE') {
      this.updateShape_(e.newValue);
    }
  }
};

// --- DYNAMIC DROPDOWN FOR CHORDS ---
const getChordDropdown = function () {
  const chordBlocks = Blockly.getMainWorkspace().getBlocksByType('sb_define_chord');
  const options = [];
  for (let block of chordBlocks) {
    const name = block.getFieldValue('NAME');
    if (name) {
      options.push([name, name]);
    }
  }
  if (options.length === 0) {
    options.push([Blockly.Msg['AUDIO_SELECT_CHORD_DROPDOWN'] || '(選取和弦)', 'none']);
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

  // Standard Audio Blocks
  {
    "type": "sb_minim_init",
    "message0": "啟動 Minim 音訊引擎",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SOUND_SOURCES_HUE}",
    "tooltip": "初始化 Minim 音訊引擎（應放於 setup 最上方）。%{BKY_HELP_HINT}",
    "helpUrl": "sound_sources"
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
    "inputsInline": true,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "mutator": "rhythm_v2_mutator"
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
  // Custom Synths (Container Style - No Name)
  {
    "type": "sb_create_harmonic_synth",
    "message0": "%{BKY_AUDIO_CREATE_HARMONIC_SYNTH}",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SOUND_SOURCES_HUE}",
    "tooltip": "%{BKY_AUDIO_CREATE_HARMONIC_SYNTH_TOOLTIP}%{BKY_HELP_HINT}",
    "mutator": "harmonic_mutator",
    "helpUrl": "custom_synth"
  },
  {
    "type": "sb_create_additive_synth",
    "message0": "%{BKY_AUDIO_CREATE_ADDITIVE_SYNTH}",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SOUND_SOURCES_HUE}",
    "tooltip": "%{BKY_AUDIO_CREATE_ADDITIVE_SYNTH_TOOLTIP}%{BKY_HELP_HINT}",
    "mutator": "additive_mutator",
    "helpUrl": "custom_synth"
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
      {
        "type": "input_value",
        "name": "VALUE",
        "check": "Number"
      },
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
      {
        "type": "input_value",
        "name": "DURATION",
        "check": "Number"
      },
      { "type": "input_dummy" },
      {
        "type": "input_statement",
        "name": "STACK"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_SB_MUSICAL_SECTION_TOOLTIP}"
  },
  {
    "type": "sb_set_noise",
    "message0": "%{BKY_SB_SET_NOISE_MESSAGE}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "TYPE",
        "options": [
          ["White", "WHITE"],
          ["Pink", "PINK"],
          ["Brown", "BROWN"]
        ]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SOUND_SOURCES_HUE}",
    "tooltip": "%{BKY_SB_SET_NOISE_TOOLTIP}"
  },
  {
    "type": "sb_mixed_source",
    "message0": "%{BKY_SB_MIXED_SOURCE_MESSAGE}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "WAVE",
        "options": [["Sine", "SINE"], ["Square", "SQUARE"], ["Triangle", "TRIANGLE"], ["Saw", "SAW"]]
      },
      {
        "type": "field_dropdown",
        "name": "NOISE",
        "options": [["White", "WHITE"], ["Pink", "PINK"], ["Brown", "BROWN"]]
      },
      { "type": "input_value", "name": "LEVEL", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SOUND_SOURCES_HUE}",
    "tooltip": "%{BKY_SB_MIXED_SOURCE_TOOLTIP}" + Blockly.Msg['HELP_HINT'],
    "helpUrl": "mixed_source"
  }
]);

// --- MANUAL BLOCK EXTENSIONS ---

Blockly.Blocks['sb_drum_sampler'] = {
  init: function () {
    this.jsonInit({
      "type": "sb_drum_sampler",
      "message0": "%{BKY_AUDIO_CREATE_DRUM_SAMPLER}",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "PATH",
          "options": [
            ["Kick", "drum/kick.wav"],
            ["Snare", "drum/snare.wav"],
            ["Rimshot", "drum/rim.wav"],
            ["Hi-Hat (Closed)", "drum/ch.wav"],
            ["Hi-Hat (Open)", "drum/oh.wav"],
            ["Tom (High)", "drum/tom_hi.wav"],
            ["Tom (Mid)", "drum/tom_mid.wav"],
            ["Tom (Low)", "drum/tom_low.wav"],
            ["Crash", "drum/crash.wav"],
            ["Ride", "drum/ride.wav"],
            ["Clap", "drum/clap.wav"],
            ["%{BKY_AUDIO_SAMPLER_CUSTOM}", "CUSTOM"]
          ]
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "%{BKY_SOUND_SOURCES_HUE}",
      "tooltip": "%{BKY_AUDIO_DRUM_SAMPLER_TOOLTIP}%{BKY_HELP_HINT}",
      "helpUrl": "sound_sources",
      "mutator": "drum_sampler_mutator"
    });
  }
};
Object.assign(Blockly.Blocks['sb_drum_sampler'], SAMPLER_HELPER);

Blockly.Blocks['sb_melodic_sampler'] = {
  init: function () {
    this.jsonInit({
      "type": "sb_melodic_sampler",
      "message0": "%{BKY_AUDIO_CREATE_MELODIC_SAMPLER}",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "TYPE",
          "options": [
            ["%{BKY_AUDIO_MELODIC_SAMPLER_PIANO}", "PIANO"],
            ["%{BKY_AUDIO_MELODIC_SAMPLER_VIOLIN_PIZZ}", "VIOLIN_PIZZ"],
            ["%{BKY_AUDIO_MELODIC_SAMPLER_VIOLIN_ARCO}", "VIOLIN_ARCO"],
            ["%{BKY_AUDIO_SAMPLER_CUSTOM}", "CUSTOM"]
          ]
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "%{BKY_SOUND_SOURCES_HUE}",
      "tooltip": "%{BKY_AUDIO_MELODIC_SAMPLER_TOOLTIP}%{BKY_HELP_HINT}",
      "helpUrl": "sound_sources",
      "mutator": "melodic_sampler_mutator"
    });
  }
};
Object.assign(Blockly.Blocks['sb_melodic_sampler'], SAMPLER_HELPER);

Blockly.Blocks['sb_setup_effect'] = {
  init: function () {
    this.jsonInit({
      "type": "sb_setup_effect",
      "message0": Blockly.Msg['SB_SETUP_EFFECT_MESSAGE'].replace('%1', '%1').trim(),
      "args0": [
        {
          "type": "field_dropdown",
          "name": "EFFECT_TYPE",
          "options": [
            [Blockly.Msg['SB_EFFECT_FILTER_TYPE_FIELD'], "filter"],
            [Blockly.Msg['SB_EFFECT_DELAY_TYPE_FIELD'], "delay"],
            [Blockly.Msg['SB_EFFECT_BITCRUSH_TYPE_FIELD'], "bitcrush"],
            [Blockly.Msg['SB_EFFECT_WAVESHAPER_TYPE_FIELD'], "waveshaper"],
            [Blockly.Msg['SB_EFFECT_REVERB_TYPE_FIELD'], "reverb"],
            [Blockly.Msg['SB_EFFECT_FLANGER_TYPE_FIELD'], "flanger"],
            [Blockly.Msg['SB_EFFECT_AUTOFILTER_TYPE_FIELD'], "autofilter"],
            [Blockly.Msg['SB_EFFECT_PITCHMOD_TYPE_FIELD'], "pitchmod"],
            [Blockly.Msg['SB_EFFECT_COMPRESSOR_TYPE_FIELD'], "compressor"],

            [Blockly.Msg['SB_EFFECT_LIMITER_TYPE_FIELD'], "limiter"]

          ]
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": Blockly.Msg['EFFECTS_HUE'] || "#8E44AD",
      "tooltip": Blockly.Msg['SB_SETUP_EFFECT_TOOLTIP'] + Blockly.Msg['HELP_HINT'],
      "helpUrl": "effects",
      "mutator": "setup_effect_mutator"
    });
    this.setInputsInline(false); // 強制多行呈現
    this.updateShape_('filter');
  }
};
Object.assign(Blockly.Blocks['sb_setup_effect'], EFFECT_HELPER);

// Register Mutators
Blockly.Extensions.registerMutator('harmonic_mutator', HARMONIC_PARTIALS_MUTATOR, undefined, ['sb_harmonic_partial_item']);
Blockly.Extensions.registerMutator('additive_mutator', ADDITIVE_SYNTH_MUTATOR, undefined, ['sb_additive_synth_item']);
Blockly.Extensions.registerMutator('melodic_sampler_mutator', MELODIC_SAMPLER_MUTATOR, undefined);
Blockly.Extensions.registerMutator('drum_sampler_mutator', DRUM_SAMPLER_MUTATOR, undefined);
Blockly.Extensions.registerMutator('rhythm_v2_mutator', RHYTHM_V2_MUTATOR, undefined, ['sb_rhythm_v2_item']);
Blockly.Extensions.registerMutator('setup_effect_mutator', SETUP_EFFECT_MUTATOR, undefined);

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


// --- INSTRUMENT CONTAINER SYSTEM ---

Blockly.Blocks['sb_instrument_container'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(Blockly.Msg['SB_INSTRUMENT_CONTAINER_MESSAGE'].replace('%1', '').replace('%2', '').trim())
      .appendField(new Blockly.FieldTextInput("MySynth"), "NAME");
    this.appendStatementInput("STACK")
      .setCheck(null);
    this.setColour(Blockly.Msg['SOUND_SOURCES_HUE'] || "#E74C3C"); // Audio color
    this.setTooltip(Blockly.Msg['SB_INSTRUMENT_CONTAINER_TOOLTIP']);
    this.setHelpUrl("");
  },
  onchange: function () {
    if (!this.workspace || this.isInFlyout) return;

    // 定義所有被視為「音源」的積木類型
    const sourceTypes = [
      'sb_set_wave',
      'sb_set_noise',
      'sb_mixed_source',
      'sb_melodic_sampler',
      'sb_drum_sampler',
      'sb_create_harmonic_synth',
      'sb_create_additive_synth'
    ];

    // 取得所有啟用的子積木
    const descendants = this.getDescendants(false);
    const sources = descendants.filter(b => sourceTypes.includes(b.type) && b.isEnabled());

    const svg = this.getSvgRoot();
    if (sources.length > 1) {
      this.setWarningText(Blockly.Msg['SB_INSTRUMENT_CONTAINER_MULTI_SOURCE_WARN']);
      if (svg) {
        svg.classList.add('blockly-conflict-glow');
      }
    } else {
      this.setWarningText(null);
      if (svg) {
        svg.classList.remove('blockly-conflict-glow');
      }
    }
  }
};

Blockly.Blocks['sb_set_adsr'] = {
  init: function () {
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
    this.setColour(Blockly.Msg['INSTRUMENT_CONTROL_HUE'] || "#E74C3C");
    this.setTooltip(Blockly.Msg['SB_SET_ADSR_TOOLTIP']);
  },
  onchange: function () {
    if (!this.workspace || this.isInFlyout) return;

    // 尋找所屬的容器
    let parent = this.getParent();
    while (parent && parent.type !== 'sb_instrument_container') {
      parent = parent.getParent();
    }

    if (parent) {
      // 檢查容器內是否有「啟用中」的旋律取樣器
      const hasEnabledSampler = parent.getDescendants(false).some(b =>
        b.type === 'sb_melodic_sampler' && b.isEnabled()
      );
      if (hasEnabledSampler) {
        this.setWarningText(Blockly.Msg['SB_SET_ADSR_SAMPLER_WARN']);
      } else {
        this.setWarningText(null);
      }
    } else {
      this.setWarningText(null);
    }
  }
};

Blockly.Blocks['sb_set_wave'] = {
  init: function () {
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

// --- DYNAMIC DROPDOWN FOR INSTRUMENTS (Hybrid Helper) ---
const getInstrumentOptions = function () {
  const options = [];
  // 1. Always add "Current Selected Instrument" as the first option
  const currentLabel = Blockly.Msg['SB_CURRENT_INSTRUMENT_OPTION'] || '當前選用的樂器';
  options.push([currentLabel, currentLabel]);

  const workspace = Blockly.getMainWorkspace();
  if (workspace) {
    const blocks = workspace.getBlocksByType('sb_instrument_container');
    for (let block of blocks) {
      const name = block.getFieldValue('NAME');
      if (name) options.push([name, name]);
    }
  }
  return options;
};

/**
 * 輔助函式：將文字輸入框轉化為具備下拉選單功能的組件
 */
const createInstrumentField = function (defaultVal, fieldName) {
  // Use "Current Selected Instrument" as default if no default provided
  const field = new Blockly.FieldTextInput(defaultVal || (Blockly.Msg['SB_CURRENT_INSTRUMENT_OPTION'] || ''));
  fieldName = fieldName || "NAME";

  field.showEditor_ = function (opt_e) {
    setTimeout(() => {
      const options = getInstrumentOptions();
      const menu = options.map(opt => ({
        text: opt[0],
        enabled: true,
        callback: () => { field.setValue(opt[1]); }
      }));
      menu.push({
        text: "--- " + (Blockly.Msg['AUDIO_SAMPLER_CUSTOM'] || "手動輸入") + " ---",
        enabled: true,
        callback: () => { Blockly.FieldTextInput.prototype.showEditor_.call(field); }
      });
      Blockly.ContextMenu.show(opt_e || {}, menu, this.sourceBlock_.RTL);
    }, 10);
  };
  return field;
};

// --- HAND-DEFINED HYBRID BLOCKS ---

Blockly.Blocks['sb_play_note'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(Blockly.Msg['AUDIO_PLAY_NOTE'])
      .appendField(createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "NAME");
    
    this.appendValueInput("PITCH")
      .setCheck(["Number", "String"])
      .appendField(Blockly.Msg['AUDIO_PLAY_NOTE_PITCH']);
    
    this.appendValueInput("VELOCITY")
      .setCheck("Number")
      .appendField(Blockly.Msg['AUDIO_PLAY_NOTE_VEL']);

    this.setPreviousStatement(true, null); 
    this.setNextStatement(true, null);
    this.setInputsInline(true);
    this.setColour("#D35400");
    this.setTooltip(Blockly.Msg['AUDIO_PLAY_NOTE_TOOLTIP']);
  }
};

Blockly.Blocks['sb_stop_note'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(Blockly.Msg['AUDIO_STOP_NOTE'])
      .appendField(createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "NAME");
    
    this.appendValueInput("PITCH")
      .setCheck(["Number", "String"])
      .appendField(Blockly.Msg['AUDIO_STOP_NOTE_PITCH']);

    this.setPreviousStatement(true, null); 
    this.setNextStatement(true, null);
    this.setInputsInline(true);
    this.setColour("#D35400");
    this.setTooltip(Blockly.Msg['AUDIO_STOP_NOTE_TOOLTIP']);
  }
};

Blockly.Blocks['sb_select_current_instrument'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(Blockly.Msg['AUDIO_SELECT_INSTRUMENT'].replace('%1', '').trim())
      .appendField(createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "NAME");
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setColour(Blockly.Msg['PERFORMANCE_HUE'] || "#D22F73");
    this.setTooltip(Blockly.Msg['AUDIO_SELECT_INSTRUMENT_TOOLTIP']);
  }
};

Blockly.Blocks['sb_set_instrument_volume'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(Blockly.Msg['AUDIO_SET_INSTRUMENT_VOLUME'])
      .appendField(createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "NAME");
    this.appendValueInput("VOLUME")
      .setCheck("Number")
      .appendField(Blockly.Msg['AUDIO_SET_INSTRUMENT_VOLUME_VAL'].split('%')[0].trim());
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setInputsInline(true);
    this.setColour(Blockly.Msg['INSTRUMENT_CONTROL_HUE'] || "#D22F73");
    this.setTooltip(Blockly.Msg['AUDIO_SET_INSTRUMENT_VOLUME_TOOLTIP']);
  }
};

Blockly.Blocks['sb_trigger_sample'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(Blockly.Msg['AUDIO_TRIGGER_SAMPLE'])
      .appendField(createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "NAME");
    this.appendDummyInput()
      .appendField(Blockly.Msg['AUDIO_TRIGGER_SAMPLE_NOTE'])
      .appendField(new Blockly.FieldTextInput("C4Q"), "NOTE");
    this.appendValueInput("VELOCITY")
      .setCheck("Number")
      .appendField(Blockly.Msg['AUDIO_TRIGGER_SAMPLE_VEL']);
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setInputsInline(true);
    this.setColour(Blockly.Msg['PERFORMANCE_HUE'] || "#E67E22");
    this.setTooltip(Blockly.Msg['AUDIO_TRIGGER_SAMPLE_TOOLTIP']);
  }
};

Blockly.Blocks['sb_play_chord_by_name'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(Blockly.Msg['AUDIO_PLAY_CHORD_BY_NAME'])
      .appendField(createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "INST_NAME")
      .appendField(new Blockly.FieldTextInput("CM7"), "NAME");
    
    this.appendValueInput("DUR")
      .setCheck(["Number", "String"])
      .appendField(Blockly.Msg['AUDIO_PLAY_CHORD_BY_NAME_DUR']);
    
    this.appendValueInput("VELOCITY")
      .setCheck("Number")
      .appendField(Blockly.Msg['AUDIO_PLAY_CHORD_BY_NAME_VEL']);

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setInputsInline(true);
    this.setColour(Blockly.Msg['PERFORMANCE_HUE'] || "#E67E22");
    this.setTooltip(Blockly.Msg['AUDIO_PLAY_CHORD_BY_NAME_TOOLTIP']);
  }
};

Blockly.Blocks['sb_play_melody'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(Blockly.Msg['AUDIO_PLAY_MELODY'])
      .appendField(createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT'], 'INSTRUMENT'), "INSTRUMENT");
    
    this.appendDummyInput()
      .appendField(Blockly.Msg['AUDIO_PLAY_MELODY_SCORE'])
      .appendField(new FieldMultilineInput("C4Q, E4Q, G4H"), "MELODY");

    this.setPreviousStatement(true, null); 
    this.setNextStatement(true, null);
    this.setColour(Blockly.Msg['PERFORMANCE_HUE'] || "#E67E22");
    this.setTooltip(Blockly.Msg['AUDIO_PLAY_MELODY_TOOLTIP']);
  }
};

Blockly.Blocks['sb_rhythm_sequence'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(Blockly.Msg['AUDIO_RHYTHM_SEQUENCE'])
      .appendField(createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT'], 'SOURCE'), "SOURCE")
      .appendField(Blockly.Msg['AUDIO_RHYTHM_SEQUENCE_MODE'] || "Mode")
      .appendField(new Blockly.FieldDropdown([
        [Blockly.Msg['AUDIO_RHYTHM_MODE_MONO'], "FALSE"],
        [Blockly.Msg['AUDIO_RHYTHM_MODE_CHORD'], "TRUE"]
      ]), "CHORD_MODE");
    
    this.appendValueInput("MEASURE")
      .setCheck("Number")
      .appendField(Blockly.Msg['AUDIO_RHYTHM_SEQUENCE_MEASURE']);
    
    this.appendDummyInput()
      .appendField(Blockly.Msg['AUDIO_RHYTHM_SEQUENCE_PATTERN'])
      .appendField(new Blockly.FieldTextInput("x--- x--- x--- x---"), "PATTERN");
      
    this.appendValueInput("VELOCITY")
      .setCheck("Number")
      .appendField(Blockly.Msg['AUDIO_RHYTHM_SEQUENCE_VELOCITY']);

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setInputsInline(true);
    this.setColour(Blockly.Msg['PERFORMANCE_HUE'] || "#E67E22");
    this.setTooltip(Blockly.Msg['AUDIO_RHYTHM_SEQUENCE_TOOLTIP']);
  }
};

Blockly.Blocks['sb_set_panning'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(Blockly.Msg['SB_SET_PANNING_MESSAGE'])
      .appendField(createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "NAME");
    this.appendValueInput("VALUE")
      .setCheck("Number")
      .appendField(Blockly.Msg['SB_SET_PANNING_VAL']);
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setInputsInline(true);
    this.setColour(Blockly.Msg['INSTRUMENT_CONTROL_HUE'] || "#D22F73");
    this.setTooltip(Blockly.Msg['SB_SET_PANNING_TOOLTIP']);
  }
};

Blockly.Blocks['sb_set_effect_param'] = {
  init: function () {
    var instance = this;

    // 動態獲獲取效果器清單
    var getEffectOptions = function () {
      var options = [];
      var target = instance.getFieldValue('TARGET');
      if (!target || target === Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']) {
        return [[Blockly.Msg['SB_NO_INSTRUMENT_SELECTED'] || "(尚未選取樂器)", "none"]];
      }

      var workspace = instance.workspace;
      var blocks = workspace.getAllBlocks(false);
      var container = blocks.find(b => b.type === 'sb_instrument_container' && b.getFieldValue('NAME') === target);

      if (container) {
        var child = container.getInputTargetBlock('STACK');
        while (child) {
          if (child.type === 'sb_setup_effect') {
            var type = child.getFieldValue('EFFECT_TYPE');
            var label = child.getField('EFFECT_TYPE').getText();
            if (!options.find(o => o[1] === type)) {
              options.push([label, type]);
            }
          }
          child = child.getNextBlock();
        }
      }

      if (options.length === 0) {
        options.push([Blockly.Msg['SB_NO_EFFECTS_AVAILABLE'] || "(無可用效果器)", "none"]);
      }
      return options;
    };

    this.appendDummyInput()
      .appendField(Blockly.Msg['SB_SET_EFFECT_PARAM_TITLE'].split('%1')[0])
      .appendField(createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "TARGET")
      .appendField(Blockly.Msg['SB_SET_EFFECT_PARAM_TITLE'].split('%2')[0].split('%1')[1] || "類型")
      .appendField(new Blockly.FieldDropdown(getEffectOptions, function (val) {
        this.sourceBlock_.updateShape_(val);
      }), "EFFECT_TYPE");

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(Blockly.Msg['EFFECTS_HUE'] || "#8E44AD");
    this.setTooltip(Blockly.Msg['SB_SET_EFFECT_PARAM_TOOLTIP']);
    this.updateShape_('panning');
  },
  mutationToDom: function () {
    var container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('effect_type', this.getFieldValue('EFFECT_TYPE'));
    return container;
  },
  domToMutation: function (xmlElement) {
    var type = xmlElement.getAttribute('effect_type');
    this.updateShape_(type);
  },
  updateShape_: function (type) {
    if (this.getInput('PARAMS')) this.removeInput('PARAMS');
    if (this.getInput('VALUE')) this.removeInput('VALUE');

    var input = this.appendDummyInput('PARAMS');

    if (type === 'filter') {
      input.appendField(Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'].split('%1')[0])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['SB_EFFECT_FILTER_FREQ_FIELD'], "frequency"],
          [Blockly.Msg['SB_EFFECT_FILTER_Q_FIELD'], "resonance"]
        ]), "PARAM_NAME");
    } else if (type === 'adsr') {
      input.appendField(Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'].split('%1')[0])
        .appendField(new Blockly.FieldDropdown([
          ["Attack (A)", "adsrA"],
          ["Decay (D)", "adsrD"],
          ["Sustain (S)", "adsrS"],
          ["Release (R)", "adsrR"]
        ]), "PARAM_NAME");
    } else if (type === 'reverb') {
      input.appendField(Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'].split('%1')[0])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['SB_EFFECT_ROOMSIZE_FIELD'], "roomSize"],
          [Blockly.Msg['SB_EFFECT_DAMPING_FIELD'], "damping"],
          [Blockly.Msg['SB_EFFECT_WET_FIELD'], "wet"]
        ]), "PARAM_NAME");
    } else if (type === 'delay') {
      input.appendField(Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'].split('%1')[0])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['SB_EFFECT_DELAY_TIME_FIELD'], "delTime"],
          [Blockly.Msg['SB_EFFECT_FEEDBACK_FIELD'], "delAmp"]
        ]), "PARAM_NAME");
    } else if (type === 'bitcrush') {
      input.appendField(Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'].split('%1')[0])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['SB_EFFECT_BITDEPTH_FIELD'], "bitRes"]
        ]), "PARAM_NAME");
    } else if (type === 'waveshaper') {
      input.appendField(Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'].split('%1')[0])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['SB_EFFECT_DISTORTION_AMOUNT_FIELD'], "amount"]
        ]), "PARAM_NAME");
    } else if (type === 'compressor') {
      input.appendField(Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'].split('%1')[0])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['SB_EFFECT_THRESHOLD_FIELD'], "threshold"],
          [Blockly.Msg['SB_EFFECT_RATIO_FIELD'], "ratio"],
          [Blockly.Msg['SB_EFFECT_ATTACK_FIELD'], "attack"],
          [Blockly.Msg['SB_EFFECT_RELEASE_FIELD'], "release"],
          [Blockly.Msg['SB_EFFECT_MAKEUP_FIELD'], "makeup"]
        ]), "PARAM_NAME");
    } else if (type === 'limiter') {
      input.appendField(Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'].split('%1')[0])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['SB_EFFECT_THRESHOLD_FIELD'], "threshold"],
          [Blockly.Msg['SB_EFFECT_ATTACK_FIELD'], "attack"],
          [Blockly.Msg['SB_EFFECT_RELEASE_FIELD'], "release"]
        ]), "PARAM_NAME");
    } else if (type === 'flanger') {
      input.appendField(Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'].split('%1')[0])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['SB_EFFECT_DELAY_TIME_FIELD'], "delay"],
          [Blockly.Msg['SB_EFFECT_RATE_FIELD'], "rate"],
          [Blockly.Msg['SB_EFFECT_DEPTH_FIELD'], "depth"],
          [Blockly.Msg['SB_EFFECT_FEEDBACK_FIELD'], "feedback"]
        ]), "PARAM_NAME");
    } else if (type === 'autofilter') {
      input.appendField(Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'].split('%1')[0])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['SB_EFFECT_RATE_FIELD'], "rate"],
          [Blockly.Msg['SB_EFFECT_DEPTH_FIELD'], "depth"],
          [Blockly.Msg['SB_EFFECT_FILTER_Q_FIELD'], "resonance"]
        ]), "PARAM_NAME");
    } else if (type === 'pitchmod') {
      input.appendField(Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'].split('%1')[0])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['SB_EFFECT_RATE_FIELD'], "rate"],
          [Blockly.Msg['SB_EFFECT_DEPTH_FIELD'], "depth"]
        ]), "PARAM_NAME");
    } else if (type === 'panning') {
      input.appendField(Blockly.Msg['SB_SET_EFFECT_PARAM_PAN_LABEL']);
    }

    this.appendValueInput("VALUE")
      .setCheck("Number")
      .appendField(Blockly.Msg['SB_SET_EFFECT_PARAM_VALUE']);
  }
};

Blockly.Blocks['sb_update_adsr'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(Blockly.Msg['SB_UPDATE_ADSR_TITLE'].split('%1')[0])
      .appendField(createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "TARGET");
    this.appendValueInput("A").setCheck("Number").appendField("A");
    this.appendValueInput("D").setCheck("Number").appendField("D");
    this.appendValueInput("S").setCheck("Number").appendField("S");
    this.appendValueInput("R").setCheck("Number").appendField("R");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(Blockly.Msg['INSTRUMENT_CONTROL_HUE'] || "#D22F73");
    this.setTooltip(Blockly.Msg['SB_UPDATE_ADSR_TOOLTIP']);
  }
};
