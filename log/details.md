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