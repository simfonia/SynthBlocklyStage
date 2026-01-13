# SynthBlockly Stage 檔案結構

## 核心目錄
- `src/`: VS Code 擴充功能 TypeScript 原始碼
    - `extension.ts`: 擴充功能進入點、Webview 管理、Processing 執行控制與資源掛載。
- `media/`: Webview 資源
    - `main.js`: Blockly 初始化、按鍵衝突檢查 (Glow/Text)、插件註冊、主題定義與 VS Code 通訊。
    - `module_loader.js`: 動態載入積木定義與產生器。
    - `style.css`: 工具列、Webview 版面樣式、以及積木衝突發光效果 (CSS Filter)。
    - `docs/`: 積木說明文件 (HTML 格式，支援主題色對齊)。
    - `blockly/`: 第三方 Blockly 套件與插件 (如 field-multilineinput.js)。
    - `icons/`: 介面圖示 (PNG 格式，支援 1F1F1F/FE2F89 顏色切換)。
    - `blocks/`: 積木定義
        - `audio.js`, `audio_custom.js`, `live_show.js`, `serial.js`, `visual.js`, `midi.js`, `structure.js`, `ui.js`, `math.js`, `text.js`, `lists.js`, `variables.js`, `tools.js`
    - `generators/`: Processing (Java) 產生器
        - `_core.js`: 核心架構、變數宣告、輔助函式以及鍵盤事件佔位符替換。
        - `audio.js`, `live_show.js`, `serial.js`, `visual.js`, `midi.js`, `structure.js`, `ui.js`, `math.js`, `text.js`, `lists.js`, `variables.js`, `functions.js`, `tools.js`
- `examples/`: XML 範例專案庫
    - `data/`: 全域共享音訊樣本與資源。
    - `08_Serial_KICK/`, `09_wah-wah/` ... 各式功能範例。
- `log/`: 開發紀錄
    - `todo.md`: 任務進度清單。
    - `work/`: 每日詳細開發日誌。
- `.vscodeignore`: 打包設定檔，已排除大型執行環境以精簡體積。
- `package.json`: 擴充功能配置與指令定義。
- `README.md`: 使用者環境安裝與快速上手指南。