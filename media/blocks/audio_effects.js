/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Audio Effects Blocks: Filters, Reverbs, Delays and Param Control.
 */

Blockly.Blocks['sb_setup_effect'] = {
  init: function () {
    this.jsonInit({
      "type": "sb_setup_effect",
      "message0": (Blockly.Msg['SB_SETUP_EFFECT_MESSAGE'] || "配置 %1").replace('%1', '%1').trim(),
      "args0": [
        {
          "type": "field_dropdown",
          "name": "EFFECT_TYPE",
          "options": [
            [Blockly.Msg['SB_EFFECT_FILTER_TYPE_FIELD'] || "Filter", "filter"],
            [Blockly.Msg['SB_EFFECT_DELAY_TYPE_FIELD'] || "Delay", "delay"],
            [Blockly.Msg['SB_EFFECT_BITCRUSH_TYPE_FIELD'] || "BitCrush", "bitcrush"],
            [Blockly.Msg['SB_EFFECT_WAVESHAPER_TYPE_FIELD'] || "Waveshaper", "waveshaper"],
            [Blockly.Msg['SB_EFFECT_REVERB_TYPE_FIELD'] || "Reverb", "reverb"],
            [Blockly.Msg['SB_EFFECT_FLANGER_TYPE_FIELD'] || "Flanger", "flanger"],
            [Blockly.Msg['SB_EFFECT_AUTOFILTER_TYPE_FIELD'] || "Auto-Filter", "autofilter"],
            [Blockly.Msg['SB_EFFECT_PITCHMOD_TYPE_FIELD'] || "Pitch-Mod", "pitchmod"],
            [Blockly.Msg['SB_EFFECT_COMPRESSOR_TYPE_FIELD'] || "Compressor", "compressor"],
            [Blockly.Msg['SB_EFFECT_LIMITER_TYPE_FIELD'] || "Limiter", "limiter"]
          ]
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": Blockly.Msg['EFFECTS_HUE'] || "#8E44AD",
      "tooltip": (Blockly.Msg['SB_SETUP_EFFECT_TOOLTIP'] || "") + Blockly.Msg['HELP_HINT'],
      "helpUrl": "effects",
      "mutator": "setup_effect_mutator"
    });
    this.setInputsInline(false);
    this.updateShape_('filter');
  }
};
Object.assign(Blockly.Blocks['sb_setup_effect'], window.SB_Utils.FIELD_HELPER);

Blockly.Blocks['sb_set_instrument_volume'] = {
  init: function () {
    this.appendDummyInput().appendField(Blockly.Msg['AUDIO_SET_INSTRUMENT_VOLUME']).appendField(window.SB_Utils.createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "NAME");
    this.appendValueInput("VOLUME").setCheck("Number").appendField((Blockly.Msg['AUDIO_SET_INSTRUMENT_VOLUME_VAL'] || "音量 %1").split('%')[0].trim());
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setInputsInline(true); this.setColour(Blockly.Msg['INSTRUMENT_CONTROL_HUE'] || "#D22F73");
    this.setTooltip(Blockly.Msg['AUDIO_SET_INSTRUMENT_VOLUME_TOOLTIP']);
  }
};

Blockly.Blocks['sb_set_panning'] = {
  init: function () {
    this.appendDummyInput().appendField(Blockly.Msg['SB_SET_PANNING_MESSAGE']).appendField(window.SB_Utils.createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "NAME");
    this.appendValueInput("VALUE").setCheck("Number").appendField(Blockly.Msg['SB_SET_PANNING_VAL']);
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setInputsInline(true); this.setColour(Blockly.Msg['INSTRUMENT_CONTROL_HUE'] || "#D22F73");
    this.setTooltip(Blockly.Msg['SB_SET_PANNING_TOOLTIP']);
  }
};

Blockly.Blocks['sb_set_effect_param'] = {
  init: function () {
    var instance = this;
    var getEffectOptions = function () {
      var options = [["ADSR", "adsr"], [Blockly.Msg['SB_SET_PANNING_MESSAGE'] || "Panning", "panning"]];
      var target = instance.getFieldValue('TARGET');
      if (!target || target === Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']) return [[Blockly.Msg['SB_NO_INSTRUMENT_SELECTED'] || "(No Instrument)", "none"]];
      var workspace = instance.workspace;
      var blocks = workspace.getAllBlocks(false);
      var container = blocks.find(b => b.type === 'sb_instrument_container' && b.getFieldValue('NAME') === target);
      if (container) {
        var child = container.getInputTargetBlock('STACK');
        while (child) {
          if (child.type === 'sb_setup_effect') {
            var type = child.getFieldValue('EFFECT_TYPE');
            var label = child.getField('EFFECT_TYPE').getText();
            if (!options.find(o => o[1] === type)) options.push([label, type]);
          }
          child = child.getNextBlock();
        }
      }
      return options;
    };

    this.appendDummyInput().appendField((Blockly.Msg['SB_SET_EFFECT_PARAM_TITLE'] || "更新 %1 的 %2").split('%1')[0])
      .appendField(window.SB_Utils.createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "TARGET")
      .appendField((Blockly.Msg['SB_SET_EFFECT_PARAM_TITLE'] || "更新 %1 的 %2").split('%2')[0].split('%1')[1] || "類型")
      .appendField(new Blockly.FieldDropdown(getEffectOptions, function (val) { this.sourceBlock_.updateShape_(val); }), "EFFECT_TYPE");

    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
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
    this.updateShape_(xmlElement.getAttribute('effect_type'));
  },
  updateShape_: function (type) {
    if (this.getInput('PARAMS')) this.removeInput('PARAMS');
    if (this.getInput('VALUE')) this.removeInput('VALUE');
    var input = this.appendDummyInput('PARAMS');
    if (type === 'filter') {
      input.appendField((Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'] || "參數 %1").split('%1')[0])
        .appendField(new Blockly.FieldDropdown([[Blockly.Msg['SB_EFFECT_FILTER_FREQ_FIELD'], "frequency"], [Blockly.Msg['SB_EFFECT_FILTER_Q_FIELD'], "resonance"]]), "PARAM_NAME");
    } else if (type === 'adsr') {
      input.appendField((Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'] || "參數 %1").split('%1')[0])
        .appendField(new Blockly.FieldDropdown([["Attack (A)", "adsrA"], ["Decay (D)", "adsrD"], ["Sustain (S)", "adsrS"], ["Release (R)", "adsrR"]]), "PARAM_NAME");
    } else if (type === 'reverb') {
      input.appendField((Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'] || "參數 %1").split('%1')[0])
        .appendField(new Blockly.FieldDropdown([[Blockly.Msg['SB_EFFECT_ROOMSIZE_FIELD'], "roomSize"], [Blockly.Msg['SB_EFFECT_DAMPING_FIELD'], "damping"], [Blockly.Msg['SB_EFFECT_WET_FIELD'], "wet"]]), "PARAM_NAME");
    } else if (type === 'delay') {
      input.appendField((Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'] || "參數 %1").split('%1')[0])
        .appendField(new Blockly.FieldDropdown([[Blockly.Msg['SB_EFFECT_DELAY_TIME_FIELD'], "delTime"], [Blockly.Msg['SB_EFFECT_FEEDBACK_FIELD'], "delAmp"]]), "PARAM_NAME");
    } else if (type === 'bitcrush') {
      input.appendField((Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'] || "參數 %1").split('%1')[0])
        .appendField(new Blockly.FieldDropdown([[Blockly.Msg['SB_EFFECT_BITDEPTH_FIELD'], "bitRes"]]), "PARAM_NAME");
    } else if (type === 'waveshaper') {
      input.appendField((Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'] || "參數 %1").split('%1')[0])
        .appendField(new Blockly.FieldDropdown([[Blockly.Msg['SB_EFFECT_DISTORTION_AMOUNT_FIELD'], "amount"]]), "PARAM_NAME");
    } else if (type === 'compressor') {
      input.appendField((Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'] || "參數 %1").split('%1')[0])
        .appendField(new Blockly.FieldDropdown([[Blockly.Msg['SB_EFFECT_THRESHOLD_FIELD'], "threshold"], [Blockly.Msg['SB_EFFECT_RATIO_FIELD'], "ratio"], [Blockly.Msg['SB_EFFECT_ATTACK_FIELD'], "attack"], [Blockly.Msg['SB_EFFECT_RELEASE_FIELD'], "release"], [Blockly.Msg['SB_EFFECT_MAKEUP_FIELD'], "makeup"]]), "PARAM_NAME");
    } else if (type === 'limiter') {
      input.appendField((Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'] || "參數 %1").split('%1')[0])
        .appendField(new Blockly.FieldDropdown([[Blockly.Msg['SB_EFFECT_THRESHOLD_FIELD'], "threshold"], [Blockly.Msg['SB_EFFECT_ATTACK_FIELD'], "attack"], [Blockly.Msg['SB_EFFECT_RELEASE_FIELD'], "release"]]), "PARAM_NAME");
    } else if (type === 'flanger') {
      input.appendField((Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'] || "參數 %1").split('%1')[0])
        .appendField(new Blockly.FieldDropdown([[Blockly.Msg['SB_EFFECT_DELAY_TIME_FIELD'], "delay"], [Blockly.Msg['SB_EFFECT_RATE_FIELD'], "rate"], [Blockly.Msg['SB_EFFECT_DEPTH_FIELD'], "depth"], [Blockly.Msg['SB_EFFECT_FEEDBACK_FIELD'], "feedback"]]), "PARAM_NAME");
    } else if (type === 'autofilter') {
      input.appendField((Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'] || "參數 %1").split('%1')[0])
        .appendField(new Blockly.FieldDropdown([[Blockly.Msg['SB_EFFECT_RATE_FIELD'], "rate"], [Blockly.Msg['SB_EFFECT_DEPTH_FIELD'], "depth"], [Blockly.Msg['SB_EFFECT_FILTER_Q_FIELD'], "resonance"]]), "PARAM_NAME");
    } else if (type === 'pitchmod') {
      input.appendField((Blockly.Msg['SB_SET_EFFECT_PARAM_PARAM'] || "參數 %1").split('%1')[0])
        .appendField(new Blockly.FieldDropdown([[Blockly.Msg['SB_EFFECT_RATE_FIELD'], "rate"], [Blockly.Msg['SB_EFFECT_DEPTH_FIELD'], "depth"]]), "PARAM_NAME");
    } else if (type === 'panning') {
      input.appendField(Blockly.Msg['SB_SET_EFFECT_PARAM_PAN_LABEL'] || "相位 (Panning)");
    }
    this.appendValueInput("VALUE").setCheck("Number").appendField(Blockly.Msg['SB_SET_EFFECT_PARAM_VALUE'] || "數值");
  }
};

Blockly.Blocks['sb_update_adsr'] = {
  init: function () {
    this.appendDummyInput().appendField((Blockly.Msg['SB_UPDATE_ADSR_TITLE'] || "更新 %1 的 ADSR").split('%1')[0]).appendField(window.SB_Utils.createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), "TARGET");
    this.appendValueInput("A").setCheck("Number").appendField("A");
    this.appendValueInput("D").setCheck("Number").appendField("D");
    this.appendValueInput("S").setCheck("Number").appendField("S");
    this.appendValueInput("R").setCheck("Number").appendField("R");
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setColour(Blockly.Msg['INSTRUMENT_CONTROL_HUE'] || "#D22F73");
    this.setTooltip(Blockly.Msg['SB_UPDATE_ADSR_TOOLTIP']);
  }
};

// Register Mutators
Blockly.Extensions.registerMutator('setup_effect_mutator', window.SB_Utils.SETUP_EFFECT_MUTATOR, undefined);
