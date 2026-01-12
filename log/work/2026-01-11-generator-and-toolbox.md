# 2026-01-11 工作日誌 (III)

## 任務：工具箱分類重整、補齊基礎產生器與架構清理

### 1. 工具箱與語系優化 (Toolbox & i18n)
- **分類順序重整**：將「程式結構」移至頂端，隨後依序為基礎邏輯（邏輯、迴圈、數學、文字、列表）、變數與函式，最後是表演核心（視覺、音訊、Serial、MIDI、UI）。
- **補齊分類**：新增「文字處理」、「列表處理」、「自訂函式」與「序列埠 (Serial)」分類。
- **修復視覺顏色**：在 `zh-hant.js` 與 `en.js` 中定義缺失的 `MIDI_HUE`、`SERIAL_HUE`、`UI_HUE` 等，確保工具箱色階正確。
- **在地化優化**：修正翻譯中的錯字，並將 "is whole" 統一翻譯為更直覺的「是整數」。

### 2. 產生器模組化與補齊 (Generators Refactor)
- **基礎產生器全實作**：
    - **Logic**：補齊三元運算、邏輯閘、反相、布林值。修正了 `controls_if` 因字串換行導致的 `SyntaxError`。
    - **Loops**：實作 `controls_forEach` (Java Enhanced For Loop)，支援 Java `break/continue` 語法。
    - **Math**：補齊 `math_number_property`、`math_round`、`math_constrain` 等。優化 `map` 函式的浮點數強型別轉換。
    - **Text/Lists**：建立獨立產產生器檔案。列表採用 Java `ArrayList<Object>` 實作，並處理了 Java `substring` 與 `subList` 的索引偏移 (exclusive/inclusive) 問題。
    - **Functions**：實作自訂函式定義與呼叫，自動處理 `void` 與 `float` 回傳型別。
- **核心架構優化**：
    - 在 `_core.js` 加入 `getRelativeIndex` 輔助函式，處理 Blockly (1-based) 與 Java (0-based) 索引轉換。
    - 預設自動加入 `import java.util.*;` 以支援列表運算。
    - 清理 `_core.js`，將內建積木產生器移至專屬模組。
- **載入機制更新**：更新 `manifest.json` 以動態載入所有新建立的產生器模組。

### 3. 架構清理 (Cleanup)
- **移除雙風格模式**：徹底刪除 Angel/Engineer 模式切換邏輯。統一保留直覺的 Angel 風格標籤（如「當程式啟動時」）。
- **精簡積木庫**：從工具箱與產生器中移除未實作或目前不需要的複雜積木（如質數判斷、列表排序、反轉等），確保系統穩定且無報錯。
- **消除主控台警告**：在重新定義 `math_number_property` 前先執行刪除，解決「Overwrites previous definition」警告。

## 異動檔案
- `SynthBlocklyStage/media/core_extension_manifest.json`
- `SynthBlocklyStage/media/toolbox.xml`
- `SynthBlocklyStage/media/zh-hant.js`
- `SynthBlocklyStage/media/en.js`
- `SynthBlocklyStage/media/blocks/structure.js`
- `SynthBlocklyStage/media/blocks/math.js`
- `SynthBlocklyStage/media/generators/_core.js`
- `SynthBlocklyStage/media/generators/logic.js` (NEW)
- `SynthBlocklyStage/media/generators/loops.js` (NEW)
- `SynthBlocklyStage/media/generators/math.js`
- `SynthBlocklyStage/media/generators/text.js` (NEW)
- `SynthBlocklyStage/media/generators/lists.js` (NEW)
- `SynthBlocklyStage/media/generators/functions.js` (NEW)
- `SynthBlocklyStage/src/extension.ts`
