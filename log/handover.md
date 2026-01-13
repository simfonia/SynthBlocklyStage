SynthBlockly Stage 開發交接指令

==================================================
2026-01-12

1. 專案背景與環境設定：
 * 請執行 #processing 指令，將工作目錄切換至 C:\Workspace\SynthBlocklyStage。
 * 優先讀取 FILE_STRUCTURE.md 瞭解目前的模組化架構。
 * 讀取 log/work/2026-01-11.md 之後的所有日誌，特別是 2026-01-12.md，其中記錄了最新的「即時表演」與「Serial
   通訊」實作。
2. 目前進度摘要：
 * 超級舞台 (Super Stage)：已實現動態分割視圖、雙層日誌 (Alerts/Console)、以及隨頻率變化的動態漸層視覺效果。
 * 音訊引擎 (Minim)：已支援多樂器管理 (instrumentMap)。解決了 Minim .patch() 會覆寫前一個連線的 Bug，目前使用 Summer
   UGen 進行加法與諧波合成的混音。
 * 介面功能：工具列已更換為 PNG 圖示並支援 Hover 變色。實作了自動存檔 (2s debounce)、另存新檔
   (自動建立同名資料夾)、以及與 VS Code 原生對話框連動的髒狀態 (Dirty State) 檢查。
 * 說明系統：建立了四份分類說明 HTML，並透過攔截 window.open 轉由 Extension Host 開啟，解決了 Webview 沙盒限制問題。
 * 產生器補齊：邏輯、迴圈、數學、文字、列表、自訂函式、工具 (多行註解) 的產生器已全部補齊並支援 Java 強型別與字串比較
   (.equals)。
3. 待辦任務 (Next Steps)：
 * 對齊 #SynthBlockly 演奏功能：
     1. 實作 字串演奏解析器 (String Parser)：在 Java 端解析 C4Q, E4Q (旋律) 與 x---x--- (節奏) 字串。
     2. 實作 時序系統 (Transport)：在 Java 實作以音樂時值為基礎的 Loop 積木，擺脫對 draw() 幀數的依賴。
 * 範例重寫：參考 08_Serial_KICK 的重寫經驗，將範例 09, 10 與 11 的 XML 內容更新為當前的積木 ID 與結構。
 * Serial 擴充：實作 Serial.write 以支援從超級舞台反向控制 Arduino。

==================================================
2026-01-13

1. 本次已完成事項：
- **按鍵衝突視覺強化**：
    - 實作了 CSS `blockly-conflict-glow` (黃色外發光) 與動態文字提示 `[！已被舞台鋼琴佔用]`。
    - 修正了 `setDisabled` 視覺失效問題（在注入設定中開啟 `disable: true`）。
- **積木架構優化**：
    - 將 `ui_key_event` 徹底轉為獨立的頂層帽子積木。
    - 修正 `main.js` 代碼產生邏輯，確保畫布上所有頂層積木都能被遍歷並產生代碼。
- **Java 產生器修正**：
    - 確保 `void keyPressed()` 框架即使在沒有舞台積木時也能正確注入。
    - 統一按鍵判定變數為 `k`，並修復了 `_core.js` 的佔位符替換失效問題。

2. 待辦任務 (Next Steps)：
- 測試多個自訂按鍵事件的並列產碼是否完全正常。
- 檢查 `keyReleased` 佔位符是否需要同樣的實作。
- 考慮將其他「事件型」積木（如 MIDI 事件）也改為帽子積木。