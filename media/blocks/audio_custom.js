/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Custom Sound Source Blocks (Harmonic & Additive)
 */

// --- HARMONIC SYNTH MUTATOR ---
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

// Register Blocks
Blockly.common.defineBlocksWithJsonArray([
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
    "type": "audio_create_harmonic_synth",
    "message0": "%{BKY_AUDIO_CREATE_HARMONIC_SYNTH}",
    "args0": [{ "type": "field_input", "name": "NAME", "text": "MyHarmonic" }],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#E74C3C",
    "tooltip": "建立基於整數倍頻率的合成器。按右鍵選擇「說明」查看諧波原理。",
    "helpUrl": window.docsBaseUri + "custom_synth_zh-hant.html",
    "mutator": "harmonic_mutator"
  },
  // --- ADDITIVE SYNTH ---
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
    "type": "audio_create_additive_synth",
    "message0": "%{BKY_AUDIO_CREATE_ADDITIVE_SYNTH}",
    "args0": [{ "type": "field_input", "name": "NAME", "text": "MyAdditive" }],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#E74C3C",
    "tooltip": "自由設定多個振盪器疊加音色。按右鍵選擇「說明」查看加法合成原理。",
    "helpUrl": window.docsBaseUri + "custom_synth_zh-hant.html",
    "mutator": "additive_mutator"
  }
]);

Blockly.Extensions.registerMutator('harmonic_mutator', HARMONIC_PARTIALS_MUTATOR, undefined, ['sb_harmonic_partial_item']);

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
          .appendField(new Blockly.FieldNumber(1, 0.1, 20), "RATIO" + i)
          .appendField("振幅")
          .appendField(new Blockly.FieldNumber(0.5, 0, 1), "AMP" + i);
      
      if (fieldValues[i-1]) {
        this.setFieldValue(fieldValues[i-1].wave, 'WAVE' + i);
        this.setFieldValue(fieldValues[i-1].ratio, 'RATIO' + i);
        this.setFieldValue(fieldValues[i-1].amp, 'AMP' + i);
      }
    }
  }
};
Blockly.Extensions.registerMutator('additive_mutator', ADDITIVE_SYNTH_MUTATOR, undefined, ['sb_additive_synth_item']);