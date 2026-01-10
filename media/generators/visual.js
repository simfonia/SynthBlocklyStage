/**
 * Visual Generators
 */
Blockly.Processing.hexToJavaColor = function(hex) {
  var r = parseInt(hex.substring(1, 3), 16);
  var g = parseInt(hex.substring(3, 5), 16);
  var b = parseInt(hex.substring(5, 7), 16);
  return "color(" + r + ", " + g + ", " + b + ")";
};
Blockly.Processing.forBlock["visual_size"] = function(block) {
  return "size(" + block.getFieldValue("WIDTH") + ", " + block.getFieldValue("HEIGHT") + ");\n";
};
Blockly.Processing.forBlock["visual_background"] = function(block) {
  const r = Blockly.Processing.valueToCode(block, "R", Blockly.Processing.ORDER_ATOMIC) || "0";
  return "background(" + r + ");\n";
};
Blockly.Processing.forBlock["visual_rect"] = function(block) {
  const x = Blockly.Processing.valueToCode(block, "X", Blockly.Processing.ORDER_ATOMIC) || "0";
  const y = Blockly.Processing.valueToCode(block, "Y", Blockly.Processing.ORDER_ATOMIC) || "0";
  const w = Blockly.Processing.valueToCode(block, "W", Blockly.Processing.ORDER_ATOMIC) || "100";
  const h = Blockly.Processing.valueToCode(block, "H", Blockly.Processing.ORDER_ATOMIC) || "100";
  return "rect(" + x + ", " + y + ", " + w + ", " + h + ");\n";
};
Blockly.Processing.forBlock["visual_line"] = function(block) {
  const x1 = Blockly.Processing.valueToCode(block, "X1", Blockly.Processing.ORDER_ATOMIC) || "0";
  const y1 = Blockly.Processing.valueToCode(block, "Y1", Blockly.Processing.ORDER_ATOMIC) || "0";
  const x2 = Blockly.Processing.valueToCode(block, "X2", Blockly.Processing.ORDER_ATOMIC) || "0";
  const y2 = Blockly.Processing.valueToCode(block, "Y2", Blockly.Processing.ORDER_ATOMIC) || "0";
  return "line(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ");\n";
};
Blockly.Processing.forBlock["visual_fill"] = function(block) {
  const r = Blockly.Processing.valueToCode(block, "R", Blockly.Processing.ORDER_ATOMIC) || "255";
  return "fill(" + r + ");\n";
};
Blockly.Processing.forBlock["visual_stroke"] = function(block) {
  const r = Blockly.Processing.valueToCode(block, "R", Blockly.Processing.ORDER_ATOMIC) || "0";
  return "stroke(" + r + ");\n";
};
Blockly.Processing.forBlock["visual_stroke_weight"] = function(block) {
  const w = Blockly.Processing.valueToCode(block, "WEIGHT", Blockly.Processing.ORDER_ATOMIC) || "1";
  return "strokeWeight(" + w + ");\n";
};
Blockly.Processing.forBlock["visual_no_stroke"] = function(block) { return "noStroke();\n"; };
Blockly.Processing.forBlock["visual_no_fill"] = function(block) { return "noFill();\n"; };
Blockly.Processing.forBlock["visual_constant"] = function(block) {
  return [block.getFieldValue("CONSTANT"), Blockly.Processing.ORDER_ATOMIC];
};
Blockly.Processing.forBlock["visual_pixel_density"] = function(block) {
  return "pixelDensity(displayDensity());\n";
};
Blockly.Processing.forBlock["visual_stage_setup"] = function(block) {
  var w = block.getFieldValue("W");
  var h = block.getFieldValue("H");
  var bgColorInitial = block.getFieldValue("BG_COLOR");
  var waveColorInitial = block.getFieldValue("WAVE_COLOR");
  var showWave = block.getFieldValue("SHOW_WAVE") === "TRUE";
  var midiInRaw = block.getFieldValue("MIDI_IN");
  var midiIn = isNaN(midiInRaw) || midiInRaw.trim() === "" ? "\"" + midiInRaw + "\"" : midiInRaw;
  Blockly.Processing.addImport("import ddf.minim.*;");
  Blockly.Processing.addImport("import ddf.minim.analysis.*;");
  Blockly.Processing.addImport("import controlP5.*;");
  Blockly.Processing.addImport("import themidibus.*;");
  Blockly.Processing.definitions_["stage_vars"] = "Minim minim;\nAudioOutput out;\nControlP5 cp5;\nMidiBus myBus;\nint stageBgColor, stageWaveColor;\nfloat waveScale = 1.0; // 預設縮放比例\n";
  var setupCode = "size(" + w + ", " + h + ");\npixelDensity(displayDensity());\nstageBgColor = " + Blockly.Processing.hexToJavaColor(bgColorInitial) + ";\nstageWaveColor = " + Blockly.Processing.hexToJavaColor(waveColorInitial) + ";\nminim = new Minim(this);\nout = minim.getLineOut();\ncp5 = new ControlP5(this);\nMidiBus.list();\nmyBus = new MidiBus(this, " + midiIn + ", -1);\n";
  Blockly.Processing.provideSetup(setupCode);
  var drawCode = "background(stageBgColor);\n";
  if (showWave) {
    drawCode += "if (currentSample != null) {\n stroke(stageWaveColor);\n strokeWeight(2);\n noFill();\n for(int i = 0; i < currentSample.bufferSize() - 1; i++) {\n float x1 = map(i, 0, currentSample.bufferSize(), 0, 800);\n float x2 = map(i+1, 0, currentSample.bufferSize(), 0, 800);\n line(x1, height/2 + currentSample.mix.get(i) * waveScale * 100, x2, height/2 + currentSample.mix.get(i+1) * waveScale * 100);\n }\n } else if (out != null) {\n stroke(stageWaveColor);\n strokeWeight(2);\n noFill();\n for(int i = 0; i < out.bufferSize() - 1; i++) {\n float x1 = map(i, 0, out.bufferSize(), 0, 800);\n float x2 = map(i+1, 0, out.bufferSize(), 0, 800);\n line(x1, height/2 + out.left.get(i) * 100, x2, height/2 + out.left.get(i+1) * 100);\n }\n }\n";
  }
  Blockly.Processing.provideDraw(drawCode);
  return "";
};
Blockly.Processing.forBlock["visual_stage_set_color"] = function(block) {
  var target = block.getFieldValue("TARGET");
  var color = Blockly.Processing.valueToCode(block, "COLOR", Blockly.Processing.ORDER_ASSIGNMENT) || "color(255)";
  var varName = (target === "BG") ? "stageBgColor" : "stageWaveColor";
  return varName + " = " + color + ";\n";
};
Blockly.Processing.forBlock["visual_color_picker"] = function(block) {
  var hex = block.getFieldValue("COLOR");
  return [Blockly.Processing.hexToJavaColor(hex), Blockly.Processing.ORDER_ATOMIC];
};
