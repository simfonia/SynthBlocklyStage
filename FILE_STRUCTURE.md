# SynthBlockly Stage 檔案結構指南

## 核心開發目錄

### 1. 擴充功能後端 (`src/`)
*   **`extension.ts`**: 擴充功能進入點。負責 Webview 生命週期、Processing 程序的啟動與監控、以及執行前的資源掛載 (Junctions)。

### 2. Webview 前端控制 (`media/`)
*   **`main.js`**: 前端模組化進入點，協調各模組初始化。
*   **`blockly_manager.js`**: 負責 Blockly 的注入、主題設定、XML 讀寫與代碼產生邏輯。
*   **`vscode_bridge.js`**: 負責 Webview 與 VS Code 之間的通訊、對話框橋接與外部連結攔截。
*   **`event_handlers.js`**: 負責 UI 按鈕事件、工作區變更監聽、自動存檔觸發與狀態更新。
*   **`utils.js`**: 通用工具庫。包含 Polyfills、按鍵衝突偵測、孤兒積木檢查、顏色轉換及 Mutator 共用邏輯。
*   **`toolbox.xml`**: 定義 Blockly 工具箱的分類與積木排列結構。
*   **`zh-hant.js` / `en.js`**: 語系定義檔，包含所有積木標籤與 UI 文字。

### 3. 積木與產生器模組 (`media/blocks/` & `media/generators/`)
*   **核心框架**:
    *   **`generators/_core.js`**: 產生器核心。定義 Java PDE 的組合框架（Setup/Draw/Imports/Vars）。
    *   **`generators/java_libs.js`**: Java 代碼模板庫。存放在 PDE 中使用的自訂 UGen 類別與音樂輔助函式。
*   **音訊模組** (`audio_core.js`, `audio_performance.js`, `audio_effects.js`):
    *   負責音訊引擎初始化、樂器容器、演奏指令、音序器及各種效果器設定。
*   **視覺模組** (`visual_core.js`, `visual_geometry.js`, `visual_transform.js`):
    *   負責超級舞台設定、幾何形狀繪製、以及座標變換系統。
*   **其他通訊與工具**:
    *   `serial.js`, `midi.js`, `ui.js`: 負責硬體通訊與超級舞台的介面控制。
    *   `structure.js`, `math.js`, `text.js`, `logic.js`: 基礎編程積木。

### 4. 專案紀錄與規範 (`log/`)
*   **`todo.md`**: 任務清單與開發進度追蹤。
*   **`handover.md`**: 跨對話開發任務交接紀錄。
*   **`details.md`**: 關鍵技術實作細節與「踩過的坑」。
*   **`spec.md`**: 專案技術規範、別名對照表與開發約定。
*   **`work/`**: 每日開發日誌，詳細紀錄異動內容。

---

## 支援與靜態資源

*   **`docs/`**: 專案官方文件。包含 `system_spec.html` (系統規格說明書)。
*   **`examples/`**: 內建教學範例庫 (ex_00 ~ ex_15)。每個範例包含 `.xml` 專案檔及 `Arduino.ino` 韌體代碼。
*   **`media/docs/`**: 積木說明文件 (HTML)，供使用者右鍵點擊「說明」時查看。
*   **`media/samples/`**: 內建音訊取樣庫（鋼琴、小提琴、電子鼓等）。
*   **`media/blockly/`**: Blockly 核心函式庫與必要插件 (FieldColour, MultilineInput)。
*   **`media/icons/`**: 工具列所使用的介面圖示。
*   **`processing-3.5.4/`**: 內置的 Processing 執行環境（用於無安裝環境下的執行支援）。
*   **`node_modules/`**: 擴充功能相依的 Node.js 套件。
*   **`backup/`**: 自動產生的代碼與設定備份。
*   **專案設定檔**: `package.json` (擴充功能宣告), `tsconfig.json` (TS 編譯配置), `GEMINI.md` (AI 開發規範)。
