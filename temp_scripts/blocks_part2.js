
// --- INSTRUMENT CONTAINER SYSTEM ---

Blockly.Blocks['sb_instrument_container'] = {
  init: function() {
    let msg = Blockly.Msg['SB_INSTRUMENT_CONTAINER_MESSAGE'] || "定義樂器 %1 %2";
    this.appendDummyInput()
        .appendField("定義樂器")
        .appendField(new Blockly.FieldTextInput("MySynth"), "NAME");
    this.appendStatementInput("STACK")
        .setCheck(null);
    this.setColour(230); // Audio color
    this.setTooltip(Blockly.Msg['SB_INSTRUMENT_CONTAINER_TOOLTIP'] || "樂器定義容器。請在內部放置波形、ADSR 等設定積木。");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['sb_set_adsr'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("設定 ADSR");
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
    this.setColour(230);
    this.setTooltip("設定此樂器的 ADSR 包絡線 (0.0 ~ 1.0+)。");
  }
};

Blockly.Blocks['sb_set_wave'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("設定波形")
        .appendField(new Blockly.FieldDropdown([
          ["Sine", "SINE"], 
          ["Square", "SQUARE"], 
          ["Triangle", "TRIANGLE"], 
          ["Sawtooth", "SAW"]
        ]), "TYPE");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("設定此樂器的基本波形。");
  }
};
