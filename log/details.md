開發過程遇到的問題與解決方法、關鍵技術細節（踩過的坑）

 * Java 字串比較：logic_compare 已修正，偵測到字串時必須產生 .equals() 而非 ==。
 * Minim 混音：多個音源必須先 patch 到 Summer 物件，再 patch 到 ADSR，否則只有最後一個音源有聲。
 * Webview 插件 (Field Multiline)：
   - 問題：Blockly 插件若使用 ES Module (`export`) 語法，在 Webview 的 `<script>` 標籤中會導致錯誤。
   - 解決：移除了 `export`，改為將類別掛載到 `window` 全域物件。
   - 註冊陷阱：雖然 `main.js` 有手動註冊，但最佳實踐是讓插件「自我註冊」。已在 `field-multilineinput.js` 末端加入 `Blockly.fieldRegistry.register`，確保載入即註冊，避免時序問題。

## Blockly 視覺擴充 (2026-01-13)

### 1. 積木發光效果 (Block Glow)
- **問題**：`setGlowBlock` 與 `setHighlighted` 在最新版或特定主題下效果不明顯或無效。
- **解決方案**：直接操作 SVG 元素並使用 CSS Filter。
    - 在 `style.css` 定義 `.blockly-conflict-glow > .blocklyPath { filter: drop-shadow(...) }`。
    - 在 JS 中透過 `block.getSvgRoot().classList.add()` 手動掛載。
- **注意**：必須使用 `!important` 確保濾鏡不被 Blockly 的內建渲染樣式蓋掉。

### 2. 帽子積木 (Hat Block) 的產生器陷阱
- **問題**：Blockly 的產生器通常是從一個「入口」積木開始串接。獨立的帽子積木若不接在 `setup` 裡，預設不會被掃描到。
- **解決方案**：在 `generateAndSendCode` 階段改用 `workspace.getTopBlocks(true)` 遍歷所有頂層積木，強迫每個積木都執行一次 `blockToCode`。

### 3. Java 事件注入 (Java Event Injection)
- **細節**：Processing 的 `void keyPressed()` 是全域唯一的。
- **對策**：在 `ui_key_event` 產生器中加入 `if (!Blockly.Processing.definitions_['Helpers'])` 檢查，確保框架只被建立一次，後續所有積木僅將代碼 push 到全域陣列中，最後由 `_core.js` 的 `finish()` 進行字串取代。

## Windows 資源管理與鎖定 (2026-01-29)

### 1. Windows Junction (資料夾連結) 鎖定問題
- **現象**：在同一暫存目錄反覆刪除/建立 Junction 會導致 `ENOENT` 或 `EPERM` 錯誤（因為系統還沒釋放 File Handle）。
- **對策**：改採「執行空間原生化」。每次點擊執行時，直接在使用者專案目錄下寫入 `.pde` 並啟動。這避開了在 `Temp` 頻繁操作連結的風險。

### 2. Processing 原生命名限制
- **規則**：`.pde` 主檔案名稱必須與資料夾名稱完全一致，且不可包含點號 `.` 或特殊字元。
- **實作**：引入 `_sanitizeProjectName`，強制過濾使用者輸入的非法字元，將其轉為底線，確保 100% 可執行。

### 3. 資源層級合併 (Hierarchical Asset Merging)
- **需求**：同時支持系統內建取樣庫（在 Plugin 裡）與使用者自訂資源（在專案裡）。
- **方案**：執行時，Extension Host 遞迴向上搜尋最近的 `data` 資料夾作為「使用者資源」。先連結使用者資源到執行目錄，再補上內建庫中缺少的分類子目錄。注意：必須先連結使用者資料，否則內建資料會佔用掛載點。

### 4. Blockly 產生器註冊相容性
- **問題**：在使用新版 `generator.forBlock` 註冊時，有時會報 `generator does not know how to generate code`。
- **方案**：採用「強效註冊」模式，同時寫入 `Blockly.Processing.forBlock['id']` 與 `Blockly.Processing['id']`，確保相容性。
