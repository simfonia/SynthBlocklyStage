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

    // Category Keys
    "CAT_STRUCTURE": "Structure",
    "CAT_LOGIC": "Logic",
    "CAT_LOOPS": "Loops",
    "CAT_MATH": "Math",
    "CAT_TEXT": "Text",
    "CAT_LISTS": "Lists",
    "CAT_VARIABLES": "Variables",
    "CAT_FUNCTIONS": "Functions",
    "CAT_TOOLS": "Tools",
    "CAT_LIVE_SHOW": "Live Show",
    "CAT_SOUND_SOURCES": "Sound Sources",
    "CAT_INSTRUMENT_CONTROL": "Instrument Control",
    "CAT_PERFORMANCE": "Performance",
    "CAT_MIDI": "MIDI",
    "CAT_SERIAL": "Serial",
    "CAT_VISUAL": "Visuals",
    "CAT_UI": "UI Control",

    // Live Show Blocks
    "LIVE_SET_PARAM": "Set stage param %1 to %2",
    "LIVE_GET_PARAM": "Stage param %1",
    "LIVE_PARAM_WAVE_SCALE": "Wave Scale",
    "LIVE_PARAM_TRAIL_ALPHA": "Trail Alpha",
    "LIVE_PARAM_FG_HUE": "FG Color Hue",
    "LIVE_PARAM_MASTER_GAIN": "Master Gain",
    "LIVE_PARAM_TRANSPOSE": "Transpose",
    "LIVE_PARAM_ADSR_A": "Envelope A",
    "LIVE_PARAM_ADSR_D": "Envelope D",
    "LIVE_PARAM_ADSR_S": "Envelope S",
    "LIVE_PARAM_ADSR_R": "Envelope R",

    // Serial Blocks
    "SERIAL_INIT": "Init Serial Port Index %1 Baud %2",
    "SERIAL_AVAILABLE": "Serial Data Available?",
    "SERIAL_READ_STRING": "Read String until Newline",
    "SERIAL_DATA_RECEIVED": "When Serial data received %1 store in %2 %3",
    "SERIAL_CHECK_MASK": "Check Mask %1 for Key %2",

    // Tools Blocks
    "TOOLS_COMMENT": "Comment %1",

    // Visual Blocks
    "VISUAL_STAGE_SETUP_TITLE": "Setup Stage",
    "VISUAL_STAGE_SETUP_DIMENSIONS": "Dimensions: Width %1 Height %2",
    "VISUAL_STAGE_SETUP_APPEARANCE": "Appearance: BG %1   FG %2",
    "VISUAL_STAGE_SETUP_SETTINGS": "Options: Wave %1   |   Spec %2   |   Log %3   |   MIDI %4",
    "VISUAL_STAGE_SET_COLOR": "Set stage %1 color to %2",
    "AUDIO_CREATE_SYNTH_INSTRUMENT": "Create Synth Instrument Name %1 Type %2",
    "AUDIO_CREATE_HARMONIC_SYNTH": "Create Harmonic Synth Name %1",
    "AUDIO_CREATE_ADDITIVE_SYNTH": "Create Additive Synth Name %1",
    "AUDIO_HARMONIC_FIELD": "%1x Harmonic Amplitude (0-1) %2",
    "AUDIO_ADDITIVE_FIELD": "Wave %1 Freq Ratio %2 Amp %3",
    "AUDIO_SELECT_INSTRUMENT": "Select Instrument %1",
    "AUDIO_PLAY_NOTE": "Synth Start Pitch %1 Velocity %2",
    "AUDIO_STOP_NOTE": "Synth Stop (MIDI %1)",
    "MIDI_OFF_NOTE": "When MIDI Note OFF %1 %2 Channel %3 Pitch %4 Velocity %5 %6 %7",
    "VISUAL_STAGE_BG": "Background",
    "VISUAL_STAGE_WAVE": "Waveform",

    // Processing Structure Blocks
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
    "TOOLS_HUE": "#6a8871",
    "LIVE_SHOW_HUE": "#2C3E50",
    "SOUND_SOURCES_HUE": "#E74C3C",
    "INSTRUMENT_CONTROL_HUE": "#D22F73",
    "PERFORMANCE_HUE": "#E67E22",
    "MIDI_HUE": "#5B67E7",
    "SERIAL_HUE": "#2c3e50",
    "UI_HUE": "#FFB300",
    "VISUAL_HUE": "#3498DB",

    "BKY_CONTROLS_DO": "do",
  });
})(Blockly);