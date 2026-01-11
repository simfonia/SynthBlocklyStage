(function (Blockly) {
  Blockly.Msg = Blockly.Msg || {};
  Object.assign(Blockly.Msg, {
    // SynthBlockly Stage - Traditional Chinese
    
    // Toolbar Tooltips
    "BKY_TOOLBAR_SAVE_TOOLTIP": "儲存專案 (XML)",
    "BKY_TOOLBAR_SAVE_AS_TOOLTIP": "另存專案",
    "BKY_TOOLBAR_CLOSE_TOOLTIP": "關閉工作區",
    "BKY_TOOLBAR_NEW_TOOLTIP": "建立新專案",
    "BKY_TOOLBAR_OPEN_TOOLTIP": "開啟專案",

    // Toolbar Theme Labels
    "BKY_TOOLBAR_ENGINEER_LABEL": "Code",
    "BKY_TOOLBAR_ANGEL_LABEL": "Block",

    // Category Keys
    "CAT_STRUCTURE": "程式結構",
    "CAT_LOGIC": "邏輯判斷",
    "CAT_LOOPS": "迴圈控制",
    "CAT_MATH": "數學運算",
    "CAT_TEXT": "文字處理",
    "CAT_LISTS": "列表處理",
    "CAT_VARIABLES": "變數管理",
    "CAT_FUNCTIONS": "自訂函式",
    "CAT_AUDIO": "音訊合成 (Minim)",
    "CAT_MIDI": "MIDI 通訊",
    "CAT_SERIAL": "序列埠通訊 (Serial)",
    "CAT_UI": "介面控制 (UI)",
    "CAT_VISUAL": "視覺繪圖",

    // Visual Blocks
    "VISUAL_STAGE_SETUP_TITLE": "建立表演舞台",
    "VISUAL_STAGE_SETUP_DIMENSIONS": "尺寸： 寬 %1 高 %2",
    "VISUAL_STAGE_SETUP_APPEARANCE": "外觀： 背景 %1   前景 %2",
    "VISUAL_STAGE_SETUP_SETTINGS": "設定： 波形 %1   |   頻譜 %2   |   日誌 %3   |   MIDI %4",
    "VISUAL_STAGE_SET_COLOR": "設定舞台 %1 顏色為 %2",
    "AUDIO_PLAY_NOTE": "合成器開始發聲 音高 %1 力度 %2",
    "AUDIO_STOP_NOTE": "合成器停止發聲 (MIDI %1)",
    "MIDI_OFF_NOTE": "當收到 MIDI 音符 OFF %1 %2 頻道 %3 鍵號 %4 力度 %5 %6 %7",
    "VISUAL_STAGE_BG": "背景",
    "VISUAL_STAGE_WAVE": "波形",

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

    // Processing Structure Blocks
    // Engineer (Code Mode)
    "BKY_PROCESSING_SETUP_MSG_ENGINEER": "void setup()",
    "BKY_PROCESSING_DRAW_MSG_ENGINEER": "void draw()",
    // Angel (Block Mode)
    "BKY_PROCESSING_SETUP_MSG_ANGEL": "當程式啟動時 (setup)",
    "BKY_PROCESSING_DRAW_MSG_ANGEL": "重複執行 (draw)",
    
    "PROCESSING_SETUP_TOOLTIP": "setup() 在程式開始時執行一次。用於設定視窗大小、初始化樂器與變數。",
    "PROCESSING_DRAW_TOOLTIP": "draw() 會不斷重複執行（預設每秒 60 次）。用於更新視覺動畫與處理即時互動。",

    // Common
    "BKY_CONTROLS_DO": "執行",
  });
})(Blockly);