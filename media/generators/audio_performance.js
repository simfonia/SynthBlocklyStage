/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Audio Performance Generators: Playing Notes, Melodies, and Sequencing.
 */

Blockly.Processing.registerGenerator('sb_play_note', function(block) {
  Blockly.Processing.injectAudioCore();
  const name = block.getFieldValue('NAME');
  const javaName = window.SB_Utils.getInstrumentJavaName(name);
  const pitch = Blockly.Processing.valueToCode(block, 'PITCH', Blockly.Processing.ORDER_ATOMIC) || '60';
  const velocity = Blockly.Processing.valueToCode(block, 'VELOCITY', Blockly.Processing.ORDER_ATOMIC) || '100';
  return `playNoteInternal(${javaName}, getMidi(${pitch}), floatVal(${velocity}));\n`;
});

Blockly.Processing.registerGenerator('sb_play_drum', function(block) {
  Blockly.Processing.injectAudioCore();
  const type = block.getFieldValue('TYPE');
  const velocity = Blockly.Processing.valueToCode(block, 'VELOCITY', Blockly.Processing.ORDER_ATOMIC) || '100';
  return `playBuiltinDrum("${type}", floatVal(${velocity}));\n`;
});

Blockly.Processing.registerGenerator('sb_stop_note', function(block) {
  Blockly.Processing.injectAudioCore();
  const name = block.getFieldValue('NAME');
  const javaName = window.SB_Utils.getInstrumentJavaName(name);
  const pitch = Blockly.Processing.valueToCode(block, 'PITCH', Blockly.Processing.ORDER_ATOMIC) || '60';
  return `stopNoteInternal(${javaName}, getMidi(${pitch}));\n`;
});

Blockly.Processing.registerGenerator('sb_trigger_sample', function(block) {
  Blockly.Processing.injectAudioCore();
  const name = block.getFieldValue('NAME');
  const velocity = Blockly.Processing.valueToCode(block, 'VELOCITY', Blockly.Processing.ORDER_ATOMIC) || '100';
  const note = block.getFieldValue('NOTE') || 'C4Q';
  return `parseAndPlayNote("${name}", "${note}", floatVal(${velocity}));\n`;
});

Blockly.Processing.registerGenerator('sb_play_melody', function(block) {
  Blockly.Processing.injectAudioCore();
  const melody = block.getFieldValue('MELODY') || "";
  const name = block.getFieldValue('INSTRUMENT');
  const javaName = window.SB_Utils.getInstrumentJavaName(name);
  // Important: replace real newlines with spaces for Java string literal
  const cleanMelody = melody.replace(/\n/g, ' ').replace(/"/g, '\\"');
  return `playMelodyInternal("${cleanMelody}", ${javaName});\n`;
});

Blockly.Processing.registerGenerator('sb_play_chord_by_name', function(block) {
  Blockly.Processing.injectAudioCore();
  const name = block.getFieldValue('INST_NAME');
  const javaName = window.SB_Utils.getInstrumentJavaName(name);
  const chordName = block.getFieldValue('NAME');
  const dur = Blockly.Processing.valueToCode(block, 'DUR', Blockly.Processing.ORDER_ATOMIC) || '"4n"';
  const velocity = Blockly.Processing.valueToCode(block, 'VELOCITY', Blockly.Processing.ORDER_ATOMIC) || '100';
  return `{ 
  Object dVal = ${dur};
  float ms = (dVal instanceof Number) ? ((Number)dVal).floatValue() : durationToMs(dVal.toString());
  playChordByNameInternal(${javaName}, "${chordName}", ms, floatVal(${velocity}));
}\n`;
});

Blockly.Processing.registerGenerator('sb_transport_count_in', function(block) {
  Blockly.Processing.injectAudioCore();
  const measures = Blockly.Processing.valueToCode(block, 'MEASURES', Blockly.Processing.ORDER_ATOMIC) || '1';
  const beats = Blockly.Processing.valueToCode(block, 'BEATS', Blockly.Processing.ORDER_ATOMIC) || '4';
  const beatUnit = Blockly.Processing.valueToCode(block, 'BEAT_UNIT', Blockly.Processing.ORDER_ATOMIC) || '4';
  const velocity = Blockly.Processing.valueToCode(block, 'VELOCITY', Blockly.Processing.ORDER_ATOMIC) || '100';
  
  const setupCode = `isCountingIn = true;
  new Thread(new Runnable() {
    public void run() {
      try {
        Thread.sleep(1000); 
        logToScreen("--- COUNT IN START (" + floatVal(${beats}) + "/" + floatVal(${beatUnit}) + ") ---", 1);
        float beatDelay = (60000.0f / bpm) * (4.0f / floatVal(${beatUnit}));
        for (int m=0; m<(int)floatVal(${measures}); m++) {
          for (int b=0; b<(int)floatVal(${beats}); b++) {
            playClick((b==0 ? 880.0f : 440.0f), floatVal(${velocity}));
            Thread.sleep((long)beatDelay);
          }
        }
      } catch (Exception e) {
      } finally {
        isCountingIn = false;
        logToScreen("--- PLAY ---", 1);
      }
    }
  }).start();`;
  Blockly.Processing.provideSetup(setupCode);
  return "";
});

Blockly.Processing.registerGenerator('sb_transport_set_bpm', function(block) {
  Blockly.Processing.injectAudioCore();
  const bpm = Blockly.Processing.valueToCode(block, 'BPM', Blockly.Processing.ORDER_ATOMIC) || '120';
  return `bpm = floatVal(${bpm});\n`;
});

Blockly.Processing.registerGenerator('sb_tone_loop', function(block) {
  Blockly.Processing.injectAudioCore();
  const interval = block.getFieldValue('INTERVAL') || '1m';
  const branch = Blockly.Processing.statementToCode(block, 'DO');
  const code = `new Thread(new Runnable() {
    public void run() {
      activeMelodyCount++;
      try { Thread.sleep(200); } catch(Exception e) {}
      int timeout = 0;
      while(isCountingIn && timeout < 500) { try { Thread.sleep(10); timeout++; } catch(Exception e) {} }
      while (true) {
        float ms = 2000;
        String iv = "${interval}";
        try {
          if (iv.endsWith("m")) { ms = (60000/bpm) * 4 * (iv.length() > 1 ? Float.parseFloat(iv.substring(0, iv.length()-1)) : 1.0f); }
          else if (iv.endsWith("n")) { ms = (60000/bpm) * (4.0f / Float.parseFloat(iv.substring(0, iv.length()-1))); }
        } catch(Exception e) { ms = (60000/bpm) * 4; }
        
        ${branch.replace(/\n/g, '\n        ')}
        try { Thread.sleep((long)ms); } catch (Exception e) {}
      }
    }
  }).start();\n`;
  Blockly.Processing.provideSetup(code);
  return "";
});

Blockly.Processing.registerGenerator('sb_perform', function(block) {
  Blockly.Processing.injectAudioCore();
  const branch = Blockly.Processing.statementToCode(block, 'DO');
  const code = `new Thread(new Runnable() {
    public void run() {
      activeMelodyCount++;
      try { Thread.sleep(200); } catch(Exception e) {}
      int timeout = 0;
      while(isCountingIn && timeout < 500) { try { Thread.sleep(10); timeout++; } catch(Exception e) {} }
      ${branch.replace(/\n/g, '\n      ')}
      activeMelodyCount--;
    }
  }).start();\n`;
  Blockly.Processing.provideSetup(code);
  return "";
});

Blockly.Processing.registerGenerator('sb_rhythm_sequence', function(block) {
  Blockly.Processing.injectAudioCore();
  const source = block.getFieldValue('SOURCE');
  const pattern = block.getFieldValue('PATTERN');
  const measure = Blockly.Processing.valueToCode(block, 'MEASURE', Blockly.Processing.ORDER_ATOMIC) || '1';
  const velocity = Blockly.Processing.valueToCode(block, 'VELOCITY', Blockly.Processing.ORDER_ATOMIC) || '100';
  const isChordMode = (block.getFieldValue('CHORD_MODE') === 'TRUE');
  
  let code = 'new Thread(new Runnable() {\n  public void run() {\n    int timeout = 0;\n';
  code += '    while(isCountingIn && timeout < 500) { try { Thread.sleep(10); timeout++; } catch(Exception e) {} }\n';
  code += '    try { Thread.sleep((long)(((floatVal(' + measure + ')-1) * 4 * 60000) / bpm)); } catch(Exception e) {}\n';
  code += '    String rawPattern = "' + pattern + '";\n    ArrayList<String> parsed = new ArrayList<String>();\n';
  code += '    if (rawPattern.contains(",")) { String[] parts = rawPattern.split(","); for(String p : parts) parsed.add(p.trim()); }\n';
  code += '    else { String raw = rawPattern.replace("|", " "); StringBuilder buf = new StringBuilder(); for (int i=0; i<raw.length(); i++) { char c = raw.charAt(i); if (c == \' \') { if (buf.length() > 0) { parsed.add(buf.toString()); buf.setLength(0); } } else if (c == \'.\' || c == \'-\') { if (buf.length() > 0) { parsed.add(buf.toString()); buf.setLength(0); } parsed.add(String.valueOf(c)); } else { buf.append(c); } } if (buf.length() > 0) parsed.add(buf.toString()); }\n';
  code += '    String[] steps = parsed.toArray(new String[0]); float stepMs = (60000 / bpm) / 4;\n';
  code += '    for (int i=0; i<Math.min(steps.length, 16); i++) {\n      String token = steps[i].trim(); if (token.equals(".")) { try { Thread.sleep((long)stepMs); } catch (Exception e) {} continue; }\n';
  code += '      int sustainSteps = 1; for (int j=i+1; j<Math.min(steps.length, 16); j++) { if (steps[j].trim().equals("-")) sustainSteps++; else break; }\n';
  code += '      float noteDur = stepMs * sustainSteps;\n      if (!token.equals("-")) {\n';
  code += '        if (instrumentMap.getOrDefault("' + source + '", "").equals("DRUM")) { if (token.equalsIgnoreCase("x")) { float volScale = instrumentVolumes.getOrDefault("' + source + '", 1.0f); samplerGainMap.get("' + source + '").setValue(map(floatVal(' + velocity + ') * volScale, 0, 127, -40, 0)); samplerMap.get("' + source + '").trigger(); } }\n';
  code += '        else { if (' + isChordMode + ') { if (token.equals("x")) token = "C"; if (chords.containsKey(token)) playChordByNameInternal("' + source + '", token, noteDur * 0.9f, floatVal(' + velocity + ')); else { int midi = noteToMidi(token); if (midi >= 0) playNoteForDuration("' + source + '", midi, floatVal(' + velocity + '), noteDur * 0.9f); } }\n';
  code += '        else { if (token.equalsIgnoreCase("x")) playNoteForDuration("' + source + '", 60, floatVal(' + velocity + '), noteDur * 0.8f); else { int midi = noteToMidi(token); if (midi >= 0) playNoteForDuration("' + source + '", midi, floatVal(' + velocity + '), noteDur * 0.9f); } } }\n      }\n';
  code += '      try { Thread.sleep((long)stepMs); } catch (Exception e) {}\n    }\n  }\n}).start();\n';
  return code;
});

Blockly.Processing.registerGenerator('sb_rhythm_sequencer_v2', function(block) {
  const measure = block.getFieldValue('MEASURE') || '1';
  const beats = block.getFieldValue('BEATS') || '4';
  const resolution = block.getFieldValue('RESOLUTION') || '4';
  let code = "";
  for (let i = 0; i < block.itemCount_; i++) {
    const inst = block.getFieldValue('INST' + i) || "default";
    const vel = block.getFieldValue('VEL' + i) || "100";
    const isChordMode = (block.getFieldValue('MODE' + i) === 'TRUE');
    const pattern = block.getFieldValue('PATTERN' + i) || "";
    code += 'new Thread(new Runnable() {\n  public void run() {\n    int timeout = 0; while(isCountingIn && timeout < 500) { try { Thread.sleep(10); timeout++; } catch(Exception e) {} }\n';
    code += '    try { float beatMs = 60000.0f / bpm; float measureMs = beatMs * ' + beats + '.0f; Thread.sleep((long)(((' + measure + '-1) * measureMs))); } catch (Exception e) {}\n';
    code += '    String rawPattern = "' + pattern + '"; ArrayList<String> parsed = new ArrayList<String>(); StringBuilder buf = new StringBuilder();\n';
    code += '    for (int j=0; j<rawPattern.length(); j++) { char c = rawPattern.charAt(j); if (c == \' \') { if (buf.length() > 0) { parsed.add(buf.toString()); buf.setLength(0); } } else if (c == \'.\' || c == \'-\' || c == \'|\') { if (buf.length() > 0) { parsed.add(buf.toString()); buf.setLength(0); } if (c != \'|\') parsed.add(String.valueOf(c)); } else { buf.append(c); } } if (buf.length() > 0) parsed.add(buf.toString());\n';
    code += '    String[] steps = parsed.toArray(new String[0]); float stepMs = (60000.0f / bpm) / ' + resolution + '.0f;\n';
    code += '    for (int k=0; k<steps.length; k++) { String token = steps[k].trim(); if (token.equals(".") || token.equals("-")) { try { Thread.sleep((long)stepMs); } catch (Exception e) {} continue; }\n';
    code += '      int sustainSteps = 1; for (int next=k+1; next<steps.length; next++) { if (steps[next].trim().equals("-")) sustainSteps++; else break; }\n';
    code += '      float noteDur = stepMs * sustainSteps; if (token.length() > 0) {\n';
    code += '        if (instrumentMap.getOrDefault("' + inst + '", "").equals("DRUM")) { if (token.equalsIgnoreCase("x")) { float volScale = instrumentVolumes.getOrDefault("' + inst + '", 1.0f); samplerGainMap.get("' + inst + '").setValue(map(' + vel + ' * volScale, 0, 127, -40, 0)); samplerMap.get("' + inst + '").trigger(); } }\n';
    code += '        else { if (' + isChordMode + ') { if (token.equals("x")) token = "C"; if (chords.containsKey(token)) playChordByNameInternal("' + inst + '", token, noteDur * 0.9f, (float)' + vel + '); else { int midi = noteToMidi(token); if (midi >= 0) playNoteForDuration("' + inst + '", midi, (float)' + vel + ', noteDur * 0.9f); } }\n';
    code += '        else { if (token.equalsIgnoreCase("x")) playNoteForDuration("' + inst + '", 60, (float)' + vel + ', noteDur * 0.8f); else { int midi = noteToMidi(token); if (midi >= 0) playNoteForDuration("' + inst + '", midi, (float)' + vel + ', noteDur * 0.9f); } } }\n      }\n';
    code += '      try { Thread.sleep((long)stepMs); } catch (Exception e) {}\n    }\n  }\n}).start();\n';
  }
  return code;
});

Blockly.Processing.registerGenerator('sb_musical_section', function(block) {
  const duration = Blockly.Processing.valueToCode(block, 'DURATION', Blockly.Processing.ORDER_ATOMIC) || '1';
  const branch = Blockly.Processing.statementToCode(block, 'STACK');
  return branch + `delay((int)((float)(${duration}) * 4.0f * 60000.0f / bpm));\n`;
});

Blockly.Processing.registerGenerator('sb_wait_musical', function(block) {
  const val = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_ATOMIC) || '1';
  const unit = block.getFieldValue('UNIT');
  if (unit === 'BEATS') return `delay((int)((float)(${val}) * 60000.0f / bpm));\n`;
  if (unit === 'MEASURES') return `delay((int)((float)(${val}) * 4.0f * 60000.0f / bpm));\n`;
  if (unit === 'SECONDS') return `delay((int)((float)(${val}) * 1000.0f));\n`;
  if (unit === 'MICROS') return `try { long totalMicros = (long)(${val}); Thread.sleep(totalMicros / 1000, (int)((totalMicros % 1000) * 1000)); } catch(Exception e) {}\n`;
  return `delay((int)(${val}));\n`;
});

Blockly.Processing.registerGenerator('sb_define_chord', function(block) {
  Blockly.Processing.injectAudioCore();
  const name = block.getFieldValue('NAME');
  const notes = (block.getFieldValue('NOTES') || "").split(',').map(s => `"${s.trim()}"`);
  return `chords.put("${name}", new String[]{${notes.join(', ')}});\n`;
});

Blockly.Processing.registerGenerator('sb_audio_is_playing', function(block) {
  return ['(activeMelodyCount > 0)', Blockly.Processing.ORDER_RELATIONAL];
});

Blockly.Processing.registerGenerator('sb_wait_until_finished', function(block) {
  return `while(activeMelodyCount > 0) { try { Thread.sleep(50); } catch(Exception e) {} }\n`;
});

Blockly.Processing.registerGenerator('sb_select_current_instrument', function(block) {
  const name = block.getFieldValue('NAME');
  return `currentInstrument = "${name}";\n`;
});
