# SynthBlockly Stage 專案開發計畫 (Todo List)

## 專案概述
**SynthBlockly Stage** 是一個 VS Code 擴充功能，結合了 **Blockly** 視覺化程式設計與 **Processing (Java)** 的強大效能。專為即時音樂表演與互動視覺藝術設計，提供使用者「積木即程式碼」的創作體驗。
本專案是 #SynthBlockly 專案的桌面版，它已經非常完整，所以目標是對齊它，裏面已有我們需要的所有程式邏輯。

## 開發核心規範 (沿用成功經驗)
- **來自 piBlockly**: 
    - 動態模組載入架構 (`module_loader.js` + `manifest.json`)。
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
- [x] **1-2. Webview 與 Blockly 核心整合**
- [x] **1-3. 實作 Processing (Java) 產生器核心**
    - [x] 定義 `Blockly.Processing` 產生器。
    - [x] 實作基礎積木產生邏輯 (數字, 邏輯, 變數, 迴圈, 文字, 列表, 函式)。
    - [x] **關鍵修復**: 實作變數自動宣告機制、索引 1-based 轉換。
- [x] **1-4. 開發執行引擎 (Execution Engine)**
- [x] **1-5. 完成 drum 範例測試**

### 階段二：介面優化與專案管理
- [x] **2-1. 重構工具列 UI**
    - [x] 全面替換為 PNG 圖示並實作動態 Hover 變色。
    - [x] 更新 VS Code 工作列 Run/Stop 圖示。
- [x] **2-2. 完善檔案管理系統**
    - [x] 實作「另存新檔」：自動建立同名資料夾並同步存入 .xml 與 .pde。
    - [x] 實作「髒狀態 (Dirty State)」監控：精確偵測變動並於工具列顯示狀態。
    - [x] 實作「原生安全檢查」：解決 Webview 沙盒限制，使用 VS Code 視窗進行存檔確認。
    - [x] 實作「自動存檔」：2 秒防抖背景備份。
    - [x] 實作「專案名稱顯示」：工具列顯示檔名，懸停顯示完整路徑。
    - [x] **安全性**：實作範例路徑保護，防止自動儲存覆寫內建範例。
- [x] **2-3. 強化日誌系統**
    - [x] 在舞台 (Processing) 端實作雙層分類日誌 (Alerts/Console)。
    - [x] 實作執行期 MIDI SCAN 與動態裝置切換選單。
- [x] **2-4. 架構清理**
    - [x] 移除雙風格模式，統一為直覺的「Angel 風格」標籤。
    - [x] 產生器模組化，清理 _core.js 中的冗餘代碼。

### 階段三：進階影音積木與功能對齊 (進行中)
- [x] **3-1. 實作「多樂器管理系統」** (對齊 SynthBlockly)
- [x] **3-2. 字串演奏解析器 (String Parser)**
- [x] **3-3. 時序系統與節拍控制 (Transport)**
- [x] **3-4. 繪圖積木擴充**
- [x] **3-5. 效果器與音訊引擎大升級 (Minim 2.2.2 深度對齊)**
    - [x] 支援 Filter (LP/HP/BP), Delay, BitCrush, Waveshaper, Reverb, Flanger。
    - [x] 解決 **Stereo Panning** 訊號鏈位置問題。
    - [x] 實作 **Auto-Filter** (自動掃頻) 與 **Pitch-Mod** (音高調變)。
    - [x] **反射更新機制**: 確保參數即時更新與 Minim 版本相容性。
- [x] **3-6. 實作「混合音源 (Mixed Source)」**：支援 Wave + Noise 同步混音與動態平衡。

### 階段四：互動與通訊
- [x] **4-1. MIDI 深度支援**
    - [x] 增加：控制變更 (Control Change, CC) 監聽，用以對接實體旋鈕。
- [x] **4-2. Serial (Arduino) 串接**
    - [x] 實作：`Serial.list()`, `Serial.readString()`。
    - [x] 實作 bitmask 檢查積木 (對齊 SynthBlockly)。
    - [x] 實作 `Serial.write` 支援反向控制。

### 階段五：教學導向 (PBL) 整理
- [ ] **5-1. 實作「範例載入系統」** (工具列按鈕與選單)。
- [x] **5-2. 撰寫積木使用指南 (HelpUrl)**：已完成中英文說明文件，支援 Lo-Fi 製作指南。
- [ ] **5-3. 範例遷移與建立**
    - [x] 完成 `ex_03_Rock`。
    - [x] 完成 `ex_08_Step_Sequencer_V2` 修復。
    - [ ] 遷移備份中的「光控 Wah-wah」範例。

---

## 技術規範提醒
- **變數處理**: 必須使用 `Blockly.Processing.nameDB_.getName` 並強制特定音樂變數（如 `pitch`）為原名。
- **Java 強型別**: 產生器必須自動處理 `float`, `int`, `boolean` 的全域宣告。
- **訊號鏈順序**: 樂器級效果必須接在 `Summer` 之後，`Pan` 之前，以確保立體聲輸出穩定。