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

    // Category Keys
    "CAT_STRUCTURE": "程式結構",
    "CAT_LOGIC": "邏輯判斷",
    "CAT_LOOPS": "迴圈控制",
    "CAT_MATH": "數學運算",
    "CAT_TEXT": "文字處理",
    "CAT_LISTS": "列表處理",
    "CAT_VARIABLES": "變數管理",
    "CAT_FUNCTIONS": "自訂函式",
    "CAT_TOOLS": "工具",
    "CAT_LIVE_SHOW": "即時表演",
    "CAT_SOUND_SOURCES": "音源建立",
    "CAT_INSTRUMENT_CONTROL": "樂器控制",
    "CAT_PERFORMANCE": "音樂演奏",
    "CAT_MIDI": "MIDI 通訊",
    "CAT_SERIAL": "序列埠通訊 (Serial)",
    "CAT_EFFECTS": "音訊效果器",
    "CAT_UI": "介面控制 (UI)",
    "CAT_VISUAL": "視覺繪圖",

    // Effect Blocks
    "SB_SETUP_EFFECT_MESSAGE": "設定效果器 類型 %1",
    "SB_EFFECT_FILTER_TYPE_FIELD": "濾波器 (Filter)",
    "SB_EFFECT_DELAY_TYPE_FIELD": "延遲 (Delay)",
    "SB_EFFECT_BITCRUSH_TYPE_FIELD": "位元破壞 (BitCrush)",
    "SB_EFFECT_FILTER_INTERNAL_TYPE_FIELD": "模式",
    "SB_EFFECT_FILTER_FREQ_FIELD": "頻率",
    "SB_EFFECT_FILTER_Q_FIELD": "共振 (Q)",
    "SB_EFFECT_DELAY_TIME_FIELD": "延遲時間 (秒)",
    "SB_EFFECT_FEEDBACK_FIELD": "回饋 (Feedback)",
    "SB_EFFECT_BITDEPTH_FIELD": "位元深度 (Bits)",

    // Tools Blocks
    "LIVE_SET_PARAM": "設定舞台參數 %1 為 %2",
    "LIVE_GET_PARAM": "舞台參數 %1",
    "LIVE_PARAM_WAVE_SCALE": "波形縮放 (waveScale)",
    "LIVE_PARAM_TRAIL_ALPHA": "殘影透明度 (trailAlpha)",
    "LIVE_PARAM_FG_HUE": "前景顏色 (fgHue)",
    "LIVE_PARAM_MASTER_GAIN": "主音量 (masterGain)",
    "LIVE_PARAM_TRANSPOSE": "移調 (pitchTranspose)",
    "LIVE_PARAM_ADSR_A": "包絡線 A (adsrA)",
    "LIVE_PARAM_ADSR_D": "包絡線 D (adsrD)",
    "LIVE_PARAM_ADSR_S": "包絡線 S (adsrS)",
    "LIVE_PARAM_ADSR_R": "包絡線 R (adsrR)",

    // Serial Blocks
    "SERIAL_INIT": "初始化序列埠 索引 %1 波特率 %2",
    "SERIAL_AVAILABLE": "序列埠有新資料？",
    "SERIAL_READ_STRING": "讀取字串直到換行",
    "SERIAL_DATA_RECEIVED": "當收到序列埠資料時 %1 存入變數 %2 %3",
    "SERIAL_CHECK_MASK": "檢查位元遮罩 %1 是否包含鍵碼 %2",

    // Tools Blocks
    "TOOLS_COMMENT": "註解 %1",

    // Visual Blocks
    "VISUAL_STAGE_SETUP_TITLE": "建立表演舞台",
    "VISUAL_STAGE_SETUP_DIMENSIONS": "尺寸： 寬 %1 高 %2",
    "VISUAL_STAGE_SETUP_APPEARANCE": "外觀： 背景 %1   前景 %2",
    "VISUAL_STAGE_SETUP_SETTINGS": "設定： 波形 %1   |   頻譜 %2   |   日誌 %3   |   MIDI %4",
    "VISUAL_STAGE_SET_COLOR": "設定舞台 %1 顏色為 %2",
    "AUDIO_CREATE_SYNTH_INSTRUMENT": "建立合成器樂器 名稱 %1 類型 %2",
    "AUDIO_CREATE_HARMONIC_SYNTH": "建立諧波合成音源 名稱 %1",
    "AUDIO_CREATE_ADDITIVE_SYNTH": "建立自訂合成音源 名稱 %1",
    "AUDIO_HARMONIC_FIELD": "%1 倍頻 振幅 (0-1) %2",
    "AUDIO_ADDITIVE_FIELD": "波形 %1 頻率倍率 %2 振幅 %3",
    "AUDIO_SELECT_INSTRUMENT": "選取目前樂器為 %1",
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
    "TOOLS_HUE": "#6a8871",
    "LIVE_SHOW_HUE": "#2C3E50",
    "SOUND_SOURCES_HUE": "#E74C3C",
    "INSTRUMENT_CONTROL_HUE": "#D22F73",
    "PERFORMANCE_HUE": "#E67E22",
    "MIDI_HUE": "#5B67E7",
    "SERIAL_HUE": "#2c3e50",
    "UI_HUE": "#FFB300",
    "VISUAL_HUE": "#3498DB",

    // Processing Structure Blocks
    "BKY_PROCESSING_SETUP_MSG_ANGEL": "當程式啟動時 (setup)",
    "BKY_PROCESSING_DRAW_MSG_ANGEL": "重複執行 (draw)",
    
    "PROCESSING_SETUP_TOOLTIP": "setup() 在程式開始時執行一次。用於設定視窗大小、初始化樂器與變數。",
    "PROCESSING_DRAW_TOOLTIP": "draw() 會不斷重複執行（預設每秒 60 次）。用於更新視覺動畫與處理即時互動。",

    // Math Property Checks
    "MATH_IS_EVEN": "是偶數",
    "MATH_IS_ODD": "是奇數",
    "MATH_IS_WHOLE": "是整數",
    "MATH_IS_POSITIVE": "是正數",
    "MATH_IS_NEGATIVE": "是負數",
    "MATH_IS_DIVISIBLE_BY": "可被整除",

    // Common
    "BKY_CONTROLS_DO": "執行",
  });
})(Blockly);