# 2026-01-11 工作日誌 (V)

## 任務：實作積木說明系統、整合多行註解插件與解決 Webview 沙盒限制

### 1. 積木說明系統 (Documentation System)
- **文檔撰寫**：仿照 #SynthBlockly 風格，建立了四份繁體中文 HTML 說明文件，分別涵蓋音源建立、音樂演奏、表演舞台與進階合成原理。
- **色彩對齊**：文檔主題顏色與積木分類顏色完全一致，提升視覺辨識度。
- **右鍵導引**：更新所有核心積木的 `helpUrl` 與 `tooltip`，引導使用者按右鍵獲取專業說明。

### 2. 關鍵問題：Webview 沙盒限制 (Help Link Fix)
- **問題描述**：Blockly 預設使用 `window.open()` 開啟說明連結，但 VS Code Webview 沙盒會擋掉此動作，並產生 `allow-popups` 錯誤。此外，直接傳遞 Webview 的內部網址 (`vscode-resource://`) 會導致外部瀏覽器報出 `NXDOMAIN` 錯誤。
- **解決方案**：
    - **全域攔截**：在 `media/main.js` 中覆寫 `window.open`，攔截所有開啟視窗的請求。
    - **檔名轉發**：偵測到本地說明檔時，僅傳送「檔案名稱」回 Extension Host。
    - **路徑還原**：在 Extension Host (TS) 中利用 `extensionUri` 將檔名還原為真實的磁碟路徑 (`file://...`)，最後透過 `vscode.env.openExternal` 順利於系統瀏覽器開啟文件。

### 3. 多行註解插件整合 (Multiline Input Plugin)
- **修正 ESM 報錯**：解決了移植插件時出現的 `Unexpected token 'export'` 錯誤。原因在於 Webview 是以普通腳本 (`<script>`) 載入，不支援 ESM 語法。
- **穩定註冊**：調整了 `extension.ts` 的載入順序，確保核心 `blockly.js` 與插件最先載入。在 `main.js` 初始化開端立即執行 `field_multilinetext` 註冊，解決了「找不到 Registry」的問題。

### 4. 基礎產生器補齊與清理
- **補齊常用功能**：實作了 `controls_forEach`、`math_number_property`、`math_round`、`math_constrain` 與 `text_getSubstring` 等產生器。
- **界面簡化**：移除積木清單中未實作的進階功能（如質數判斷、列表排序等），確保「積木即程式碼」的一致性。

## 異動檔案
- `SynthBlocklyStage/src/extension.ts`
- `SynthBlocklyStage/media/main.js`
- `SynthBlocklyStage/media/blocks/visual.js`
- `SynthBlocklyStage/media/blocks/audio.js`
- `SynthBlocklyStage/media/blocks/audio_custom.js`
- `SynthBlocklyStage/media/generators/math.js`
- `SynthBlocklyStage/media/generators/text.js`
- `SynthBlocklyStage/media/generators/loops.js`
- `SynthBlocklyStage/media/docs/` (NEW)
- `SynthBlocklyStage/media/blockly/field-multilineinput.js`
