/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Audio Core Blocks: Initialization and Instrument Setup.
 */

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

  // Standard Audio Initialization
  {
    "type": "sb_minim_init",
    "message0": "啟動 Minim 音訊引擎",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SOUND_SOURCES_HUE}",
    "tooltip": "初始化 Minim 音訊引擎（應放於 setup 最上方）。%{BKY_HELP_HINT}",
    "helpUrl": "sound_sources"
  },
  
  // Wave & Noise Sources
  {
    "type": "sb_set_wave",
    "message0": "%{BKY_SB_SET_WAVE_MESSAGE}",
    "args0": [
        {
            "type": "field_dropdown",
            "name": "TYPE",
            "options": [
                ["Sine", "SINE"],
                ["Square", "SQUARE"],
                ["Triangle", "TRIANGLE"],
                ["Sawtooth", "SAW"]
            ]
        }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SOUND_SOURCES_HUE}",
    "tooltip": "%{BKY_SB_SET_WAVE_TOOLTIP}"
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
  },

  // Custom Synths
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
  }
]);

// Samplers
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
Object.assign(Blockly.Blocks['sb_drum_sampler'], window.SB_Utils.FIELD_HELPER);

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
Object.assign(Blockly.Blocks['sb_melodic_sampler'], window.SB_Utils.FIELD_HELPER);

// Instrument Container
Blockly.Blocks['sb_instrument_container'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(Blockly.Msg['SB_INSTRUMENT_CONTAINER_MESSAGE'].replace('%1', '').replace('%2', '').trim())
      .appendField(new Blockly.FieldTextInput("MySynth"), "NAME");
    this.appendStatementInput("STACK")
      .setCheck(null);
    this.setColour(Blockly.Msg['SOUND_SOURCES_HUE'] || "#E74C3C");
    this.setTooltip(Blockly.Msg['SB_INSTRUMENT_CONTAINER_TOOLTIP']);
  },
  onchange: function () {
    if (!this.workspace || this.isInFlyout) return;
    const sourceTypes = ['sb_set_wave', 'sb_set_noise', 'sb_mixed_source', 'sb_melodic_sampler', 'sb_drum_sampler', 'sb_create_harmonic_synth', 'sb_create_additive_synth'];
    const descendants = this.getDescendants(false);
    const sources = descendants.filter(b => sourceTypes.includes(b.type) && b.isEnabled());
    const svg = this.getSvgRoot();
    if (sources.length > 1) {
      this.setWarningText(Blockly.Msg['SB_INSTRUMENT_CONTAINER_MULTI_SOURCE_WARN']);
      if (svg) svg.classList.add('blockly-conflict-glow');
    } else {
      this.setWarningText(null);
      if (svg) svg.classList.remove('blockly-conflict-glow');
    }
  }
};

// ADSR
Blockly.Blocks['sb_set_adsr'] = {
  init: function () {
    this.appendDummyInput().appendField(Blockly.Msg['SB_SET_ADSR_MESSAGE']);
    this.appendValueInput("A").setCheck("Number").appendField("A (Attack)");
    this.appendValueInput("D").setCheck("Number").appendField("D (Decay)");
    this.appendValueInput("S").setCheck("Number").appendField("S (Sustain)");
    this.appendValueInput("R").setCheck("Number").appendField("R (Release)");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(Blockly.Msg['INSTRUMENT_CONTROL_HUE'] || "#E74C3C");
    this.setTooltip(Blockly.Msg['SB_SET_ADSR_TOOLTIP']);
  },
  onchange: function () {
    if (!this.workspace || this.isInFlyout) return;
    let parent = this.getParent();
    while (parent && parent.type !== 'sb_instrument_container') { parent = parent.getParent(); }
    if (parent) {
      const hasEnabledSampler = parent.getDescendants(false).some(b => b.type === 'sb_melodic_sampler' && b.isEnabled());
      if (hasEnabledSampler) this.setWarningText(Blockly.Msg['SB_SET_ADSR_SAMPLER_WARN']);
      else this.setWarningText(null);
    } else {
      this.setWarningText(null);
    }
  }
};

// Register Mutators
Blockly.Extensions.registerMutator('harmonic_mutator', window.SB_Utils.HARMONIC_PARTIALS_MUTATOR, undefined, ['sb_harmonic_partial_item']);
Blockly.Extensions.registerMutator('additive_mutator', window.SB_Utils.ADDITIVE_SYNTH_MUTATOR, undefined, ['sb_additive_synth_item']);
Blockly.Extensions.registerMutator('melodic_sampler_mutator', window.SB_Utils.MELODIC_SAMPLER_MUTATOR, undefined);
Blockly.Extensions.registerMutator('drum_sampler_mutator', window.SB_Utils.DRUM_SAMPLER_MUTATOR, undefined);
