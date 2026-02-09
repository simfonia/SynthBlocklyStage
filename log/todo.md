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
- [x] **1-4. 開發執行引擎 (Execution Engine)**
- [x] **1-5. 完成 drum 範例測試**

### 階段二：介面優化與專案管理
- [x] **2-1. 重構工具列 UI**
- [x] **2-2. 完善檔案管理系統**
- [x] **2-3. 強化日誌系統**
- [x] **2-4. 架構清理**

### 階段三：進階影音積木與功能對齊
- [x] **3-1. 實作「多樂器管理系統」**
- [x] **3-2. 字串演奏解析器 (String Parser)**
- [x] **3-3. 時序系統與節拍控制 (Transport)**
- [x] **3-4. 繪圖積木擴充**
- [x] **3-5. 效果器與音訊引擎大升級 (Minim 2.2.2 深度對齊)**
- [x] **3-6. 實作「混合音源 (Mixed Source)」**
- [x] **3-7. 智慧型動態參數查找**
    - [x] 實作 `sb_set_effect_param` 聯動功能。
    - [x] 支援 ADSR 與多種效果器動態下拉選單。
- [x] **3-8. 演奏與即時觸發優化**
    - [x] 為持續音積木加入樂器選擇選單。
    - [x] 擴充 PC 鍵盤事件支援「放開 (Released)」偵測。
    - [x] 統一即時演奏積木視覺風格。

### 階段四：互動與通訊
- [x] **4-1. MIDI 深度支援**
- [x] **4-2. Serial (Arduino) 串接**
    - [x] 實作：`Serial.list()`, `Serial.readString()`。
    - [x] 實作 bitmask 檢查積木。
    - [x] 實作 `Serial.write` 支援反向控制。
    - [x] **穩定性強化**: 加入 `bufferUntil('\n')` 並在舞台端同步優化。

### 階段五：教學導向 (PBL) 整理
- [x] **5-1. 實作「範例載入系統」**。
- [x] **5-2. 撰寫積木使用指南 (HelpUrl)**。
- [x] **5-3. 範例遷移與建立**
    - [x] 完成 `ex_11_Serial_KICK`。
    - [x] 完成 `ex_12_wah_wah` (光控濾波)。
    - [x] 完成 `ex_13_Chord_Pad` (字串解析版)。
    - [x] 完成 `ex_14_Drum_Pad`。
    - [x] 舊範例 XML ID 全面更新為 `sb_` 結構。
- [x] **5-4. 起始樣板系統**
    - [x] 定義 `ex_00_play.xml` 為預設啟動樣板。
    - [x] 修正新專案「Saved」狀態誤報問題。

### 階段六：硬體整合 (Launchpad S)
- [x] **6-1. 規劃與文件**
    - [x] 閱讀 Programmers Reference Manual 並建立開發手冊 (`media/docs/launchpad/開發手冊.html`)。
    - [x] 規劃 MIDI 傳送積木 (`midi_send_note`, `midi_send_cc`)。
- [x] **6-2. 積木實作**
    - [x] 實作 MIDI Send 相關積木與產生器。
    - [x] 將 `midi_on_controller_change` 加入工具箱。
    - [x] 更新多語系定義。
- [x] **6-3. 範例製作**
    - [x] 製作 Launchpad 互動範例 (`ex_92_LaunchPad.xml`)。

### 階段七：效能極限優化與穩定性
- [x] **7-1. 音訊迴圈物件分配優化**：重構 `SBSummer` 與 `SBPan` 移除 `uGenerate` 內的暫存陣列，解決高發聲數下的 GC 卡頓。
- [x] **7-2. 破音監控同步化**：修正 Limiter 誤導性 CLIP 警告，實現視覺指示與聽覺失真的 1:1 對齊。
- [x] **7-3. 執行緒安全強化**：引入 `ConcurrentHashMap` 與全路徑類別宣告，消除多音軌彈奏時的死結風險。

### 階段八：程式碼清理
- [ ] **8-1. 自動測試工具**
    - [ ] 8-1-1. 建立 Node.js Headless Blockly 產碼環境。
    - [ ] 8-1-2. 實作批次產碼與 PDE 比對腳本。
- [ ] **8-2. 模組重構與分割**
    - [ ] 8-2-1. 建立 `media/utils.js` 收納通用輔助函式 (Helper Functions)。
    - [ ] 8-2-2. 拆分 `blocks/audio.js` 為 core, performance, effects。
    - [ ] 8-2-3. 拆分 `generators/audio.js` 為對應模組。
    - [ ] 8-2-4. 優化 `module_loader.js` 載入邏輯。

### 待辦與優化
- [ ] **持續優化**：針對複雜樂句的執行緒同步安全強化。


---

## 技術規範提醒
- **變數處理**: 必須使用 `Blockly.Processing.nameDB_.getName` 並強制特定音樂變數（如 `pitch`）為原名。
- **Java 強型別**: 產生器必須自動處理 `float`, `int`, `boolean` 的全域宣告。
- **訊號鏈順序**: 樂器級效果必須接在 `Summer` 之後，`Pan` 之前，以確保立體聲輸出穩定。
- **動態解析**: 在 Serial 事件中修改音訊參數必須使用 `setEffectParam` 以確保執行緒安全與不中斷發聲。