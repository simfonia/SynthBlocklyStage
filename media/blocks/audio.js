/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Audio blocks for Processing (Minim library).
 * Updated to support Mutators for dynamic partials and additive synthesis.
 */

// 1. Static Blocks Definition
Blockly.defineBlocksWithJsonArray([
  {
    "type": "sb_minim_init",
    "message0": "啟動 Minim 音訊引擎",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#E74C3C",
    "tooltip": "初始化 Minim 音訊引擎（應放於 setup 最上方）。",
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
    "colour": "#E74C3C",
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
    "colour": "#E74C3C",
    "tooltip": "立即播放指定的音訊樣本一次。"
  },
  {
    "type": "sb_create_synth_instrument",
    "message0": "%{BKY_AUDIO_CREATE_SYNTH_INSTRUMENT}",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "Lead" },
      {
        "type": "field_dropdown",
        "name": "TYPE",
        "options": [
          ["Triangle", "TRIANGLE"],
          ["Sine", "SINE"],
          ["Square", "SQUARE"],
          ["Saw", "SAW"]
        ]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#E74C3C",
    "tooltip": "建立一個具備特定名稱的合成器音色。"
  },
  {
    "type": "sb_select_current_instrument",
    "message0": "%{BKY_AUDIO_SELECT_INSTRUMENT}",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "Lead" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#E74C3C",
    "tooltip": "切換目前要演奏的樂器名稱。"
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
    "colour": "#E74C3C",
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
    "colour": "#E74C3C",
    "tooltip": "觸發 ADSR 的 Release 階段並停止發聲。"
  }
]);

// 2. Dynamic Blocks (Harmonic Synth)
Blockly.Blocks['sb_create_harmonic_synth'] = {
  init: function() {
    let msg = Blockly.Msg['AUDIO_CREATE_HARMONIC_SYNTH'] || "建立諧波合成音源 名稱 %1";
    this.appendDummyInput()
        .appendField(msg.replace('%1', '').trim())
        .appendField(new Blockly.FieldTextInput("Organ"), "NAME");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#E74C3C");
    this.itemCount_ = 0;
    this.updateShape_();
  },
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    return container;
  },
  domToMutation: function(xmlElement) {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10) || 0;
    this.updateShape_();
  },
  updateShape_: function() {
    for (let i = 1; i <= this.itemCount_; i++) {
      if (!this.getInput('PARTIAL' + i)) {
        this.appendValueInput('PARTIAL' + i)
            .setCheck('Number')
            .appendField((Blockly.Msg['AUDIO_HARMONIC_FIELD'] || "%1 倍頻 振幅").replace('%1', i));
      }
    }
    // Remove deleted inputs
    let i = this.itemCount_ + 1;
    while (this.getInput('PARTIAL' + i)) {
      this.removeInput('PARTIAL' + i);
      i++;
    }
  }
};

// 3. Dynamic Blocks (Additive Synth)
Blockly.Blocks['sb_create_additive_synth'] = {
  init: function() {
    let msg = Blockly.Msg['AUDIO_CREATE_ADDITIVE_SYNTH'] || "建立自訂合成音源 名稱 %1";
    this.appendDummyInput()
        .appendField(msg.replace('%1', '').trim())
        .appendField(new Blockly.FieldTextInput("Bell"), "NAME");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#E74C3C");
    this.itemCount_ = 0;
    this.updateShape_();
  },
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    return container;
  },
  domToMutation: function(xmlElement) {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10) || 0;
    this.updateShape_();
  },
  updateShape_: function() {
    const waveOptions = [["Sine", "SINE"], ["Square", "SQUARE"], ["Saw", "SAW"], ["Triangle", "TRIANGLE"]];
    for (let i = 1; i <= this.itemCount_; i++) {
      if (!this.getInput('PARTIAL' + i)) { // Use PARTIALx for consistency with legacy XML if needed, or adjust to WAVE/RATIO
        this.appendDummyInput('ROW' + i)
            .appendField("波形")
            .appendField(new Blockly.FieldDropdown(waveOptions), 'WAVE' + i)
            .appendField("頻率倍率")
            .appendField(new Blockly.FieldTextInput("1.0"), 'RATIO' + i)
            .appendField("振幅")
            .appendField(new Blockly.FieldTextInput("0.5"), 'AMP' + i);
      }
    }
    // Remove extra rows
    let i = this.itemCount_ + 1;
    while (this.getInput('ROW' + i)) {
      this.removeInput('ROW' + i);
      i++;
    }
  }
};
