# SynthBlockly Stage

Visualize your music performance with Blockly and Processing. This extension allows you to create interactive visuals and audio synthesizers using a block-based programming interface.

## Prerequisites

To run your sketches, you need to have **Processing** installed on your system.

### 1. Download Processing v3.5.4
We highly recommend using **Processing v3.5.4** for maximum compatibility with the audio libraries used in this project.
- Download it here: [Processing 3.5.4 Downloads](https://processing.org/download/)

### 2. Install Required Libraries
Once Processing is installed, open the Processing IDE and install the following libraries via `Tools > Add Tool... > Libraries`:

1.  **Minim**: The core audio engine used for synthesis and sampling.
2.  **ControlP5**: Used for the Super Stage's graphical user interface and sliders.
3.  **TheMidiBus**: Required for MIDI keyboard and device communication.

### 3. Configure the Path
After installing Processing, you need to tell this extension where to find the `processing-java` executable:
1.  Open the SynthBlockly Stage webview.
2.  Click the **Settings** icon (gear) on the toolbar.
3.  Select the `processing-java.exe` file (usually located in the root of your Processing installation folder).

---

## Features

- **Super Stage**: Integrated oscilloscope, ADSR monitor, and spectrum analyzer.
- **Advanced Synthesis**: Supports Basic Waveforms, Harmonic Stacking, and Additive Synthesis.
- **Live Control**: Map PC keyboard or MIDI devices to stage parameters in real-time.
- **Serial Interaction**: Connect with Arduino for physical computing and music interaction.
- **Auto-Save**: Background progress backup with unsaved changes indicators.

## Getting Started

1.  Click the "Open Workspace" command from the Command Palette (`Ctrl+Shift+P`).
2.  Load an example from the `Example Projects` button.
3.  Click the **Run** button (green icon) to launch the Processing stage.
