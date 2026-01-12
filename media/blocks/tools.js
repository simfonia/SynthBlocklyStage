/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Utility blocks for note-taking and PBL support.
 */

Blockly.defineBlocksWithJsonArray([
  {
    "type": "sb_comment",
    "message0": "%{BKY_TOOLS_COMMENT}",
    "args0": [
      {
        "type": "field_multilinetext",
        "name": "TEXT",
        "text": ""
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#6a8871",
    "tooltip": "在程式中加入多行文字註解，不會產生任何程式碼。"
  }
]);
