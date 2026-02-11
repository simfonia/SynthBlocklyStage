# SynthBlockly Stage 專案指南

## 專案概述
**SynthBlockly Stage** 是一個結合了 **Blockly** 視覺化程式設計與 **Processing (Java)** 強大效能的 VS Code 擴充功能。它專為即時音樂表演與互動視覺藝術設計，提供使用者「積木即程式碼」的創作體驗。

### 核心技術棧
- **VS Code Extension API**: 擴充功能開發框架。
- **Blockly**: 視覺化積木程式庫。
- **Processing (Java)**: 影音渲染引擎。
  - **Minim**: 核心音訊庫（負責合成、取樣、效果）。
  - **ControlP5**: 表演舞台的 GUI 控制。
  - **TheMidiBus**: MIDI 通訊支援。
- **Node.js**: 擴充功能後端邏輯。

---

## 快速開始

### 環境需求
1.  **Processing v3.5.4**: 必須安裝於系統中（[下載連結](https://processing.org/download/)）。
2.  **Processing 函式庫**: 安裝 `Minim`, `ControlP5`, `TheMidiBus`。
3.  **VS Code**: 開發環境。

### 啟動與執行
1.  在 VS Code 中開啟本專案目錄。
2.  按 `F5` 啟動擴充功能開發主機。
3.  在開發主機中，執行指令 `SynthBlockly Stage: Open Workspace` 開啟工作區。
4.  初次執行需設定 `processing-java.exe` 的路徑（點擊工具列齒輪）。
5.  點擊工具列的「Run」圖示（綠色按鈕）編譯並執行 Processing 舞台。

---

## 專案結構與重要檔案

### 擴充功能核心 (`src/`)
- **`extension.ts`**: 進入點。負責 Webview 管理、檔案系統操作（讀/寫/另存）、啟動 Processing 程序、以及處理資源掛載 (Junctions)。

### Webview 前端 (`media/`)
- **`main.js`**: Webview 進入點。初始化 Blockly、載入模組、處理按鍵衝突偵測 (`checkKeyConflicts`)、並與 Extension Host 通訊。
- **`module_loader.js`**: 依據 `core_extension_manifest.json` 動態載入積木與產生器。
- **`toolbox.xml`**: 定義 Blockly 工具箱的結構與積木分類。

### 積木與產生器 (`media/blocks/`, `media/generators/`)
- **`_core.js`**: **關鍵檔案**。定義 `Blockly.Processing` 產生器核心，包含變數宣告、`setup()`/`draw()` 注入邏輯、以及事件佔位符替換。
- **`audio.js`**: 實作音訊相關積木（合成器、取樣器、演奏器）。
- **`visual.js`**: 實作繪圖與視覺控制積木。
- **`structure.js`**: 實作 Processing 基礎框架（`setup`, `draw`）。

### 日誌與紀錄 (`log/`)
- **`todo.md`**: 任務清單。
- **`handover.md`**: 跨對話任務交接。**每次對話必讀**。
- **`details.md`**: 技術細節與「踩過的坑」。**重要參考**。

---

## 開發規範與慣例

### 程式碼產生慣例
- **Java 強型別**: 產生器必須處理變數宣告，區分 `int`, `float`, `boolean`, `String`。
- **1-based 索引**: Blockly 列表使用 1-based，產生器需自動轉換為 Java 的 0-based。
- **自動宣告**: 變數應透過 `Blockly.Processing.nameDB_.getName` 獲取，並在全域宣告區注入。
- **事件注入**: 帽子積木（如按鍵事件）使用 `definitions_` 佔位符替換機制，將代碼注入到 Processing 的事件函式中。

### 資源管理
- **掛載機制**: 執行時，擴充功能會自動將 `media/samples/` 下的取樣庫以 Junction (Windows) 方式連結到專案的 `data/` 資料夾下。
- **資料保護**: 內建範例 (`examples/`) 受保護，自動存檔功能不會覆寫範例檔案。

### 介面設計
- **髒狀態 (Dirty State)**: 監控 Webview 變動，於工具列顯示狀態並在關閉前提示。
- **自動存檔**: 2 秒防抖 (Debounce) 機制。

### 積木說明文件系統 (Help System)
- **檔案路徑**: 位於 `media/docs/` 下。
- **命名規範**: 格式為 `[id]_[lang].html`。
    - 例如: `effects_zh-hant.html`, `effects_en.html`。
- **積木連結**:
    - 在積木 JSON 定義中設定 `"helpUrl": "[id]"` (不含語系與副檔名)。
    - 系統會依據 `HELP_LANG_SUFFIX` 訊息自動拼接正確的檔案名稱。
- **視覺規範**:
    - 主題色應與積木色彩一致 (Heading `h1` 與左邊框)。
    - `tooltip` 末端應附加 `%{BKY_HELP_HINT}` 以提示使用者可按右鍵查看說明。
- **安全機制**: Webview 內透過攔截 `window.open` 由 Extension Host 使用預設瀏覽器開啟 HTML，避開沙盒限制。

---

## 待辦事項與未來方向
- 持續將舊範例 (`examples/`) 的 XML ID 由 `audio_` 更新為 `sb_`。
- 強化高負載下的音訊穩定性與 Master Limiter。
- 擴充更多複雜的視覺繪圖與數學積木。

---
*本文件由 Gemini CLI 自動生成，作為後續開發之背景上下文。*
