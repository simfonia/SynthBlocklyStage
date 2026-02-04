# SynthBlockly Stage

結合 Blockly 視覺化積木與 Processing (Java) 強大效能的音樂表演與視覺藝術創作工具。

## 前置準備

要執行您的作品，系統必須安裝 **Processing**。

### 1. 下載 Processing v3.5.4
強烈建議使用 **Processing v3.5.4** 以確保與本專案使用的音訊庫達到最佳相容性。
- 下載連結：[Processing 官方下載](https://processing.org/download/)

### 2. 安裝必要函式庫
安裝 Processing 後，請開啟 IDE 並透過 `Tools > Add Tool... > Libraries` 安裝以下函式庫：

1.  **Minim**: 核心音訊引擎，負責合成與取樣。
2.  **ControlP5**: 負責表演舞台的圖形介面與控制滑桿。
3.  **TheMidiBus**: 負責 MIDI 裝置通訊。

### 3. 設定執行路徑
初次使用時，請告知擴充功能 `processing-java` 的位置：
1.  開啟 SynthBlockly Stage 工作區。
2.  點擊工具列上的 **設定** 圖示（齒輪）。
3.  選擇 `processing-java.exe` 檔案（通常位於 Processing 安裝目錄的根目錄）。

---

## 主要特色

- **表演舞台 (Super Stage)**：整合示波器、ADSR 監控器與頻譜分析儀。
- **進階音訊合成**：支援基礎波形、諧波疊加 (Harmonic) 與加法合成 (Additive)。
- **智慧取樣器**：內建鋼琴、小提琴取樣，並支援載入自訂音訊樣本。
- **即時互動**：支援電腦鍵盤與 MIDI 裝置即時操控，並具備按鍵衝突偵測。
- **硬體串接**：支援與 Arduino (Serial) 進行實體運算與音樂互動。
- **專案管理**：內建範例系統、另存新檔功能，並具備 2 秒防抖自動儲存機制。

## 快速上手

1.  使用 VS Code 指令面板 (`Ctrl+Shift+P`) 執行 `SynthBlockly Stage: Open Workspace`。
2.  透過工具列的「範例」按鈕快速載入示範專案。
3.  點擊標題列的 **Run** 圖示（綠色按鈕）即可編譯並啟動舞台。