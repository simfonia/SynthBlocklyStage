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

### 2026-01-30: 多執行緒演奏與路徑管理
- **Java 匿名內部類別限制**：在產生器中，若在 new Runnable() 內使用外部變數（如 durationMs），該變數必須標記為 final。已在 audio.js 產生器的 playNoteForDuration 參數中修正。
- **Minim 非阻塞演奏**：Processing 的 draw() 頻率不穩定。解決方案是在 Java 端為每個旋律、Loop 或節奏序列開啟獨立的 Thread，並配合 Thread.sleep()。
- **Git Symlink 追蹤問題**：開發時專案下的 data/ 會連結到 samples/ 導致 Git 混亂。解決方案是在專案根目錄 .gitignore 加入 **/data/。
- **Blockly 啟動同步**：若要啟動時為空但記憶路徑，必須在 extension.ts 中清空 _currentXmlPath 的初始傳值，但維持全域狀態中的 lastPath 供對話框使用。

## 影音架構與穩定性修復 (2026-01-31)

### 1. Java 作用域與注入陷阱
- **問題**：在產生器的 `Blockly.Processing.definitions_` 中寫入 `instrumentMap.put(...)` 是無效的，因為 Java 不允許在類別頂層直接執行語句。
- **方案**：樂器容器必須使用 `Blockly.Processing.provideSetup(code)`，將初始化邏輯強制推入 `setup()` 方法中執行。

### 2. 雙向資料同步邏輯
- **細節**：在 `updateInstrumentUISync()` 中，切換樂器的第一步必須是「將當前 UI 變數存入 `lastInstrument` 對應的 HashMap」，然後才是「從 HashMap 載入 `currentInstrument` 的數值到 UI」。漏掉第一步會導致手動調整的數值在切換後丟失。

### 3. Java 字串轉義與 Unterminated String
- **坑點**：在 Javascript 模板字串中產生 Java 的 `\n` 時，必須寫成 `\\\\n`。
    - JS 解析一次：變成 `\\n`
    - 寫入 .pde 檔案：變成 `\n` 字面量
    - Java 編譯：正確識別為換行符號。
- 若只寫 `\\n`，在 `.pde` 中會產生實體換行，導致 Java 報錯 `Unterminated string constant`。

### 4. 檔案寫入損壞 (JS Corruption)
- **現象**：`write_file` 過程中若不慎混入 `</script>` 或編碼不匹配，會導致 Webview 載入產生器失敗，報 `Uncaught SyntaxError` 或 `generator does not know how to generate code`。
- **對策**：避免在產生器 JS 中使用過於複雜的字串拼接，優先採用乾淨的模板結構並定期校對引號閉合。

### 5. PC Key 重複觸發機制 (Debounce)
- **問題**：Windows 鍵盤長按會連續發送 `keyPressed` 事件，導致聲音不斷 Restart。
- **方案**：使用 `HashSet<Integer> pcKeysHeld`。在 `keyPressed` 時檢查 `if (!contains(p))` 才觸發發聲；在 `keyReleased` 時移除。這確保了長按按鍵時聲音能正確進入 Sustain 階段。

# 2026-02-02 技術細節
- **Minim 初始化陷阱**：在 setup() 中呼叫 delay() 會卡死音訊執行緒，導致預備拍無聲。必須在獨立執行緒中處理，並在啟動前加入少量 sleep。
- **旗標同步順序**：isCountingIn = true 必須在 setup() 的主流程中立即執行，若在執行緒內部設定，其他執行緒可能因為競爭條件 (Race Condition) 而搶先開始。
- **音訊觸發時間**：adsr.noteOn() 與 noteOff() 中間必須有實質的 sleep (如 50ms)，否則音訊緩衝區來不及反應。

## 2026-02-03 技術細節
- **Blockly Mutator 陷阱**：若定義了 \domToMutation\ 就必須同時定義 \mutationToDom\，否則註冊時會報錯。
- **Minim TickRate API**：\TickRate\ UGen 沒有 \setTickRate\ 方法，必須使用 \	r.value.setLastValue(rate)\ 來改變播放速度。
- **Minim ADSR API**：\ADSR\ 沒有 \setAmplitude\ 方法，最大振幅需在建構函式第一參數或 \setParameters\ 中設定。
- **產生器 Key 覆寫 Bug**：在 \_core.js\ 中原本使用代碼第一行作為 Key，這會導致多個內容相似的帽子積木（如多個 Thread）互相覆寫。已改用遞增 ID (\setup_0\, \setup_1\...) 解決。
- **取樣器 Transient 保護**：為了保留真實鋼琴/小提琴的「擊槌感」，取樣器應跳過 ADS 設定（固定為 0/0/1.0），僅將 R (Release) 開放給使用者控制。
- **執行緒競爭 (Race Condition)**：\draw()\ 中的 \exit()\ 判斷必須配合 \FrameCount > 60\，以給予背景執行緒充足的啟動時間，避免在音樂還沒開始播時就誤判結束。

## 2026-02-04 技術細節
- **並發修改異常 (ConcurrentModificationException)**：背景演奏執行緒與鍵盤事件同時操作 activeNotes 時，會導致 Java Exception。已將 activeNotes 型別改為 ConcurrentHashMap。
- **音高衝突與複合 Key**：不同樂器演奏同音高會造成 ADSR 覆寫。解決方案是採用 "instrumentName_pitch" 作為複合 Key。
- **鍵盤樂器記憶 (Keyboard Memory)**：若在按住期間切換樂器，釋放時會因 currentInstrument 已變更而導致 Stuck Note。已將 pcKeysHeld 改為 HashMap<Integer, String> 以記住原始樂器名。
- **Java Thread 參數 final 化**：在產生的 Java 代碼中，傳遞給 Thread 的參數（如 instName）必須宣告為 final 才能在匿名內部類別中存取。
- **Webview UI 邊界問題**：HTML 下拉選單無法超出 Webview。改用 VS Code 原生 showQuickPick 解決介面遮擋與搜尋需求。
