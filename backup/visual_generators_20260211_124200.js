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

Blockly.Processing.forBlock["visual_rect"] = function (block) {
  const x = Blockly.Processing.valueToCode(block, "X", Blockly.Processing.ORDER_ATOMIC) || "0";
  const y = Blockly.Processing.valueToCode(block, "Y", Blockly.Processing.ORDER_ATOMIC) || "0";
  const w = Blockly.Processing.valueToCode(block, "W", Blockly.Processing.ORDER_ATOMIC) || "100";
  const h = Blockly.Processing.valueToCode(block, "H", Blockly.Processing.ORDER_ATOMIC) || "100";
  return "rect(floatVal(" + x + "), floatVal(" + y + "), floatVal(" + w + "), floatVal(" + h + "));\n";
};

Blockly.Processing.forBlock["visual_ellipse"] = function (block) {
  const x = Blockly.Processing.valueToCode(block, "X", Blockly.Processing.ORDER_ATOMIC) || "0";
  const y = Blockly.Processing.valueToCode(block, "Y", Blockly.Processing.ORDER_ATOMIC) || "0";
  const w = Blockly.Processing.valueToCode(block, "W", Blockly.Processing.ORDER_ATOMIC) || "100";
  const h = Blockly.Processing.valueToCode(block, "H", Blockly.Processing.ORDER_ATOMIC) || "100";
  return "ellipse(floatVal(" + x + "), floatVal(" + y + "), floatVal(" + w + "), floatVal(" + h + "));\n";
};

Blockly.Processing.forBlock["visual_triangle"] = function (block) {
  const x1 = Blockly.Processing.valueToCode(block, "X1", Blockly.Processing.ORDER_ATOMIC) || "0";
  const y1 = Blockly.Processing.valueToCode(block, "Y1", Blockly.Processing.ORDER_ATOMIC) || "0";
  const x2 = Blockly.Processing.valueToCode(block, "X2", Blockly.Processing.ORDER_ATOMIC) || "50";
  const y2 = Blockly.Processing.valueToCode(block, "Y2", Blockly.Processing.ORDER_ATOMIC) || "0";
  const x3 = Blockly.Processing.valueToCode(block, "X3", Blockly.Processing.ORDER_ATOMIC) || "25";
  const y3 = Blockly.Processing.valueToCode(block, "Y3", Blockly.Processing.ORDER_ATOMIC) || "50";
  return "triangle(floatVal(" + x1 + "), floatVal(" + y1 + "), floatVal(" + x2 + "), floatVal(" + y2 + "), floatVal(" + x3 + "), floatVal(" + y3 + "));\n";
};

Blockly.Processing.forBlock["visual_line"] = function (block) {
  const x1 = Blockly.Processing.valueToCode(block, "X1", Blockly.Processing.ORDER_ATOMIC) || "0";
  const y1 = Blockly.Processing.valueToCode(block, "Y1", Blockly.Processing.ORDER_ATOMIC) || "0";
  const x2 = Blockly.Processing.valueToCode(block, "X2", Blockly.Processing.ORDER_ATOMIC) || "100";
  const y2 = Blockly.Processing.valueToCode(block, "Y2", Blockly.Processing.ORDER_ATOMIC) || "100";
  return "line(floatVal(" + x1 + "), floatVal(" + y1 + "), floatVal(" + x2 + "), floatVal(" + y2 + "));\n";
};

Blockly.Processing.forBlock["visual_rotate"] = function (block) {
  const angle = Blockly.Processing.valueToCode(block, "ANGLE", Blockly.Processing.ORDER_ATOMIC) || "0";
  return "rotate(radians(floatVal(" + angle + ")));\n";
};

Blockly.Processing.forBlock["visual_translate"] = function (block) {
  const x = Blockly.Processing.valueToCode(block, "X", Blockly.Processing.ORDER_ATOMIC) || "0";
  const y = Blockly.Processing.valueToCode(block, "Y", Blockly.Processing.ORDER_ATOMIC) || "0";
  return "translate(floatVal(" + x + "), floatVal(" + y + "));\n";
};

Blockly.Processing.forBlock["visual_scale"] = function (block) {
  const s = Blockly.Processing.valueToCode(block, "S", Blockly.Processing.ORDER_ATOMIC) || "1.0";
  return "scale(floatVal(" + s + "));\n";
};

Blockly.Processing.forBlock["visual_push_pop"] = function (block) {
  const branch = Blockly.Processing.statementToCode(block, 'STACK');
  return "pushMatrix();\npushStyle();\n" + branch + "popStyle();\npopMatrix();\n";
};

Blockly.Processing.forBlock["visual_stroke_weight"] = function (block) {
  const weight = Blockly.Processing.valueToCode(block, "WEIGHT", Blockly.Processing.ORDER_ATOMIC) || "1";
  return "strokeWeight(floatVal(" + weight + "));\n";
};

Blockly.Processing.forBlock["visual_no_stroke"] = function (block) {
  return "noStroke();\n";
};

Blockly.Processing.forBlock["visual_no_fill"] = function (block) {
  return "noFill();\n";
};

Blockly.Processing.forBlock["visual_constant"] = function (block) {
  return [block.getFieldValue("CONSTANT"), Blockly.Processing.ORDER_ATOMIC];
};

Blockly.Processing.forBlock["visual_pixel_density"] = function (block) {
  return "pixelDensity(displayDensity());\n";
};

Blockly.Processing.forBlock["visual_frame_rate"] = function (block) {
  const fps = Blockly.Processing.valueToCode(block, "FPS", Blockly.Processing.ORDER_ATOMIC) || "60";
  return "frameRate(" + fps + ");\n";
};

Blockly.Processing.forBlock['visual_stage_setup'] = function (block) {
  if (Blockly.Processing.injectAudioCore) {
    Blockly.Processing.injectAudioCore();
  }

  var w = block.getFieldValue("W");
  var h = block.getFieldValue("H");
  var bgColorHex = block.getFieldValue("BG_COLOR");
  var fgColorHex = block.getFieldValue("FG_COLOR");

  Blockly.Processing.addImport("import ddf.minim.*");
  Blockly.Processing.addImport("import ddf.minim.ugens.*");
  Blockly.Processing.addImport("import ddf.minim.analysis.*");
  Blockly.Processing.addImport("import controlP5.*");
  Blockly.Processing.addImport("import themidibus.*");
  Blockly.Processing.addImport("import processing.serial.*");
  Blockly.Processing.addImport("import java.util.Collections;");
  Blockly.Processing.addImport("import java.util.List;");
  Blockly.Processing.addImport("import java.util.Arrays;");
  Blockly.Processing.addImport("import java.util.HashMap;");
  Blockly.Processing.addImport("import java.util.HashSet;");
  Blockly.Processing.addImport("import java.awt.Toolkit;");
  Blockly.Processing.addImport("import java.awt.datatransfer.*;");

  var g = Blockly.Processing.global_vars_;
  g['minim'] = "Minim minim;";
  g['out'] = "AudioOutput out;";
  g['fft'] = "FFT fft;";
  g['cp5'] = "ControlP5 cp5;";
  g['myBus'] = "MidiBus myBus;";
  g['serialBaud'] = "int serialBaud = 115200;";
  g['serialPortVar'] = "Serial myPort;";
  g['pcKeysHeld'] = "java.util.concurrent.ConcurrentHashMap<Integer, String> pcKeysHeld = new java.util.concurrent.ConcurrentHashMap<Integer, String>();";

  g['stageBgColor'] = "int stageBgColor;";
  g['stageFgColor'] = "int stageFgColor;";
  g['currentSample'] = "Sampler currentSample;";

  g['waveScale'] = "float waveScale = 2.5;";
  g['masterGain'] = "float masterGain = -5.0;";
  g['trailAlpha'] = "float trailAlpha = 100.0;";
  g['adsrA'] = "float adsrA = 0.01;";
  g['adsrD'] = "float adsrD = 0.1;";
  g['adsrS'] = "float adsrS = 0.5;";
  g['adsrR'] = "float adsrR = 0.5;";
  var initHue = Blockly.Processing.hexToHue(fgColorHex);
  g['fgHue'] = "float fgHue = " + initHue + ";";

  g['showWave'] = "boolean showWave = true;";
  g['showSpec'] = "boolean showSpec = true;";
  g['showADSR'] = "boolean showADSR = true;";
  g['showLog'] = "boolean showLog = true;";
  g['isMidiMode'] = "boolean isMidiMode = false;";

  g['adsrTimer'] = "int adsrTimer = 0;";
  g['adsrState'] = "int adsrState = 0;";

  var helpersDef = `
  void logToScreen(String msg, int type) {
    if (cp5 == null) { println("[Early Log] " + msg); return; }
    Textarea target = (type >= 1) ? cp5.get(Textarea.class, "alertsArea") : cp5.get(Textarea.class, "consoleArea");
    if (target != null) {
      String prefix = (type == 3) ? "[ERR] " : (type == 2) ? "[WARN] " : (type == 1) ? "[!] " : "[INFO] ";
      target.append(prefix + msg + "\\n");
      target.scroll(1.0);
    }
    println((type==3?"[ERR] ":type==2?"[WARN] ":"[INFO] ") + msg);
  }

  void midiInputDevice(int n) {
    if (myBus == null) return;
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
        myPort.bufferUntil('\\n');
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
      for (int i = 0; i < inputs.length; i++) {
        sl.addItem(inputs[i], i);
      }
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
    if (key == CODED) {
      if (keyCode == UP) { pitchTranspose += 12; logToScreen("Octave UP (Trans: " + (pitchTranspose > 0 ? "+" : "") + pitchTranspose + ")", 1); }
      else if (keyCode == DOWN) { pitchTranspose -= 12; logToScreen("Octave DOWN (Trans: " + (pitchTranspose > 0 ? "+" : "") + pitchTranspose + ")", 1); }
      else if (keyCode == LEFT || keyCode == RIGHT) {
        Object[] names = instrumentMap.keySet().toArray();
        if (names.length > 0) {
          int idx = -1;
          for(int i=0; i<names.length; i++) { if(names[i].toString().equals(currentInstrument)) { idx = i; break; } }
          if (idx == -1) idx = 0; 
          else if (keyCode == RIGHT) idx = (idx + 1) % names.length;
          else idx = (idx - 1 + names.length) % names.length;
          currentInstrument = names[idx].toString();
        }
      }
    } else if (key == '=' || key == '+') { pitchTranspose += 1; logToScreen("Transpose: " + (pitchTranspose > 0 ? "+" : "") + pitchTranspose, 1); }
    else if (key == '-' || key == '_') { pitchTranspose -= 1; logToScreen("Transpose: " + (pitchTranspose > 0 ? "+" : "") + pitchTranspose, 1); }
    else if (key == BACKSPACE) { pitchTranspose = 0; logToScreen("Transpose Reset", 1); }

    int p = -1;
    char k = Character.toLowerCase(key);
    if (k == 'q') p = 60; else if (k == '2') p = 61; else if (k == 'w') p = 62;
    else if (k == '3') p = 63; else if (k == 'e') p = 64; else if (k == 'r') p = 65;
    else if (k == '5') p = 66; else if (k == 't') p = 67; else if (k == '6') p = 68;
    else if (k == 'y') p = 69; else if (k == '7') p = 70; else if (k == 'u') p = 71;
    else if (k == 'i') p = 72; else if (k == '9') p = 73; else if (k == 'o') p = 74;
    else if (k == '0') p = 75; else if (k == 'p') p = 76;

    if (p != -1) {
      if (!pcKeysHeld.containsKey(p)) {
        playNoteInternal(currentInstrument, p, 100);
        pcKeysHeld.put(p, currentInstrument);
        logToScreen("Keyboard ON: MIDI " + p, 0);
      }
    }
    {{KEY_PRESSED_EVENT_PLACEHOLDER}}
  }

  void keyReleased() {
    int p = -1;
    char k = Character.toLowerCase(key);
    if (k == 'q') p = 60; else if (k == '2') p = 61; else if (k == 'w') p = 62;
    else if (k == '3') p = 63; else if (k == 'e') p = 64; else if (k == 'r') p = 65;
    else if (k == '5') p = 66; else if (k == 't') p = 67; else if (k == '6') p = 68;
    else if (k == 'y') p = 69; else if (k == '7') p = 70; else if (k == 'u') p = 71;
    else if (k == 'i') p = 72; else if (k == '9') p = 73; else if (k == 'o') p = 74;
    else if (k == '0') p = 75; else if (k == 'p') p = 76;

    if (p != -1) {
      if (pcKeysHeld.containsKey(p)) {
        String inst = pcKeysHeld.get(p);
        stopNoteInternal(inst, p);
        pcKeysHeld.remove(p);
        logToScreen("Keyboard OFF: MIDI " + p, 0);
      }
    }
    {{KEY_RELEASED_EVENT_PLACEHOLDER}}
  }
  `;
  Blockly.Processing.definitions_['Helpers'] = helpersDef;

  var panelH = 200;
  var logW = 400;
  var totalW = parseInt(w) + logW;
  var totalH = parseInt(h) + panelH;

  Blockly.Processing.provideSetup("size(" + totalW + ", " + totalH + ");", "stage_init_size");
  Blockly.Processing.provideSetup("pixelDensity(displayDensity());", "stage_init_density");

  var setupCode = "stageBgColor = " + Blockly.Processing.hexToJavaColor(bgColorHex) + ";\n" +
    "stageFgColor = " + Blockly.Processing.hexToJavaColor(fgColorHex) + ";\n" +
    "adsrState = 0;\n" +
    "fft = new FFT(out.bufferSize(), out.sampleRate());\n" +
    "cp5 = new ControlP5(this);\n" +
    "cp5.setFont(createFont(\"Arial\", 16));\n";
  setupCode += "\n  // --- Log Textareas --- \n" +
    "cp5.addTextarea(\"alertsArea\").setPosition(" + w + ", 35).setSize(" + logW + ", " + (totalH / 2 - 35) + ")\n"
    + "   .setFont(createFont(\"Arial\", 18)).setLineHeight(22).setColor(color(255, 100, 100))\n"
    + "   .setColorBackground(color(40, 0, 0));\n"
    + "cp5.addTextarea(\"consoleArea\").setPosition(" + w + ", " + (totalH / 2 + 35) + ")\n"
    + "   .setSize(" + logW + ", " + (totalH / 2 - 35) + ").setFont(createFont(\"Arial\", 18))\n"
    + "   .setLineHeight(22).setColor(color(200)).setColorBackground(color(20));\n";

  var uiY = parseInt(h) + 30;
  var uiX = 20;
  setupCode += "\n  // --- Control Panel UI ---\n";
  setupCode += "cp5.addToggle(\"showWave\").setPosition(" + uiX + ", " + uiY + ").setSize(40, 20).setCaptionLabel(\"WAVE\");\n"; uiX += 70;
  setupCode += "cp5.addToggle(\"showADSR\").setPosition(" + uiX + ", " + uiY + ").setSize(40, 20).setCaptionLabel(\"ADSR\");\n"; uiX += 70;
  setupCode += "cp5.addToggle(\"showSpec\").setPosition(" + uiX + ", " + uiY + ").setSize(40, 20).setCaptionLabel(\"SPEC\");\n"; uiX += 70;
  setupCode += "cp5.addToggle(\"showLog\").setPosition(" + uiX + ", " + uiY + ").setSize(40, 20).setCaptionLabel(\"LOG\");\n";

  uiX = 20; var sliderY = uiY + 65;
  setupCode += "cp5.addSlider(\"trailAlpha\").setPosition(" + uiX + ", " + sliderY + ").setSize(150, 15).setRange(0, 255).setCaptionLabel(\"TRAIL\");\n"; sliderY += 30;
  setupCode += "cp5.addSlider(\"waveScale\").setPosition(" + uiX + ", " + sliderY + ").setSize(150, 15).setRange(0.1, 10).setCaptionLabel(\"SCALE\");\n"; sliderY += 30;
  setupCode += "cp5.addSlider(\"fgHue\").setPosition(" + uiX + ", " + sliderY + ").setSize(150, 15).setRange(0, 255).setValue(" + initHue + ").setCaptionLabel(\"FG COLOR\");\n";

  uiX = 320; var adsrY = parseInt(h) + 85;
  var addS = function (n, l, m) {
    // Add setDecimalPrecision and potentially more ticks if needed, but float is default
    return "cp5.addSlider(\"" + n + "\").setPosition(" + uiX + ", " + adsrY + ").setSize(15, 80).setRange(0, " + m + ").setDecimalPrecision(2).setCaptionLabel(\"" + l + "\");\n";
  };
  setupCode += addS("adsrA", "A", 2.0); uiX += 60;
  setupCode += addS("adsrD", "D", 1.0); uiX += 60;
  setupCode += addS("adsrS", "S", 1.0); uiX += 60;
  setupCode += addS("adsrR", "R", 2.0); uiX += 60;
  setupCode += "cp5.addSlider(\"masterGain\").setPosition(" + uiX + ", " + adsrY + ").setSize(15, 80).setRange(-40, 15).setCaptionLabel(\"GAIN\");\n";

  uiX += 100;
  setupCode += "String[] serialPorts = Serial.list();\n"
    + "ScrollableList ssl = cp5.addScrollableList(\"serialInputDevice\").setPosition(" + uiX + ", " + (uiY + 40) + ").setSize(300, 150).setBarHeight(30).setItemHeight(25).setCaptionLabel(\"SERIAL PORT\");\n"
    + "for (int i = 0; i < serialPorts.length; i++) { ssl.addItem(serialPorts[i], i); }\n"
    + "ssl.close();\n"
    + "String[] startInputs = MidiBus.availableInputs();\n"
    + "println(\"--- MIDI Devices ---\");\n"
    + "for(String s : startInputs) println(\"  > \" + s);\n"
    + "ScrollableList sl = cp5.addScrollableList(\"midiInputDevice\").setPosition(" + uiX + ", " + uiY + ").setSize(300, 150).setBarHeight(30).setItemHeight(25).setCaptionLabel(\"MIDI DEVICE\");\n"
    + "for (int i = 0; i < startInputs.length; i++) { sl.addItem(startInputs[i], i); }\n"
    + "if (startInputs.length > 0) sl.setValue(0);\n"
    + "sl.close();\n";

  setupCode += "cp5.addButton(\"scanMidi\").setPosition(" + (uiX + 310) + ", " + uiY + ").setSize(50, 30).setCaptionLabel(\"SCAN\");\n";
  setupCode += "cp5.addButton(\"copyLogs\").setPosition(" + (totalW - 195) + ", 5).setSize(90, 25).setCaptionLabel(\"COPY LOG\");\n";
  setupCode += "cp5.addButton(\"clearLogs\").setPosition(" + (totalW - 100) + ", 5).setSize(90, 25).setCaptionLabel(\"CLEAR LOG\");\n";
  setupCode += "logToScreen(\"System Initialized.\", 0);\n";
  setupCode += "surface.setTitle(\"Super Stage\");\n";
  setupCode += "surface.setVisible(true);\n";
  setupCode += "if (surface.getNative() instanceof java.awt.Canvas) { ((java.awt.Canvas)surface.getNative()).requestFocus(); }\n";

  Blockly.Processing.provideSetup(setupCode, "stage_main_setup");

  var drawCode = "pushStyle(); colorMode(HSB, 255); stageFgColor = color(fgHue, 255, 255); popStyle();\n"
    + "masterGainUGen.setValue(masterGain); noStroke(); fill(30); rect(0, " + h + ", width, " + panelH + ");\n"
    + "// Peak detection sync with CLIP flag from audio thread\n"
    + "if (out != null) {\n"
    + "  for(int i = 0; i < out.bufferSize(); i++) {\n"
    + "    if (Math.abs(out.mix.get(i)) > 0.99f) { isMasterClipping = true; clippingTimer = millis(); break; }\n"
    + "  }\n"
    + "}\n"
    + "if (isMasterClipping && millis() - clippingTimer > 500) { isMasterClipping = false; }\n"
    + "// Draw rainbow bar behind fgHue slider\n"
    + "pushStyle(); for (int i = 0; i < 150; i++) { colorMode(HSB, 150); stroke(i, 150, 150); line(20 + i, " + (uiY + 125 + 15 + 2) + ", 20 + i, " + (uiY + 125 + 15 + 5) + "); } popStyle();\n"
    + "colorMode(RGB, 255); float currentVisualW = showLog ? " + w + ".0 : width;\n"
    + "noStroke(); fill(stageBgColor, 255 - trailAlpha); rect(0, 0, currentVisualW, " + h + ");\n"
    + "int activeViews = int(showWave) + int(showADSR) + int(showSpec);\n"
    + "if (activeViews > 0) {\n"
    + "  float viewW = currentVisualW / float(activeViews); float currentX = 0;\n"
    + "  stroke(stageFgColor); strokeWeight(2); noFill();\n";

  drawCode += "  if (showWave) {\n"
    + "    pushMatrix(); translate(currentX, 0); stroke(stageFgColor);\n"
    + "    for(int i = 0; i < out.bufferSize() - 1; i++) {\n"
    + "      float x1 = map(i, 0, out.bufferSize(), 0, viewW);\n"
    + "      float x2 = map(i+1, 0, out.bufferSize(), 0, viewW);\n"
    + "      line(x1, " + h + "/2 + out.mix.get(i) * waveScale * 100, x2, " + h + "/2 + out.mix.get(i+1) * waveScale * 100);\n"
    + "    }\n"
    + "    stroke(50); line(viewW, 0, viewW, " + h + ");\n"
    + "    popMatrix(); currentX += viewW;\n"
    + "  }\n";

  drawCode += "  if (showADSR) {\n"
    + "    pushMatrix(); translate(currentX, 0); pushStyle(); colorMode(HSB, 255); stroke(color((fgHue + 40)%255, 200, 255));\n"
    + "    float visT = 4.0; float xA = map(adsrA, 0, visT, 0, viewW); float xD = map(adsrA+adsrD, 0, visT, 0, viewW);\n"
    + "    float xS = map(adsrA+adsrD+1.0, 0, visT, 0, viewW); float xR = map(adsrA+adsrD+1.0+adsrR, 0, visT, 0, viewW);\n"
    + "    float yB = " + h + " * 0.9; float yS = yB - (adsrS * " + h + " * 0.7);\n"
    + "    float yP = (adsrD > 0 || adsrS < 1.0) ? " + h + " * 0.2 : yS;\n"
    + "    beginShape(); vertex(0, yB); vertex(xA, yP); vertex(xD, yS); vertex(xS, yS); vertex(xR, yB); endShape();\n"
    + "    float dX = 0; float dY = yB;\n"
    + "    if (adsrState == 1) {\n"
    + "      float e = (millis()-adsrTimer)/1000.0;\n"
    + "      if (e < adsrA) { dX = map(e, 0, adsrA, 0, xA); dY = map(e, 0, adsrA, yB, yP); }\n"
    + "      else if (e < adsrA+adsrD) { dX = map(e, adsrA, adsrA+adsrD, xA, xD); dY = map(e, adsrA, adsrA+adsrD, yP, yS); }\n"
    + "      else { dX = lerp(xD, xS, (sin(millis()*0.005)+1)/2.0); dY = yS; }\n"
    + "    } else if (adsrState == 2) {\n"
    + "      float re = (millis()-adsrTimer)/1000.0;\n"
    + "      if (re < adsrR) { dX = map(re, 0, adsrR, xS, xR); dY = map(re, 0, adsrR, yS, yB); }\n"
    + "      else { adsrState = 0; dX = xR; dY = yB; }\n"
    + "    }\n"
    + "    if (adsrState > 0) { fill(255); ellipse(dX, dY, 8, 8); }\n"
    + "    popStyle(); stroke(50); line(viewW, 0, viewW, " + h + "); popMatrix(); currentX += viewW;\n"
    + "  }\n";

  drawCode += "  if (showSpec) {\n"
    + "    pushMatrix(); translate(currentX, 0); pushStyle(); colorMode(HSB, 255); fft.forward(out.mix);\n"
    + "    for(int i = 0; i < fft.specSize(); i++) {\n"
    + "      float x = map(i, 0, fft.specSize(), 0, viewW);\n"
    + "      float y = map(fft.getBand(i), 0, 50, " + h + ", " + h + "*0.2);\n"
    + "      stroke((fgHue + map(i, 0, fft.specSize(), 0, 80)) % 255, 200, 255);\n"
    + "      line(x, " + h + ", x, y);\n"
    + "    }\n"
    + "    popStyle(); popMatrix();\n"
    + "  }\n}\n";

  drawCode += "if (cp5.get(Textarea.class, \"alertsArea\") != null) {\n"
    + "  if (showLog) {\n"
    + "    cp5.get(Textarea.class, \"alertsArea\").show(); cp5.get(Textarea.class, \"consoleArea\").show();\n"
    + "    pushMatrix(); translate(" + w + ", 0); float spH = height / 2.0;\n"
    + "    fill(40, 0, 0); rect(0, 0, " + logW + ", spH); fill(255, 100, 100); text(\"ALERTS\", 10, 25);\n"
    + "    translate(0, spH); fill(20); rect(0, 0, " + logW + ", height-spH); fill(200); text(\"CONSOLE\", 10, 25);\n"
    + "    popMatrix();\n"
    + "  } else {\n"
    + "    cp5.get(Textarea.class, \"alertsArea\").hide(); cp5.get(Textarea.class, \"consoleArea\").hide();\n"
    + "  }\n"
    + "}\n";

  drawCode += "if (isMasterClipping) {\n"
    + "  pushStyle(); fill(255, 0, 0, (sin(millis()*0.02)+1)*127); noStroke();\n"
    + "  rect(currentVisualW/2 - 40, 10, 80, 25, 5);\n"
    + "  fill(255); textSize(16); textAlign(CENTER, CENTER);\n"
    + "  text(\"CLIP\", currentVisualW/2, 22);\n"
    + "  popStyle();\n"
    + "}\n";

  Blockly.Processing.provideDraw(drawCode);
  if (Blockly.Processing.definitions_['AudioCore']) {
    Blockly.Processing.provideDraw('updateInstrumentUISync();\n');
  }
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
