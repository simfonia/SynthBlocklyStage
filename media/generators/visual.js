/**
 * Visual Generators for Processing
 */

// 輔助方法：將 #RRGGBB 轉為 Processing color (int)
Blockly.Processing.hexToJavaColor = function (hex) {
  if (!hex || hex.charAt(0) !== '#') return "color(0)";
  var r = parseInt(hex.substring(1, 3), 16);
  var g = parseInt(hex.substring(3, 5), 16);
  var b = parseInt(hex.substring(5, 7), 16);
  return "color(" + r + ", " + g + ", " + b + ")";
};

// 輔助方法：計算 Hex 顏色的 Hue (0-255)
Blockly.Processing.hexToHue = function (hex) {
  if (!hex || hex.charAt(0) !== '#') return 0;
  var r = parseInt(hex.substring(1, 3), 16) / 255;
  var g = parseInt(hex.substring(3, 5), 16) / 255;
  var b = parseInt(hex.substring(5, 7), 16) / 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, d = max - min;
  if (max === min) h = 0; // achromatic
  else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return (h * 255).toFixed(1);
};

Blockly.Processing.forBlock["visual_size"] = function (block) {
  return "size(" + block.getFieldValue("WIDTH") + ", " + block.getFieldValue("HEIGHT") + ");\n";
};

Blockly.Processing.forBlock["visual_background"] = function (block) {
  const color = Blockly.Processing.valueToCode(block, "COLOR", Blockly.Processing.ORDER_ATOMIC) || "color(0)";
  return "background(" + color + ");\n";
};

Blockly.Processing.forBlock["visual_fill"] = function (block) {
  const color = Blockly.Processing.valueToCode(block, "COLOR", Blockly.Processing.ORDER_ATOMIC) || "color(255)";
  return "fill(" + color + ");\n";
};

Blockly.Processing.forBlock["visual_stroke"] = function (block) {
  const color = Blockly.Processing.valueToCode(block, "COLOR", Blockly.Processing.ORDER_ATOMIC) || "color(0)";
  return "stroke(" + color + ");\n";
};

Blockly.Processing.forBlock['visual_stage_setup'] = function (block) {
  // Ensure Audio Core is injected because the Stage's keyboard logic depends on it
  if (Blockly.Processing.injectAudioCore) {
    Blockly.Processing.injectAudioCore();
  }

  var w = block.getFieldValue("W");
  var h = block.getFieldValue("H");
  var bgColorHex = block.getFieldValue("BG_COLOR");
  var fgColorHex = block.getFieldValue("FG_COLOR");

  // Imports
  Blockly.Processing.addImport("import ddf.minim.*");
  Blockly.Processing.addImport("import ddf.minim.ugens.*");
  Blockly.Processing.addImport("import ddf.minim.analysis.*");
  Blockly.Processing.addImport("import controlP5.*");
  Blockly.Processing.addImport("import themidibus.*");
  Blockly.Processing.addImport("import processing.serial.*;");
  Blockly.Processing.addImport("import java.util.Collections;");
  Blockly.Processing.addImport("import java.util.List;");
  Blockly.Processing.addImport("import java.util.Arrays;");
  Blockly.Processing.addImport("import java.util.HashMap;");
  Blockly.Processing.addImport("import java.awt.Toolkit;");
  Blockly.Processing.addImport("import java.awt.datatransfer.*;");

  // Global Variables
  var g = Blockly.Processing.global_vars_;
  g['minim'] = "Minim minim;";
  g['out'] = "AudioOutput out;";
  g['fft'] = "FFT fft;";
  g['cp5'] = "ControlP5 cp5;";
  g['myBus'] = "MidiBus myBus;";
  g['serialBaud'] = "int serialBaud = 115200;";
  g['serialPortVar'] = "Serial myPort;";

  g['stageBgColor'] = "int stageBgColor;";
  g['stageFgColor'] = "int stageFgColor;";
  g['currentSample'] = "Sampler currentSample;";

  // UI Control Variables
  g['waveScale'] = "float waveScale = 2.5;";
  g['masterGain'] = "float masterGain = -5.0;"; 
  g['trailAlpha'] = "float trailAlpha = 100.0;";
  var initHue = Blockly.Processing.hexToHue(fgColorHex);
  g['fgHue'] = "float fgHue = " + initHue + ";";

  // Toggles
  g['showWave'] = "boolean showWave = true;";
  g['showSpec'] = "boolean showSpec = true;";
  g['showADSR'] = "boolean showADSR = true;";
  g['showLog'] = "boolean showLog = true;";
  g['isMidiMode'] = "boolean isMidiMode = false;";

  // ADSR Visual State Machine
  g['adsrTimer'] = "int adsrTimer = 0;";
  g['adsrState'] = "int adsrState = 0;"; // 0:Idle, 1:ADSR, 2:Release

  // Define Log Helper and Event Handlers in Definitions
  var helpersDef = `
  void logToScreen(String msg, int type) {
    Textarea target = (type >= 1) ? cp5.get(Textarea.class, "alertsArea") : cp5.get(Textarea.class, "consoleArea");
    if (target != null) {
      String prefix = (type == 3) ? "[ERR] " : (type == 2) ? "[WARN] " : (type == 1) ? "[!] " : "[INFO] ";
      target.append(prefix + msg + "\\n");
      target.scroll(1.0); // Always scroll to bottom
    }
    println((type==3?"[ERR] ":type==2?"[WARN] ":"[INFO] ") + msg);
  }

  void midiInputDevice(int n) {
    String[] inputs = MidiBus.availableInputs();
    if (n >= 0 && n < inputs.length) {
      myBus.clearInputs();
      myBus.addInput(n);
      logToScreen("MIDI Connected: " + inputs[n], 1);
    }
  }

  void serialInputDevice(int n) {
    String[] ports = Serial.list();
    if (n >= 0 && n < ports.length) {
      if (myPort != null) { myPort.stop(); }
      try {
        myPort = new Serial(this, ports[n], serialBaud);
        logToScreen("Serial Connected: " + ports[n], 1);
      } catch (Exception e) {
        logToScreen("Serial Error: Port Busy or Unavailable", 3);
      }
    }
  }

  void scanMidi() {
    String[] inputs = MidiBus.availableInputs();
    ScrollableList sl = cp5.get(ScrollableList.class, "midiInputDevice");
    if (sl != null) {
      sl.clear();
      println("--- MIDI Scan Results ---");
      for (int i = 0; i < inputs.length; i++) {
        sl.addItem(inputs[i], i);
        println("[" + i + "] " + inputs[i]);
      }
      sl.getCaptionLabel().align(ControlP5.LEFT, ControlP5.CENTER).setPaddingX(10);
      logToScreen("MIDI Scanned: " + inputs.length + " devices found.", 1);
    }
  }

  void copyLogs() {
    Textarea console = cp5.get(Textarea.class, "consoleArea");
    Textarea alerts = cp5.get(Textarea.class, "alertsArea");
    String content = "--- ALERTS ---\\n" + (alerts != null ? alerts.getText() : "") + 
                     "\\n\\n--- CONSOLE ---\\n" + (console != null ? console.getText() : "");
    
    StringSelection selection = new StringSelection(content);
    Clipboard clipboard = Toolkit.getDefaultToolkit().getSystemClipboard();
    clipboard.setContents(selection, selection);
    logToScreen("Logs copied to clipboard.", 1);
  }

  void clearLogs() {
    Textarea console = cp5.get(Textarea.class, "consoleArea");
    Textarea alerts = cp5.get(Textarea.class, "alertsArea");
    if (console != null) console.clear();
    if (alerts != null) alerts.clear();
    logToScreen("Logs cleared.", 1);
  }

  void keyPressed() {
    // 1. System Keys (Always Active)
    if (key == CODED) {
      if (keyCode == UP) { pitchTranspose += 12; logToScreen("Octave UP: " + (pitchTranspose/12), 1); }
      else if (keyCode == DOWN) { pitchTranspose -= 12; logToScreen("Octave DOWN: " + (pitchTranspose/12), 1); }
      else if (keyCode == LEFT || keyCode == RIGHT) {
        Object[] names = instrumentMap.keySet().toArray();
        if (names.length > 0) {
          int idx = -1;
          for(int i=0; i<names.length; i++) { if(names[i].toString().equals(currentInstrument)) { idx = i; break; } }
          if (keyCode == RIGHT) idx = (idx + 1) % names.length;
          else idx = (idx - 1 + names.length) % names.length;
          currentInstrument = names[idx].toString();
          logToScreen("Instrument: " + currentInstrument + " (" + instrumentMap.get(currentInstrument) + ")", 1);
        }
      }
    } else if (key == '=' || key == '+') { pitchTranspose += 1; logToScreen("Transpose: " + pitchTranspose, 1); }
    else if (key == '-') { pitchTranspose -= 1; logToScreen("Transpose: " + pitchTranspose, 1); }
    else if (key == BACKSPACE) { pitchTranspose = 0; logToScreen("Transpose Reset", 1); }

    // 2. Built-in Piano Keys (Only if Stage Block exists)
    int p = -1;
    char k = Character.toLowerCase(key);
    if (k == 'q') p = 60;
    else if (k == '2') p = 61;
    else if (k == 'w') p = 62;
    else if (k == '3') p = 63;
    else if (k == 'e') p = 64;
    else if (k == 'r') p = 65;
    else if (k == '5') p = 66;
    else if (k == 't') p = 67;
    else if (k == '6') p = 68;
    else if (k == 'y') p = 69;
    else if (k == '7') p = 70;
    else if (k == 'u') p = 71;
    else if (k == 'i') p = 72;
    else if (k == '9') p = 73;
    else if (k == 'o') p = 74;
    else if (k == '0') p = 75;
    else if (k == 'p') p = 76;
    else p = -1;

    if (p != -1) {
      playNoteInternal(p, 100);
      logToScreen("Keyboard ON: MIDI " + p, 0);
    }
    
    // 3. Custom Event Injection Placeholder
    {{KEY_PRESSED_EVENT_PLACEHOLDER}}
  }

  void keyReleased() {
    int p = -1;
    char k = Character.toLowerCase(key);
    if (k == 'q') p = 60;
    else if (k == '2') p = 61;
    else if (k == 'w') p = 62;
    else if (k == '3') p = 63;
    else if (k == 'e') p = 64;
    else if (k == 'r') p = 65;
    else if (k == '5') p = 66;
    else if (k == 't') p = 67;
    else if (k == '6') p = 68;
    else if (k == 'y') p = 69;
    else if (k == '7') p = 70;
    else if (k == 'u') p = 71;
    else if (k == 'i') p = 72;
    else if (k == '9') p = 73;
    else if (k == 'o') p = 74;
    else if (k == '0') p = 75;
    else if (k == 'p') p = 76;
    else p = -1;

    if (p != -1) {
      stopNoteInternal(p);
      logToScreen("Keyboard OFF: MIDI " + p, 0);
    }
    
    {{KEY_RELEASED_EVENT_PLACEHOLDER}}
  }
  `;
  Blockly.Processing.definitions_['Helpers'] = helpersDef;
  Blockly.Processing.definitions_['Helpers'] = helpersDef;

  // Setup Code
  var panelH = 200;
  var logW = 400; // Log Panel Width
  var totalW = parseInt(w) + logW;
  var totalH = parseInt(h) + panelH;

  var setupCode = "size(" + totalW + ", " + totalH + ");\n" +
    "pixelDensity(displayDensity());\n" +
    "stageBgColor = " + Blockly.Processing.hexToJavaColor(bgColorHex) + ";\n" +
    "stageFgColor = " + Blockly.Processing.hexToJavaColor(fgColorHex) + ";\n" +
    "minim = new Minim(this);\n" +
    "out = minim.getLineOut();\n" +
    "fft = new FFT(out.bufferSize(), out.sampleRate());\n" +
    "cp5 = new ControlP5(this);\n" +
    "cp5.setFont(createFont(\"Arial\", 16));\n" +
    "MidiBus.list();\n" +
    "myBus = new MidiBus(this, 0, -1);\n";

  // UI: Textareas for Logs
  var splitH = totalH / 2;
  setupCode += "\n  // --- Log Textareas ---\n" +
    "cp5.addTextarea(\"alertsArea\")\n" +
    "   .setPosition(" + w + ", 35)\n" +
    "   .setSize(" + logW + ", " + (splitH - 35) + ")\n" +
    "   .setFont(createFont(\"Arial\", 18))\n" + // Larger font
    "   .setLineHeight(22)\n" +
    "   .setColor(color(255, 100, 100))\n" +
    "   .setColorBackground(color(40, 0, 0))\n" +
    "   .setColorForeground(color(100, 0, 0));\n" +

    "cp5.addTextarea(\"consoleArea\")\n" +
    "   .setPosition(" + w + ", " + (splitH + 35) + ")\n" +
    "   .setSize(" + logW + ", " + (totalH - splitH - 35) + ")\n" +
    "   .setFont(createFont(\"Arial\", 18))\n" + // Larger font
    "   .setLineHeight(22)\n" +
    "   .setColor(color(200))\n" +
    "   .setColorBackground(color(20))\n" +
    "   .setColorForeground(color(100));\n";

  // UI Generation
  var uiY = parseInt(h) + 30; // Start Y for UI controls
  var uiX = 20;
  var toggleW = 40;
  var toggleH = 20;
  var sliderH = 15;

  setupCode += "\n  // --- Control Panel UI ---\n";

  // 1. Main Toggles (Wave, ADSR, Spec, Log) - Far Left
  uiX = 20;
  setupCode += "cp5.addToggle(\"showWave\").setPosition(" + uiX + ", " + uiY + ").setSize(" + toggleW + ", " + toggleH + ").setCaptionLabel(\"WAVE\");\n"; uiX += 70;
  setupCode += "cp5.addToggle(\"showADSR\").setPosition(" + uiX + ", " + uiY + ").setSize(" + toggleW + ", " + toggleH + ").setCaptionLabel(\"ADSR\");\n"; uiX += 70;
  setupCode += "cp5.addToggle(\"showSpec\").setPosition(" + uiX + ", " + uiY + ").setSize(" + toggleW + ", " + toggleH + ").setCaptionLabel(\"SPEC\");\n"; uiX += 70;
  setupCode += "cp5.addToggle(\"showLog\").setPosition(" + uiX + ", " + uiY + ").setSize(" + toggleW + ", " + toggleH + ").setCaptionLabel(\"LOG\");\n";

  // 2. Visuals (Trail, Scale, Hue) - Below Toggles, Stacked Vertically
  uiX = 20;
  var sliderY = uiY + 65; // Increased gap from toggles by 10px
  var sliderW = 150;
  setupCode += "cp5.addSlider(\"trailAlpha\").setPosition(" + uiX + ", " + sliderY + ").setSize(" + sliderW + ", " + sliderH + ").setRange(0, 255).setCaptionLabel(\"TRAIL\");\n"; sliderY += 30;
  setupCode += "cp5.addSlider(\"waveScale\").setPosition(" + uiX + ", " + sliderY + ").setSize(" + sliderW + ", " + sliderH + ").setRange(0.1, 10).setCaptionLabel(\"SCALE\");\n"; sliderY += 30;

  // 3. Hue Slider (Below Scale)
  var cwX = uiX;
  var cwY = sliderY;
  var cwW = sliderW;
  var cwH = sliderH;
  setupCode += "cp5.addSlider(\"fgHue\").setPosition(" + cwX + ", " + cwY + ").setSize(" + cwW + ", " + cwH + ").setRange(0, 255).setValue(" + initHue + ").setCaptionLabel(\"FG COLOR\");\n";

  // 4. ADSR Sliders (Center) - Moved Right and Down
  uiX = 320; // Shifted right
  var adsrY = parseInt(h) + 85;
  var adsrH = 80;
  var adsrW = 15;
  var adsrGap = 60;

  var addADSR = function (name, label, max) {
    return "cp5.addSlider(\"" + name + "\").setPosition(" + uiX + ", " + adsrY + ").setSize(" + adsrW + ", " + adsrH + ")" +
      ".setRange(0, " + max + ")" +
      ".setCaptionLabel(\"" + label + "\")" +
      ".getCaptionLabel().align(ControlP5.CENTER, ControlP5.BOTTOM_OUTSIDE).setPaddingX(0);\n";
  };

  setupCode += addADSR("adsrA", "A", 2.0); uiX += adsrGap;
  setupCode += addADSR("adsrD", "D", 1.0); uiX += adsrGap;
  setupCode += addADSR("adsrS", "S", 1.0); uiX += adsrGap;
  setupCode += addADSR("adsrR", "R", 2.0); uiX += adsrGap;

  // 5. Master Gain
  uiX += 20;
  setupCode += "cp5.addSlider(\"masterGain\").setPosition(" + uiX + ", " + adsrY + ").setSize(15, " + adsrH + ").setRange(-40, 15)" +
    ".setCaptionLabel(\"GAIN\").getCaptionLabel().align(ControlP5.CENTER, ControlP5.BOTTOM_OUTSIDE).setPaddingX(0);\n";

  // 6. MIDI Device Selection
  uiX += 100;
  setupCode += "String[] startInputs = MidiBus.availableInputs();\n" +
    "println(\"--- MIDI Devices at Startup ---\");\n" +
    "for(String s : startInputs) println(\"  > \" + s);\n" +
    "ScrollableList sl = cp5.addScrollableList(\"midiInputDevice\")\n" +
    "   .setPosition(" + uiX + ", " + uiY + ")\n" +
    "   .setSize(300, 150)\n" +
    "   .setBarHeight(30)\n" +
    "   .setItemHeight(25)\n" +
    "   .setCaptionLabel(\"MIDI DEVICE\");\n" +
    "for (int i = 0; i < startInputs.length; i++) {\n" +
    "  sl.addItem(startInputs[i], i);\n" +
    "}\n" +
    "sl.getCaptionLabel().toUpperCase(false).getStyle().setMarginTop(4);\n" +
    "sl.getCaptionLabel().setPaddingX(10);\n" +
    "if (startInputs.length > 0) {\n" +
    "  sl.setValue(0); // This will show the device name and trigger connection\n" +
    "}\n" +
    "sl.close();\n" +
    "\n" +
    "// 7. Serial Port Selection\n" +
    "String[] serialPorts = Serial.list();\n" +
    "ScrollableList ssl = cp5.addScrollableList(\"serialInputDevice\")\n" +
    "   .setPosition(" + uiX + ", " + (uiY + 40) + ")\n" +
    "   .setSize(300, 150)\n" +
    "   .setBarHeight(30)\n" +
    "   .setItemHeight(25)\n" +
    "   .setCaptionLabel(\"SERIAL PORT\");\n" +
    "for (int i = 0; i < serialPorts.length; i++) {\n" +
    "  ssl.addItem(serialPorts[i], i);\n" +
    "}\n" +
    "ssl.getCaptionLabel().toUpperCase(false).getStyle().setMarginTop(4);\n" +
    "ssl.getCaptionLabel().setPaddingX(10);\n" +
    "ssl.close();\n";

  setupCode += "cp5.addButton(\"scanMidi\")\n" +
    "   .setPosition(" + (uiX + 310) + ", " + uiY + ")\n" +
    "   .setSize(50, 30)\n" +
    "   .setCaptionLabel(\"SCAN\")\n" +
    "   .getCaptionLabel().toUpperCase(false).getStyle().setMarginTop(4);\n";

  // Log Controls (Positioned at the top right header of the log area)
  setupCode += "cp5.addButton(\"copyLogs\")\n" +
    "   .setPosition(" + (totalW - 195) + ", 5)\n" +
    "   .setSize(90, 25)\n" +
    "   .setCaptionLabel(\"COPY LOG\")\n" +
    "   .getCaptionLabel().toUpperCase(false).getStyle().setMarginTop(2);\n";

  setupCode += "cp5.addButton(\"clearLogs\")\n" +
    "   .setPosition(" + (totalW - 100) + ", 5)\n" +
    "   .setSize(90, 25)\n" +
    "   .setCaptionLabel(\"CLEAR LOG\")\n" +
    "   .getCaptionLabel().toUpperCase(false).getStyle().setMarginTop(2);\n";

  // Initial Log Message
  setupCode += "logToScreen(\"System Initialized.\", 0);\n";

  Blockly.Processing.provideSetup(setupCode);

  // Draw Code
  // 1. Update FG Color from Hue
  var drawCode = "pushStyle();\n" +
    "colorMode(HSB, 255);\n" +
    "stageFgColor = color(fgHue, 255, 255);\n" +
    "popStyle();\n" +
    "out.setGain(masterGain);\n" +
    "noStroke();\n" +
    "fill(30); rect(0, " + h + ", width, " + panelH + ");\n" +
    "// Draw rainbow bar behind fgHue slider\n" +
    "for (int i = 0; i < " + cwW + "; i++) {\n" +
    "  colorMode(HSB, " + cwW + ");\n" +
    "  stroke(i, " + cwW + ", " + cwW + ");\n" +
    "  line(" + cwX + " + i, " + cwY + " + " + cwH + " + 2, " + cwX + " + i, " + cwY + " + " + cwH + " + 5);\n" +
    "}\n" +
    "colorMode(RGB, 255);\n";

  // 2. Dynamic Viewport Width
  drawCode += "float currentVisualW = showLog ? " + w + ".0 : width;\n" +
    "noStroke();\n" +
    "fill(stageBgColor, 255 - trailAlpha);\n" +
    "rect(0, 0, currentVisualW, " + h + ");\n";

  // 3. Dynamic Viewport Logic
  drawCode += "int activeViews = int(showWave) + int(showADSR) + int(showSpec);\n" +
    "if (activeViews > 0) {\n" +
    "  float viewW = currentVisualW / float(activeViews);\n" +
    "  float currentX = 0;\n" +
    "  stroke(stageFgColor);\n" +
    "  strokeWeight(2);\n" +
    "  noFill();\n";

  // View 1: Waveform
  drawCode += "  if (showWave) {\n" +
    "    pushMatrix();\n" +
    "    translate(currentX, 0);\n" +
    "    stroke(stageFgColor);\n" + // Original Hue
    "    for(int i = 0; i < out.bufferSize() - 1; i++) {\n" +
    "      float x1 = map(i, 0, out.bufferSize(), 0, viewW);\n" +
    "      float x2 = map(i+1, 0, out.bufferSize(), 0, viewW);\n" +
    "      line(x1, " + h + "/2 + out.mix.get(i) * waveScale * 100, x2, " + h + "/2 + out.mix.get(i+1) * waveScale * 100);\n" +
    "    }\n" +
    "    stroke(50); line(viewW, 0, viewW, " + h + ");\n" +
    "    popMatrix();\n" +
    "    currentX += viewW;\n" +
    "  }\n";

  // View 2: ADSR
  drawCode += "  if (showADSR) {\n" +
    "    pushMatrix();\n" +
    "    translate(currentX, 0);\n" +
    "    pushStyle();\n" +
    "    colorMode(HSB, 255);\n" +
    "    int adsrColor = color((fgHue + 40) % 255, 200, 255);\n" + // Offset Hue for ADSR
    "    stroke(adsrColor);\n" +
    "    float totalTime = adsrA + adsrD + adsrR + 0.5;\n" +
    "    float xA = map(adsrA, 0, totalTime, 0, viewW);\n" +
    "    float xD = map(adsrA + adsrD, 0, totalTime, 0, viewW);\n" +
    "    float xS = map(adsrA + adsrD + 0.5, 0, totalTime, 0, viewW);\n" +
    "    float xR = map(totalTime, 0, totalTime, 0, viewW);\n" +
    "    float yPeak = " + h + " * 0.2;\n" +
    "    float ySus = " + h + " - (adsrS * " + h + " * 0.8);\n" +
    "    float yBase = " + h + " * 0.9;\n" +
    "    beginShape();\n" +
    "    vertex(0, yBase);\n" +
    "    vertex(xA, yPeak);\n" +
    "    vertex(xD, ySus);\n" +
    "    vertex(xS, ySus);\n" +
    "    vertex(xR, yBase);\n" +
    "    endShape();\n" +
    "    \n" +
    "    // --- State Machine Dot Movement ---\n" +
    "    float dotX = 0; float dotY = yBase;\n" +
    "    if (adsrState == 1) {\n" +
    "      float elapsed = (millis() - adsrTimer) / 1000.0;\n" +
    "      if (elapsed < adsrA) {\n" +
    "        dotX = map(elapsed, 0, adsrA, 0, xA);\n" +
    "        dotY = map(elapsed, 0, adsrA, yBase, yPeak);\n" +
    "      } else if (elapsed < adsrA + adsrD) {\n" +
    "        dotX = map(elapsed, adsrA, adsrA + adsrD, xA, xD);\n" +
    "        dotY = map(elapsed, adsrA, adsrA + adsrD, yPeak, ySus);\n" +
    "      } else {\n" +
    "        float sPhase = (sin(millis() * 0.005) + 1) / 2.0;\n" +
    "        dotX = lerp(xD, xS, sPhase);\n" +
    "        dotY = ySus;\n" +
    "      }\n" +
    "    } else if (adsrState == 2) {\n" +
    "      float relElapsed = (millis() - adsrTimer) / 1000.0;\n" +
    "      if (relElapsed < adsrR) {\n" +
    "        dotX = map(relElapsed, 0, adsrR, xS, xR);\n" +
    "        dotY = map(relElapsed, 0, adsrR, ySus, yBase);\n" +
    "      } else {\n" +
    "        adsrState = 0; dotX = xR; dotY = yBase;\n" +
    "      }\n" +
    "    }\n" +
    "    \n" +
    "    if (adsrState > 0) {\n" +
    "      noStroke();\n" +
    "      for(int j=8; j>0; j--) {\n" +
    "        fill(adsrColor, 15); ellipse(dotX, dotY, j*5, j*5);\n" + // Use shifted glow
    "      }\n" +
    "      fill(255); ellipse(dotX, dotY, 8, 8);\n" +
    "    }\n" +
    "    popStyle();\n" +
    "    stroke(50); line(viewW, 0, viewW, " + h + "); \n" +
    "    popMatrix();\n" +
    "    currentX += viewW;\n" +
    "  }\n";

  // View 3: Spectrum
  drawCode += "  if (showSpec) {\n" +
    "    pushMatrix();\n" +
    "    translate(currentX, 0);\n" +
    "    pushStyle();\n" +
    "    colorMode(HSB, 255);\n" +
    "    fft.forward(out.mix);\n" +
    "    for(int i = 0; i < fft.specSize(); i++) {\n" +
    "      float x = map(i, 0, fft.specSize(), 0, viewW);\n" +
    "      float y = map(fft.getBand(i), 0, 50, " + h + ", " + h + "*0.2);\n" +
    "      // Dynamic Gradient based on frequency index i\n" +
    "      float hValue = (fgHue + map(i, 0, fft.specSize(), 0, 80)) % 255;\n" +
    "      stroke(hValue, 200, 255);\n" +
    "      line(x, " + h + ", x, y);\n" +
    "    }\n" +
    "    popStyle();\n" +
    "    popMatrix();\n" +
    "  }\n";
  drawCode += "}\n";

  // 4. Log Panel Logic (Component Show/Hide)
  drawCode += "Textarea areaAlerts = cp5.get(Textarea.class, \"alertsArea\");\n" +
    "Textarea areaConsole = cp5.get(Textarea.class, \"consoleArea\");\n" +
    "Button btnCopy = (Button)cp5.getController(\"copyLogs\");\n" +
    "Button btnClear = (Button)cp5.getController(\"clearLogs\");\n" +
    "if (areaAlerts != null && areaConsole != null) {\n" +
    "  if (showLog) {\n" +
    "    areaAlerts.show();\n" +
    "    areaConsole.show();\n" +
    "    if(btnCopy != null) btnCopy.show();\n" +
    "    if(btnClear != null) btnClear.show();\n" +
    "    pushMatrix();\n" +
    "    translate(" + w + ", 0);\n" +
    "    float splitH = height / 2.0;\n" +
    "    fill(40, 0, 0); noStroke(); rect(0, 0, " + logW + ", splitH);\n" +
    "    fill(255, 100, 100); textSize(14); text(\"ALERTS (WARN/ERR)\", 10, 25);\n" +
    "    translate(0, splitH);\n" +
    "    fill(20); noStroke(); rect(0, 0, " + logW + ", height - splitH);\n" +
    "    fill(200); textSize(14); text(\"SYSTEM CONSOLE\", 10, 25);\n" +
    "    stroke(255); line(0, 0, " + logW + ", 0);\n" +
    "    popMatrix();\n" +
    "  } else {\n" +
    "    areaAlerts.hide();\n" +
    "    areaConsole.hide();\n" +
    "    if(btnCopy != null) btnCopy.hide();\n" +
    "    if(btnClear != null) btnClear.hide();\n" +
    "  }\n" +
    "}\n";

  Blockly.Processing.provideDraw(drawCode);
  return "";
};

Blockly.Processing.forBlock['visual_stage_set_color'] = function (block) {
  var target = block.getFieldValue('TARGET');
  var color = Blockly.Processing.valueToCode(block, 'COLOR', Blockly.Processing.ORDER_ASSIGNMENT) || 'color(255)';
  var varName = (target === 'BG') ? 'stageBgColor' : 'stageFgColor';
  return varName + " = " + color + ";\n";
};

Blockly.Processing.forBlock['visual_color_picker'] = function (block) {
  var hex = block.getFieldValue('COLOR');
  return [Blockly.Processing.hexToJavaColor(hex), Blockly.Processing.ORDER_ATOMIC];
};
