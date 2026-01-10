(function (Blockly) {
  Blockly.Msg = Blockly.Msg || {};
  Object.assign(Blockly.Msg, {
    // SynthBlockly Stage - English
    
    // Toolbar Tooltips
    "BKY_TOOLBAR_SAVE_TOOLTIP": "Save Project (XML)",
    "BKY_TOOLBAR_SAVE_AS_TOOLTIP": "Save As",
    "BKY_TOOLBAR_CLOSE_TOOLTIP": "Close Workspace",
    "BKY_TOOLBAR_NEW_TOOLTIP": "New Project",
    "BKY_TOOLBAR_OPEN_TOOLTIP": "Open Project",

    // Toolbar Theme Labels
    "BKY_TOOLBAR_ENGINEER_LABEL": "Code",
    "BKY_TOOLBAR_ANGEL_LABEL": "Block",

    // Category Keys
    "CAT_STRUCTURE": "Structure",
    "CAT_LOGIC": "Logic",
    "CAT_LOOPS": "Loops",
    "CAT_MATH": "Math",
    "CAT_TEXT": "Text",
    "CAT_VARIABLES": "Variables",
    "CAT_FUNCTIONS": "Functions",
    "CAT_AUDIO": "Audio (Minim)",
    "CAT_MIDI": "MIDI",
    "CAT_VISUAL": "Visuals",

    // Visual Blocks
    "VISUAL_STAGE_SETUP": "Create Stage %1 Width %2 Height %3 %4 Background %5 Waveform %6 %7 Show Wave %8 Show Spectrum %9 Show Log %10 MIDI In %11",
    "VISUAL_STAGE_SET_COLOR": "Set stage %1 color to %2",
    "VISUAL_STAGE_BG": "Background",
    "VISUAL_STAGE_WAVE": "Waveform",

    // Processing Structure Blocks
    "BKY_PROCESSING_SETUP_MSG_ENGINEER": "void setup()",
    "BKY_PROCESSING_DRAW_MSG_ENGINEER": "void draw()",
    "BKY_PROCESSING_SETUP_MSG_ANGEL": "When program starts (setup)",
    "BKY_PROCESSING_DRAW_MSG_ANGEL": "Repeat (draw)",
    
    "PROCESSING_SETUP_TOOLTIP": "setup() runs once when the program starts.",
    "PROCESSING_DRAW_TOOLTIP": "draw() runs repeatedly to update visuals and audio.",

    "BKY_CONTROLS_DO": "do",
  });
})(Blockly);
