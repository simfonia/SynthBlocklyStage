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

const DRUM_SAMPLER_MUTATOR = {
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('type', this.getFieldValue('PATH') || 'Kick');
    return container;
  },
  domToMutation: function(xmlElement) {
    this.updateShape_(xmlElement.getAttribute('type') || 'Kick');
  },
  updateShape_: function(type) {
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
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('type', this.getFieldValue('TYPE') || 'PIANO');
    return container;
  },
  domToMutation: function(xmlElement) {
    this.updateShape_(xmlElement.getAttribute('type') || 'PIANO');
  },
  updateShape_: function(type) {
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
  onchange: function(e) {
    if (!this.workspace || this.isInFlyout) return;
    // Check if the change is on this block and is the source field
    if (e.type === Blockly.Events.BLOCK_CHANGE && e.blockId === this.id && (e.name === 'PATH' || e.name === 'TYPE')) {
      this.updateShape_(e.newValue);
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
    options.push([Blockly.Msg['AUDIO_SELECT_INSTRUMENT_DROPDOWN'] || '(選取樂器)', 'none']);
  }
  return options;
};

// --- DYNAMIC DROPDOWN FOR CHORDS ---
const getChordDropdown = function() {
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
    "type": "sb_trigger_sample",
    "message0": "%{BKY_AUDIO_TRIGGER_SAMPLE}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "NAME",
        "options": getInstrumentDropdown
      },
      { "type": "field_input", "name": "NOTE", "text": "C4Q" },
      { "type": "input_value", "name": "VELOCITY", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_TRIGGER_SAMPLE_TOOLTIP}%{BKY_HELP_HINT}",
    "helpUrl": "sound_sources"
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
    "type": "sb_set_instrument_volume",
    "message0": "%{BKY_AUDIO_SET_INSTRUMENT_VOLUME}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "NAME",
        "options": getInstrumentDropdown
      },
      { "type": "input_value", "name": "VOLUME", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_INSTRUMENT_CONTROL_HUE}",
    "tooltip": "%{BKY_AUDIO_SET_INSTRUMENT_VOLUME_TOOLTIP}"
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
    "helpUrl": "melody"
  },
  {
    "type": "sb_rhythm_sequence",
    "message0": "%{BKY_AUDIO_RHYTHM_SEQUENCE}",
    "args0": [
      { "type": "input_dummy" },
      {
        "type": "field_dropdown",
        "name": "SOURCE",
        "options": getInstrumentDropdown
      },
      {
        "type": "field_dropdown",
        "name": "CHORD_MODE",
        "options": [
          ["%{BKY_AUDIO_RHYTHM_MODE_MONO}", "FALSE"],
          ["%{BKY_AUDIO_RHYTHM_MODE_CHORD}", "TRUE"]
        ]
      },
      { "type": "input_value", "name": "MEASURE", "check": "Number" },
      { "type": "field_input", "name": "PATTERN", "text": "x--- x--- x--- x---" },
      { "type": "input_value", "name": "VELOCITY", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_RHYTHM_SEQUENCE_TOOLTIP}"
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
          "type": "sb_play_chord_by_name",
          "message0": "%{BKY_AUDIO_PLAY_CHORD_BY_NAME}",
          "args0": [
            {
              "type": "field_dropdown",
              "name": "NAME",
              "options": getChordDropdown
            },
            { "type": "field_input", "name": "DUR", "text": "4n" },
            { "type": "input_value", "name": "VELOCITY", "check": "Number" }
          ],
          "previousStatement": null,
          "nextStatement": null,
          "colour": "%{BKY_PERFORMANCE_HUE}",
          "tooltip": "根據名稱演奏已定義的和弦。%{BKY_HELP_HINT}",
          "helpUrl": "melody"
        },    // Custom Synths (Container Style - No Name)
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
  }
]);

// --- MANUAL BLOCK EXTENSIONS ---

Blockly.Blocks['sb_drum_sampler'] = {
  init: function() {
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
  init: function() {
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

// Register Mutators
Blockly.Extensions.registerMutator('harmonic_mutator', HARMONIC_PARTIALS_MUTATOR, undefined, ['sb_harmonic_partial_item']);
Blockly.Extensions.registerMutator('additive_mutator', ADDITIVE_SYNTH_MUTATOR, undefined, ['sb_additive_synth_item']);
Blockly.Extensions.registerMutator('melodic_sampler_mutator', MELODIC_SAMPLER_MUTATOR, undefined);
Blockly.Extensions.registerMutator('drum_sampler_mutator', DRUM_SAMPLER_MUTATOR, undefined);


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
  },
  onchange: function() {
    if (!this.workspace || this.isInFlyout) return;
    
    // 定義所有被視為「音源」的積木類型
    const sourceTypes = [
      'sb_set_wave', 
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
    this.setColour(Blockly.Msg['INSTRUMENT_CONTROL_HUE'] || "#E74C3C");
    this.setTooltip(Blockly.Msg['SB_SET_ADSR_TOOLTIP']);
  },
  onchange: function() {
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
