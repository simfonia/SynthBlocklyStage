# 2026-01-11 工作日誌 (II)

## 任務：重構工具列 UI 與完善專案管理系統

### 1. 工具列視覺升級 (Toolbar UI)
- **圖示格式遷移**：全面將工具列按鈕從 `.svg` 更換為 `.png` 格式。
- **動態 Hover 效果**：實作 JavaScript 邏輯，滑鼠懸停時自動將圖示顏色由黑色 (`1F1F1F`) 切換為桃紅色 (`FE2F89`)。
- **VS Code 標題列優化**：更新 `package.json`，將 Run (綠色) 與 Stop (紅色) 指令圖示更換為自定義 PNG 圖片。
- **環境優化**：移除 `package.json` 中冗餘的 `activationEvents`，符合 VS Code 現代擴充功能規範。

### 2. 專案管理與安全機制 (Project Management)
- **髒狀態 (Dirty State) 監控**：
    - 實作 `isDirty` 邏輯，精確偵測積木結構變更（排除 UI 點擊或捲動）。
    - 在工具列右側新增動態狀態標籤：
        - `○ New Project (unsaved!)` (紅色)：新專案尚未儲存。
        - `● Unsaved Changes` (紅色)：已開啟專案有未儲存變動。
        - `✓ Saved` (綠色)：檔案已同步至磁碟。
- **原生安全確認**：解決 Webview 沙盒限制，將 `confirm()` 邏輯移至 Extension Host。現在開啟新檔案或建立新專案時，會跳出 VS Code 原生模態視窗詢問是否捨棄變動。
- **自動存檔 (Auto-Save)**：
    - 實作 2 秒防抖 (Debounce) 機制。
    - 僅在專案已具備路徑時背景執行，同步更新 `.xml` 與 `.pde`。

### 3. 檔名與路徑顯示
- **動態標題更新**：Webview 面板標籤 (Tab) 現在會隨開啟檔案顯示 `SynthBlockly: 檔名.xml`。
- **工具列檔名顯示**：在狀態列旁顯示當前編輯的 `[ 檔名.xml ]`。
- **懸停路徑提示**：滑鼠懸停在檔名上時，會透過 `title` 屬性顯示該檔案在電腦中的完整路徑。

### 4. 儲存流程優化 (Save As)
- **遵守 Processing 規範**：存檔時自動建立與專案同名的資料夾。
- **雙檔同步儲存**：一次動作同時存入 `.xml` (積木) 與 `.pde` (Java 程式碼)，確保資料夾結構可直接被 Processing IDE 開啟。

## 異動檔案
- `SynthBlocklyStage/package.json`
- `SynthBlocklyStage/src/extension.ts`
- `SynthBlocklyStage/media/main.js`
- `SynthBlocklyStage/media/style.css`
