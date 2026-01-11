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
    "CAT_LISTS": "Lists",
    "CAT_VARIABLES": "Variables",
    "CAT_FUNCTIONS": "Functions",
    "CAT_AUDIO": "Audio (Minim)",
    "CAT_MIDI": "MIDI",
    "CAT_SERIAL": "Serial",
    "CAT_VISUAL": "Visuals",

    // Visual Blocks
    "VISUAL_STAGE_SETUP_TITLE": "Setup Stage",
    "VISUAL_STAGE_SETUP_DIMENSIONS": "Dimensions: Width %1 Height %2",
    "VISUAL_STAGE_SETUP_APPEARANCE": "Appearance: BG %1   FG %2",
    "VISUAL_STAGE_SETUP_SETTINGS": "Options: Wave %1   |   Spec %2   |   Log %3   |   MIDI %4",
    "VISUAL_STAGE_SET_COLOR": "Set stage %1 color to %2",
    "AUDIO_PLAY_NOTE": "Synth Start Pitch %1 Velocity %2",
    "AUDIO_STOP_NOTE": "Synth Stop (MIDI %1)",
    "MIDI_OFF_NOTE": "When MIDI Note OFF %1 %2 Channel %3 Pitch %4 Velocity %5 %6 %7",
    "VISUAL_STAGE_BG": "Background",
    "VISUAL_STAGE_WAVE": "Waveform",

    // Processing Structure Blocks
    "BKY_PROCESSING_SETUP_MSG_ENGINEER": "void setup()",
    "BKY_PROCESSING_DRAW_MSG_ENGINEER": "void draw()",
    "BKY_PROCESSING_SETUP_MSG_ANGEL": "When program starts (setup)",
    "BKY_PROCESSING_DRAW_MSG_ANGEL": "Repeat (draw)",
    
    "PROCESSING_SETUP_TOOLTIP": "setup() runs once when the program starts.",
    "PROCESSING_DRAW_TOOLTIP": "draw() runs repeatedly to update visuals and audio.",

    // Hues
    "STRUCTURE_HUE": "#16A085",
    "LOGIC_HUE": "#b198de",
    "LOOPS_HUE": "#7fcd81",
    "MATH_HUE": "#5C68A6",
    "LISTS_HUE": "#745ca6",
    "TEXT_HUE": "#6a8871",
    "VARIABLES_HUE": "#ef9a9a",
    "FUNCTIONS_HUE": "#d22f73",
    "AUDIO_HUE": "#E74C3C",
    "MIDI_HUE": "#5B67E7",
    "SERIAL_HUE": "#2c3e50",
    "UI_HUE": "#FFB300",
    "VISUAL_HUE": "#3498DB",

    "BKY_CONTROLS_DO": "do",
  });
})(Blockly);
