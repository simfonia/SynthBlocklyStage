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

==================================================
2026-01-29

1. 本次工作重點 (基礎建設標準化與原生化)：
- **持久化與恢復**：實作 `lastXmlPath` 記憶功能，Webview 啟動時會透過 `webviewReady` 事件自動恢復上一次編輯的專案。
- **存檔格式優化**：全面改用 `domToPrettyText`，確保 XML 具備良好縮排。
- **原生執行空間 (Critical)**：
    - 實作「執行前強制存檔」流程，確保專案有確定基路徑。
    - 實作 `_sanitizeProjectName`，自動清理檔名與資料夾名（轉為下劃線）。
    - Processing 改為直接在專案目錄下執行，解決 Windows `Temp` 資料夾連結鎖定問題。
- **積木 ID 全面對齊**：將 Audio 類積木由 `audio_` 改為 `sb_` 前綴（如 `sb_minim_init`, `sb_play_note`）。
- **資源管理系統**：實作「專案優先 + 內建 Fallback」掛載邏輯。自動將 `media/samples/` 的分類資料夾（Junction）掛載到專案 `data/` 下。
- **BUG 修復**：
    - 修復了 `sb_load_sample` 缺少 `setup()` 初始化代碼的問題。
    - 修復了 `playNoteInternal` 缺少視覺狀態 (`adsrTimer/State`) 更新的問題。
    - 加入了 Blockly v12/v13 變數 API Polyfill。

2. 待辦任務 (Next Steps)：
- 繼續更新剩餘舊範例的 XML（將 `audio_` 取代為 `sb_`），特別是 Serial 相關範例。
- 實作旋律解析器或加強視覺連動積木。
- 測試並驗證在完全沒有 `data` 資料夾的新專案中，內建資源掛載是否 100% 穩定。

==================================================
2026-01-30

1. 本次完成重點：
- **核心演奏對齊**：實作了 Java 版的 MelodyPlayer (Thread) 與 RhythmPlayer。支援 sb_play_melody (C4Q, E4H等) 與 sb_rhythm_sequence (x---).
- **時序系統**：實作 sb_tone_loop (執行緒循環) 與 sb_transport_set_bpm。解決了 Processing 依賴 frameCount 導致音樂不穩的問題。
- **啟動邏輯重構**：徹底分離「內容載入」與「路徑記憶」。現在啟動時是新專案，但開啟檔案會停在上次目錄。
- **和弦系統移植**：實作 sb_define_chord 與 sb_play_chord_by_name，解析器優先檢查和弦定義。

2. 待辦任務 (Next Steps)：
- **Serial 深度整合**：實作 Serial.write 以支援從舞台反向控制 Arduino。
- **多執行緒壓力測試**：驗證多個 sb_tone_loop 同時執行時的 Java 執行緒穩定性。
- **範例 XML 批次更新**：將剩餘舊範例的 audio_ ID 統一改為 sb_。

==================================================
2026-01-31

1. 本次工作重點：
- **樂器定義架構修正**：解決了樂器定義積木放在全域執行無效的問題。現在 `sb_instrument_container` 會強制將內部 Java 代碼（`instrumentMap`, `instrumentADSR`）注入 `setup()` 函式。
- **ADSR 雙向同步**：實作了 `updateInstrumentUISync()`。切換樂器時 UI 自動更新；調整 UI 參數後切換樂器，變更會自動寫回資料庫記憶。
- **演奏體驗優化**：
    - 解決 PC Key 按住不放會連續觸發（機器槍）的問題，現在長按按鍵能正確 Sustain。
    - 將 ADSR 滑桿精度設為 0.01 單位，提供更細膩的音色控制。
- **視覺功能大擴充**：
    - 新增 `visual_ellipse`, `visual_triangle` 繪圖積木。
    - 實作完整座標變換系統：`rotate`, `translate`, `scale` 及隔離變換的 `push_pop` 積木。
    - 介面強化：在 `FG COLOR` 滑桿下方加入實體彩虹色條，方便使用者直觀對照 HSB 色彩數值。
- **Serial 通訊完備**：新增 `sb_serial_write` 積木，實現對 Arduino 的反向控制。

2. 待辦任務 (Next Steps)：
- **複雜視覺測試**：驗證 `push_pop` 在多重循環嵌套繪圖下的效能與邏輯穩定性。
- **數學積木擴充**：考慮加入 `sin`, `cos`, `noise` 等三角函數與噪聲積木，以支援產生更豐富的視覺動畫。
- **範例更新**：繼續將剩餘的範例（特別是 09_wah-wah 等）更新為新版 `sb_` 結構與樂器容器。

# 2026-02-02 交接紀錄
- 成功解決 AudioCore 在 Template Literal 中的轉義災難，關鍵在於不要隨意修改包含 \\\\+ 的字串。
- 實作了 sb_instrument_container 的代碼收集機制，解決 setup() 中初始化順序導致的 NullPointerException。
- 完成了範例路徑保護 (extension.ts) 與前端 UI 狀態同步 (main.js)。
- 完成了非阻塞式的預備拍 (Count-in) 功能，包含旗標同步機制。
- 修正了另存新檔會建立巢狀資料夾的 Bug。

## 2026-02-03 任務交接
- **完成事項**：
    - 全面優化演奏積木：更名為「播放單音」、「播放旋律」、「播放和弦」，並統一顏色與阻塞式行為。
    - 實作「旋律樂器取樣器」：支援鋼琴、小提琴內建音源及 \data/\ 自訂路徑，具備智慧變調與 Release 餘韻控制。
    - 修正核心 Bug：解決了 \provideSetup\ 代碼覆寫問題，目前支援多聲部同步演奏（多個演奏帽子積木）。
    - 強化防呆與介面：實作多音源光暈警告、全方位音量控制、以及自動處理說明的語系後綴。
- **目前狀態**：音訊引擎非常穩定，取樣器音質良好且保留了原始 Attack 細節。範例 04 已可完美執行多聲部並準確結束。
- **後續建議**：可進一步將剩餘的舊範例（如 09, 10, 11）之 \Audio_\ ID 更新為新版 \sb_\ 結構。

## 2026-02-04 任務交接
- **完成事項**：
    - 實作「範例載入系統」：改用 VS Code 原生 QuickPick 介面，支援自動掃描 `examples/` 資料夾。
    - 修復音序器 (Step Sequencer)：升級為智慧 Tokenizer，可正確解析 `Dm7...` 等長字串。
    - 重構音訊核心：引入「樂器+音高」複合 Key 與 `ConcurrentHashMap`，徹底解決多執行緒併發修改導致的樂器錯亂與長鳴音問題。
    - 鍵盤事件增強：新增樂器記憶功能，確保釋放音符時與按下時的樂器一致。
    - 升級預備拍積木：支援自訂拍號、改為單行顯示，並修正了 Click 間隔計算公式。
- **待辦任務**：
    - 繼續更新舊範例的 XML ID 與結構。
    - 觀察高負載合奏時是否需要加入 Master Limiter 防止爆音。

==================================================
2026-02-05

1. 本次完成重點：
- **音訊引擎大重構**：引入 mainMixer (Summer) 與 masterGainUGen (Gain)，達成 100% 涵蓋所有音源的總音量控制與示波器顯示。
- **編曲系統進化**：
    - 實作「配置樂句 (Arrange Phrase)」容器，支援段落自動等待與銜接。
    - 實作「多軌音序器 V2」，支援單一積木管理多軌、自訂拍號、解析度（支援三連音）。
- **演奏穩定性**：
    - 實作 MIDI 語音記憶 (midiKeysHeld)，解決在按住音符時切換樂器導致的長鳴音。
    - 修正 ADSR 鬼影移動問題，確保啟動與切換時狀態歸零。
- **UI 與互動**：解決了 Webview 內 prompt() 被禁用的問題（橋接 VS Code InputBox），並修正了選單遮擋 Z-Order。

2. 待辦任務 (Next Steps)：
- **效果器對齊**：在 #SynthBlocklyStage 中實作與 #SynthBlockly 一致的效果器積木（Distortion, Reverb, Delay, Filter 等）。
- **範例更新**：繼續將舊範例（特別是 Serial 相關）遷移至 V2 音序器架構。