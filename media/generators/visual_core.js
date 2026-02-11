/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Visual Core Generators: Stage setup, UI injection, and Colors.
 */

Blockly.Processing.registerGenerator("visual_size", function (block) {
  return "size(" + block.getFieldValue("WIDTH") + ", " + block.getFieldValue("HEIGHT") + ");\n";
});

Blockly.Processing.registerGenerator("visual_background", function (block) {
  const color = Blockly.Processing.valueToCode(block, "COLOR", Blockly.Processing.ORDER_ATOMIC) || "color(0)";
  return "background(" + color + ");\n";
});

Blockly.Processing.registerGenerator("visual_constant", function (block) {
  return [block.getFieldValue("CONSTANT"), Blockly.Processing.ORDER_ATOMIC];
});

Blockly.Processing.registerGenerator("visual_pixel_density", function (block) {
  return "pixelDensity(displayDensity());\n";
});

Blockly.Processing.registerGenerator("visual_frame_rate", function (block) {
  const fps = Blockly.Processing.valueToCode(block, "FPS", Blockly.Processing.ORDER_ATOMIC) || "60";
  return "frameRate(" + fps + ");\n";
});

Blockly.Processing.registerGenerator('visual_stage_set_color', function (block) {
  var target = block.getFieldValue('TARGET');
  var color = Blockly.Processing.valueToCode(block, 'COLOR', Blockly.Processing.ORDER_ASSIGNMENT) || 'color(255)';
  var varName = (target === 'BG') ? 'stageBgColor' : 'stageFgColor';
  return varName + " = " + color + ";\n";
});

Blockly.Processing.registerGenerator('visual_color_picker', function (block) {
  var hex = block.getFieldValue('COLOR');
  return [window.SB_Utils.hexToJavaColor(hex), Blockly.Processing.ORDER_ATOMIC];
});

Blockly.Processing.registerGenerator('visual_stage_setup', function (block) {
  if (Blockly.Processing.injectAudioCore) {
    Blockly.Processing.injectAudioCore();
  }

  var w = block.getFieldValue("W");
  var h = block.getFieldValue("H");
  var bgColorHex = block.getFieldValue("BG_COLOR");
  var fgColorHex = block.getFieldValue("FG_COLOR");

  Blockly.Processing.addImport("import ddf.minim.*;");
  Blockly.Processing.addImport("import ddf.minim.ugens.*;");
  Blockly.Processing.addImport("import ddf.minim.analysis.*;");
  Blockly.Processing.addImport("import controlP5.*;");
  Blockly.Processing.addImport("import themidibus.*;");
  Blockly.Processing.addImport("import processing.serial.*;");
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
  var initHue = window.SB_Utils.hexToHue(fgColorHex);
  g['fgHue'] = "float fgHue = " + initHue + ";";

  g['showWave'] = "boolean showWave = true;";
  g['showSpec'] = "boolean showSpec = true;";
  g['showADSR'] = "boolean showADSR = true;";
  g['showLog'] = "boolean showLog = true;";
  g['isMidiMode'] = "boolean isMidiMode = false;";

  g['adsrTimer'] = "int adsrTimer = 0;";
  g['adsrState'] = "int adsrState = 0;";

  // Use Centralized General Helpers from JavaLibs
  Blockly.Processing.definitions_['Helpers'] = window.SB_JavaLibs.GENERAL_HELPERS;

  var panelH = 200;
  var logW = 400;
  var totalW = parseInt(w) + logW;
  var totalH = parseInt(h) + panelH;

  Blockly.Processing.provideSetup("size(" + totalW + ", " + totalH + ");", "stage_init_size");
  Blockly.Processing.provideSetup("pixelDensity(displayDensity());", "stage_init_density");

  var setupCode = "stageBgColor = " + window.SB_Utils.hexToJavaColor(bgColorHex) + ";\n" +
    "stageFgColor = " + window.SB_Utils.hexToJavaColor(fgColorHex) + ";\n" +
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
});