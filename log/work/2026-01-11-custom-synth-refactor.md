# 2026-01-11 工作日誌 (IV)

## 任務：移植進階合成器、實作多樂器管理與修復 Minim 混音 Bug

### 1. 多樂器管理系統 (Multi-Instrument System)
- **樂器存簿實作**：在 Java 端引入 `instrumentMap` (`HashMap`) 與 `currentInstrument` 變數，支援透過積木建立具名樂器（如 "Bass", "Lead"）。
- **集中發聲控制**：重構 Java 邏輯，將所有演奏請求（積木、MIDI、PC 鍵盤）統一導向內部的 `playNoteInternal` 與 `stopNoteInternal` 函式，解決了原本 PC 鍵盤與 MIDI 行為不一致的問題。
- **動態切換**：實作超級舞台方向鍵切換邏輯，按下鍵盤左右鍵即可在已建立的樂器清單中循環切換，並同步於上方 Alerts 面板顯示訊息。

### 2. 進階合成器複刻 (Custom Synths)
- **諧波合成器 (Harmonic Synth)**：實作具備 Mutator 功能的積木，支援動態增減泛音層級。
- **加法合成器 (Additive Synth)**：實作支援自訂波形、頻率倍率與振幅的混合合成器積木。
- **強型別優化**：在產生器中全面強制加上 `f` (float) 尾綴（如 `0.5f`），避免 Java 整數除法導致的音高或音量錯誤。

### 3. 關鍵 Bug 修復：Minim 訊號覆寫問題
- **問題描述**：在使用「加法合成器」時，使用者發現聽感始終只有最後一個振盪器的波形。
- **原因分析**：Minim 的 `.patch()` 方法與 Tone.js 不同。若多個 `Oscil` 先後執行 `osc.patch(adsr)`，後面的連接會**覆蓋 (Overwrite)** 掉前面的連接，導致只有最後一個音源有效。
- **解決方案**：
    - 引入 **`Summer` (加法器) UGen**。
    - 邏輯改為：所有個別振盪器先 `osc.patch(mixer)` 到 `Summer` 物件中進行訊號加總。
    - 最後再由 `mixer.patch(adsr).patch(out)` 輸出。
    - 此修正確保了諧波與加法合成能正確混合所有頻率分量。

### 4. 工具箱優化
- **功能對齊**：同步 `#SynthBlockly` 的分類，拆分為「音源建立」、「樂器控制」與「音樂演奏」。
- **補齊積木**：將「啟動 Minim 音訊引擎」加入工具箱，並將「多行註解」外掛成功整合與註冊。
- **狀態保存**：修正了自訂積木在 Mutator 重繪時會丟失欄位數值的問題（加入暫存與還原邏輯）。

## 異動檔案
- `SynthBlocklyStage/media/blocks/audio.js`
- `SynthBlocklyStage/media/blocks/audio_custom.js` (NEW)
- `SynthBlocklyStage/media/generators/audio.js`
- `SynthBlocklyStage/media/generators/visual.js`
- `SynthBlocklyStage/media/zh-hant.js`
- `SynthBlocklyStage/media/en.js`
- `SynthBlocklyStage/media/toolbox.xml`
