# SynthBlockly Stage 專案開發計畫 (Todo List)

## 專案概述
**SynthBlockly Stage** 是一個 VS Code 擴充功能，結合了 **Blockly** 視覺化程式設計與 **Processing (Java)** 的強大效能。專為即時音樂表演與互動視覺藝術設計，提供使用者「積木即程式碼」的創作體驗。

## 開發核心規範 (沿用成功經驗)
- **來自 piBlockly**: 
    - 動態模組載入架構 (`module_loader.js` + `manifest.json`)。
    - 雙風格主題切換 (Code 模式 vs. Block 模式)。
    - 嚴格的檔案生命週期管理 (.xml 為源頭，.pde 為產物)。
- **來自 SynthBlockly**:
    - 即時音訊視覺化連動邏輯。
    - 高階音訊積木抽象 (Loop, Trigger, Sequence)。
- **本專案特色**:
    - **桌面端效能**: 利用 Minim 庫與 Processing 核心繪圖，達成低延遲、高解析度的影音創作。
    - **PBL 導向**: 開發過程拆解為可學習的單元，強調 TDD 流程。

---

## 任務清單

### 階段一：核心架構與 MVP (最小可行性產品)
- [x] **1-1. 專案環境初始化**
    - 建立 VS Code Extension 骨架 (TS/Node.js)。
    - 配置編譯與偵錯環境 (`launch.json`, `tasks.json`)。
- [x] **1-2. Webview 與 Blockly 核心整合**
    - 建立 `media` 資料夾，導入 `blockly.js` 與 `module_loader.js`。
    - 實作 `src/extension.ts` 動態生成 Webview HTML 與 CSP 處理。
- [x] **1-3. 實作 Processing (Java) 產生器核心**
    - 定義 `Blockly.Processing` 產生器。
    - 實作基礎積木產生邏輯 (數字, 邏輯, 變數, 迴圈)。
    - **關鍵修復**: 實作變數自動宣告機制與禁止 ID 混淆機制。
- [x] **1-4. 開發執行引擎 (Execution Engine)**
    - 實作 `child_process` 調用 `processing-java.exe`。
    - 處理 Windows 平台下的程序樹強制關閉 (`taskkill`)。
    - 支援自動連結 `data` 資料夾以載入音訊樣本。
- [x] **1-5. 完成 drum 範例測試**
    - 實作 Minim 樣本載入與觸發積木。
    - 實作基礎繪圖與 Math Map 積木。
    - 驗證 MIDI 裝置連線與波形繪製。

### 階段二：介面優化與教學功能 (進行中)
- [ ] **2-0. 檔案架構優化 (Refactoring)**
    - 拆分 `src/extension.ts`：建立 `ProcessingManager.ts` 與 `WebviewManager.ts`。
    - 整理 `media` 目錄：建立 `media/js/` 存放 `main.js` 與 `module_loader.js`。
    - 模組化語言包：按功能拆分 `zh-hant.js`（如 `audio_zh.js`, `visual_zh.js`）。
- [ ] **2-1. 實作「範例系統」**
    - 在工具列新增「範例」按鈕。
    - 點擊後列出 `examples` 目錄下的 XML，選取後自動載入。
- [ ] **2-2. 整合多行註解模組**
    - 導入 `field-multilineinput` 插件。
    - 實作「工具/註解」積木，不產生程式碼，方便 PBL 筆記。
- [ ] **2-3. 完善檔案管理**
    - 實作「另存新檔」功能。
    - 實作「髒狀態 (Dirty State)」檢查，關閉前提醒存檔。
- [ ] **2-4. 強化日誌系統**
    - 在 Webview 中加入分類日誌視窗（參考 SynthBlockly 經驗）。
    - 將 Processing 的 `stdout/stderr` 即時回傳並顯示於介面上。

### 階段三：進階影音積木開發
- [ ] **3-1. 繪圖積木擴充**
    - 增加：圓形、多邊形、旋轉 (`rotate`)、座標轉換 (`push/popMatrix`)。
    - 增加：顏色選取器 (整合 `field-colour`)。
- [ ] **3-2. 音訊合成器 (Minim 深度整合)**
    - 實作：`Oscillator` (波形、頻率、振幅控制)。
    - 實作：`ADSR Envelope` 在 Minim 中的對應控制。
    - 實作：常用效果器（`Delay`, `Reverb`）。
- [ ] **3-3. MIDI 深度支援**
    - 增加：Note Off 監聽。
    - **[新增] 實作控制變更 (Control Change, CC) 監聽，用以對接實體旋鈕控制舞台變數。**

### 階段四：互動與通訊 (未來展望)
- [ ] **4-1. Serial (Arduino) 串接**
    - 研究 Processing Serial 庫的積木封裝。
    - 實作：`Serial.list()`, `Serial.readString()`。
    - **範例：LDR 或超音波感測器控制 `waveScale` 或 `trailAlpha` 達到實體互動感。**

### 階段五：教學導向 (PBL) 整理
- [ ] **5-1. 撰寫開發教學文件**
    - 將開發過程中的錯誤與解決方案整理成知識庫。
- [ ] **5-2. 錄製/撰寫積木使用指南**
    - 針對每個分類製作「互動式說明」 (HelpUrl)。

---

## 技術規範提醒
- **變數處理**: 必須使用 `Blockly.Processing.nameDB_.getName` 並強制特定音樂變數（如 `pitch`）為原名。
- **Java 強型別**: 產生器必須自動處理 `float`, `int`, `boolean` 的全域宣告。
- **資源路徑**: 始終使用 `path.join` 處理跨平台路徑問題。