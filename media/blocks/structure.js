/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * @fileoverview Blocks for Processing structure (setup, draw) with dual-theme support.
 */

Blockly.Blocks['processing_setup'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['BKY_PROCESSING_SETUP_MSG_ANGEL'] || "當程式啟動時 (setup)");
    this.appendStatementInput('DO')
        .appendField(Blockly.Msg['BKY_CONTROLS_DO']);
    this.setColour(Blockly.Msg['STRUCTURE_HUE'] || '#16A085');
    this.setTooltip(Blockly.Msg['PROCESSING_SETUP_TOOLTIP']);
    this.setHelpUrl('');
  }
};

Blockly.Blocks['processing_draw'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['BKY_PROCESSING_DRAW_MSG_ANGEL'] || "重複執行 (draw)");
    this.appendStatementInput('DO')
        .appendField(Blockly.Msg['BKY_CONTROLS_DO']);
    this.setColour(Blockly.Msg['STRUCTURE_HUE'] || '#16A085');
    this.setTooltip(Blockly.Msg['PROCESSING_DRAW_TOOLTIP']);
    this.setHelpUrl('');
  }
};

Blockly.Blocks['processing_on_key_pressed'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("當鍵盤按下時 (keyPressed)");
    this.appendStatementInput('DO')
        .appendField(Blockly.Msg['BKY_CONTROLS_DO']);
    this.setColour("#16A085");
    this.setTooltip("當使用者按下鍵盤時執行。可用 key 變數判斷按鍵。");
    this.setHelpUrl('');
  }
};