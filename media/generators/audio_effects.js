/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 */

/**
 * Audio Effects Generators: Filters, Reverbs, Delays and Param Control.
 */

Blockly.Processing.registerGenerator('sb_setup_effect', function(block) {
  Blockly.Processing.injectAudioCore();
  let name = Blockly.Processing.currentGenInstrumentName || "Master";
  const type = block.getFieldValue('EFFECT_TYPE');
  let finalTarget = (name === "Master") ? "masterGainUGen" : '((UGen)instrumentPans.getOrDefault("' + name + '", getInstrumentMixer("' + name + '")))';
  let endVar = (name === "Master") ? "masterEffectEnd" : '(UGen)instrumentEffectEnds.getOrDefault("' + name + '", getInstrumentMixer("' + name + '"))';
  let code = `{
`;

  if (type === 'filter') {
    const freq = Blockly.Processing.valueToCode(block, 'FILTER_FREQ', Blockly.Processing.ORDER_ATOMIC) || '1000';
    const q = Blockly.Processing.valueToCode(block, 'FILTER_Q', Blockly.Processing.ORDER_ATOMIC) || '1';
    code += `  if (instrumentFilters.containsKey("${name}")) { updateFilter("${name}", (float)${freq}, (float)${q}); }
`;
    code += `  else { UGen prev = ${endVar}; prev.unpatch(${finalTarget}); UGen f = new MoogFilter((float)${freq}, constrain((float)${q}, 0.0f, 0.9f)); instrumentFilters.put("${name}", f); prev.patch(f).patch(${finalTarget}); `;
    code += (name === "Master") ? `masterEffectEnd = f; }
` : `instrumentEffectEnds.put("${name}", f); }
`;
  } else if (type === 'autofilter') {
    const rate = Blockly.Processing.valueToCode(block, 'RATE', Blockly.Processing.ORDER_ATOMIC) || '0.5';
    const depth = Blockly.Processing.valueToCode(block, 'DEPTH', Blockly.Processing.ORDER_ATOMIC) || '20';
    const q = Blockly.Processing.valueToCode(block, 'FILTER_Q', Blockly.Processing.ORDER_ATOMIC) || '0.4';
    code += `  if (instrumentAutoFilters.containsKey("${name}")) { ddf.minim.ugens.Oscil lfo = (ddf.minim.ugens.Oscil)instrumentAutoFilterLFOs.get("${name}"); if (lfo != null) { lfo.setFrequency((float)${rate}); lfo.setAmplitude(1000.0f * (float)${depth}/100.0f); } ddf.minim.ugens.MoogFilter f = (ddf.minim.ugens.MoogFilter)instrumentAutoFilters.get("${name}"); if (f != null) { f.resonance.setLastValue(constrain((float)${q}, 0.0f, 0.9f)); } }
`;
    code += `  else { UGen prev = ${endVar}; prev.unpatch(${finalTarget}); ddf.minim.ugens.MoogFilter f = new ddf.minim.ugens.MoogFilter(1000, (float)${q}); ddf.minim.ugens.Oscil lfo = new ddf.minim.ugens.Oscil((float)${rate}, 1000.0f * (float)${depth}/100.0f, Waves.SINE); ddf.minim.ugens.Summer s = new SBSummer(); new ddf.minim.ugens.Constant(1000).patch(s); lfo.patch(s).patch(f.frequency); instrumentAutoFilters.put("${name}", f); instrumentAutoFilterLFOs.put("${name}", lfo); prev.patch(f).patch(${finalTarget}); `;
    code += (name === "Master") ? `masterEffectEnd = f; }
` : `instrumentEffectEnds.put("${name}", f); }
`;
  } else if (type === 'pitchmod') {
    const mType = block.getFieldValue('TYPE') || 'NOISE';
    const rate = Blockly.Processing.valueToCode(block, 'RATE', Blockly.Processing.ORDER_ATOMIC) || '5';
    const depth = Blockly.Processing.valueToCode(block, 'DEPTH', Blockly.Processing.ORDER_ATOMIC) || '10';
    code += `  if (instrumentPitchMods.containsKey("${name}")) { UGen lfo = (UGen)instrumentPitchModLFOs.get("${name}"); if (lfo instanceof ddf.minim.ugens.Oscil) { ((ddf.minim.ugens.Oscil)lfo).setFrequency((float)${rate}); ((ddf.minim.ugens.Oscil)lfo).setAmplitude((float)${depth}/1200.0f); } else if (lfo instanceof ddf.minim.ugens.Noise) { ((ddf.minim.ugens.Noise)lfo).amplitude.setLastValue((float)${depth}/240.0f); } }
`;
    code += `  else { UGen prev = ${endVar}; prev.unpatch(${finalTarget}); ddf.minim.ugens.TickRate tr = new ddf.minim.ugens.TickRate(1.0f); UGen lfo; if ("${mType}".equals("NOISE")) lfo = new ddf.minim.ugens.Noise((float)${depth}/240.0f, ddf.minim.ugens.Noise.Tint.WHITE); else lfo = new ddf.minim.ugens.Oscil((float)${rate}, (float)${depth}/1200.0f, Waves.SINE); ddf.minim.ugens.Summer s = new SBSummer(); new ddf.minim.ugens.Constant(1.0f).patch(s); lfo.patch(s).patch(tr.value); instrumentPitchMods.put("${name}", tr); instrumentPitchModLFOs.put("${name}", lfo); prev.patch(tr).patch(${finalTarget}); `;
    code += (name === "Master") ? `masterEffectEnd = tr; }
` : `instrumentEffectEnds.put("${name}", tr); }
`;
  } else if (type === 'delay') {
    const time = Blockly.Processing.valueToCode(block, 'DELAY_TIME', Blockly.Processing.ORDER_ATOMIC) || '0.5';
    const feedback = Blockly.Processing.valueToCode(block, 'FEEDBACK', Blockly.Processing.ORDER_ATOMIC) || '0.5';
    code += `  if (instrumentDelays.containsKey("${name}")) { try { Object dObj = instrumentDelays.get("${name}"); java.lang.reflect.Field f = dObj.getClass().getField("delTime"); Object input = f.get(dObj); input.getClass().getMethod("setLastValue", float.class).invoke(input, (float)${time}); } catch (Exception e) {} }
`;
    code += `  else { UGen prev = ${endVar}; prev.unpatch(${finalTarget}); Delay d = new Delay(${time}, ${feedback}, true, true); instrumentDelays.put("${name}", d); prev.patch(d).patch(${finalTarget}); `;
    code += (name === "Master") ? `masterEffectEnd = d; }
` : `instrumentEffectEnds.put("${name}", d); }
`;
  } else if (type === 'bitcrush') {
    const bits = Blockly.Processing.valueToCode(block, 'BITDEPTH', Blockly.Processing.ORDER_ATOMIC) || '8';
    code += `  if (instrumentBitCrushers.containsKey("${name}")) { try { Object bObj = instrumentBitCrushers.get("${name}"); java.lang.reflect.Field f = bObj.getClass().getField("bitRes"); Object input = f.get(bObj); input.getClass().getMethod("setLastValue", float.class).invoke(input, (float)${bits}); } catch (Exception e) {} }
`;
    code += `  else { UGen prev = ${endVar}; prev.unpatch(${finalTarget}); BitCrush bc = new BitCrush((float)${bits}, out.sampleRate()); instrumentBitCrushers.put("${name}", bc); prev.patch(bc).patch(${finalTarget}); `;
    code += (name === "Master") ? `masterEffectEnd = bc; }
` : `instrumentEffectEnds.put("${name}", bc); }
`;
  } else if (type === 'waveshaper') {
    const amount = Blockly.Processing.valueToCode(block, 'DISTORTION_AMOUNT', Blockly.Processing.ORDER_ATOMIC) || '2';
    code += `  if (instrumentWaveshapers.containsKey("${name}")) { ((SBWaveshaper)instrumentWaveshapers.get("${name}")).setAmount((float)${amount}); }
`;
    code += `  else { UGen prev = ${endVar}; prev.unpatch(${finalTarget}); SBWaveshaper ws = new SBWaveshaper(); ws.setAmount((float)${amount}); instrumentWaveshapers.put("${name}", ws); prev.patch(ws).patch(${finalTarget}); `;
    code += (name === "Master") ? `masterEffectEnd = ws; }
` : `instrumentEffectEnds.put("${name}", ws); }
`;
  } else if (type === 'reverb') {
    const rs = Blockly.Processing.valueToCode(block, 'ROOMSIZE', Blockly.Processing.ORDER_ATOMIC) || '0.5';
    const damp = Blockly.Processing.valueToCode(block, 'DAMPING', Blockly.Processing.ORDER_ATOMIC) || '0.5';
    const wet = Blockly.Processing.valueToCode(block, 'WET', Blockly.Processing.ORDER_ATOMIC) || '0.3';
    code += `  if (instrumentReverbs.containsKey("${name}")) { ((SBReverb)instrumentReverbs.get("${name}")).setParams((float)${rs}, (float)${damp}, (float)${wet}); }
`;
    code += `  else { UGen prev = ${endVar}; prev.unpatch(${finalTarget}); SBReverb rv = new SBReverb(); rv.setParams((float)${rs}, (float)${damp}, (float)${wet}); instrumentReverbs.put("${name}", rv); prev.patch(rv).patch(${finalTarget}); `;
    code += (name === "Master") ? `masterEffectEnd = rv; }
` : `instrumentEffectEnds.put("${name}", rv); }
`;
  } else if (type === 'compressor') {
    const threshold = Blockly.Processing.valueToCode(block, 'THRESHOLD', Blockly.Processing.ORDER_ATOMIC) || '-20';
    const ratio = Blockly.Processing.valueToCode(block, 'RATIO', Blockly.Processing.ORDER_ATOMIC) || '4';
    const attack = Blockly.Processing.valueToCode(block, 'ATTACK', Blockly.Processing.ORDER_ATOMIC) || '0.01';
    const release = Blockly.Processing.valueToCode(block, 'RELEASE', Blockly.Processing.ORDER_ATOMIC) || '0.25';
    const makeup = Blockly.Processing.valueToCode(block, 'MAKEUP', Blockly.Processing.ORDER_ATOMIC) || '0';
    code += `  if (instrumentCompressors.containsKey("${name}")) { ((SBCompressor)instrumentCompressors.get("${name}")).setParams((float)${threshold}, (float)${ratio}, (float)${attack}, (float)${release}, (float)${makeup}); }
`;
    code += `  else { UGen prev = ${endVar}; prev.unpatch(${finalTarget}); SBCompressor c = new SBCompressor(); c.setParams((float)${threshold}, (float)${ratio}, (float)${attack}, (float)${release}, (float)${makeup}); instrumentCompressors.put("${name}", c); prev.patch(c).patch(${finalTarget}); `;
    code += (name === "Master") ? `masterEffectEnd = c; }
` : `instrumentEffectEnds.put("${name}", c); }
`;
  } else if (type === 'limiter') {
    const threshold = Blockly.Processing.valueToCode(block, 'THRESHOLD', Blockly.Processing.ORDER_ATOMIC) || '-3';
    const attack = Blockly.Processing.valueToCode(block, 'ATTACK', Blockly.Processing.ORDER_ATOMIC) || '0.001';
    const release = Blockly.Processing.valueToCode(block, 'RELEASE', Blockly.Processing.ORDER_ATOMIC) || '0.1';
    code += `  if (instrumentLimiters.containsKey("${name}")) { ((SBCompressor)instrumentLimiters.get("${name}")).setParams((float)${threshold}, 20.0f, (float)${attack}, (float)${release}, 0.0f); }
`;
    code += `  else { UGen prev = ${endVar}; prev.unpatch(${finalTarget}); SBCompressor c = new SBCompressor(); c.setParams((float)${threshold}, 20.0f, (float)${attack}, (float)${release}, 0.0f); instrumentLimiters.put("${name}", c); prev.patch(c).patch(${finalTarget}); `;
    code += (name === "Master") ? `masterEffectEnd = c; }
` : `instrumentEffectEnds.put("${name}", c); }
`;
  }
  code += `}
`; return code;
});

Blockly.Processing.registerGenerator('sb_set_instrument_volume', function(block) {
  const name = block.getFieldValue('NAME');
  const javaName = window.SB_Utils.getInstrumentJavaName(name);
  const volume = Blockly.Processing.valueToCode(block, 'VOLUME', Blockly.Processing.ORDER_ATOMIC) || '100';
  return `instrumentVolumes.put(${javaName}, floatVal(${volume}) / 100.0f);
`;
});

Blockly.Processing.registerGenerator('sb_set_panning', function(block) {
  const name = block.getFieldValue('NAME');
  const val = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_ATOMIC) || '0';
  return `updatePanning("${name}", floatVal(${val}));
`;
});

Blockly.Processing.registerGenerator('sb_set_effect_param', function(block) {
  const target = block.getFieldValue('TARGET');
  const type = block.getFieldValue('EFFECT_TYPE');
  const param = (type === 'panning') ? 'pan' : block.getFieldValue('PARAM_NAME');
  const val = Blockly.Processing.valueToCode(block, 'VALUE', Blockly.Processing.ORDER_ATOMIC) || "0";
  Blockly.Processing.definitions_['SB_Param_Helper'] = `
  void setEffectParam(String instName, String effectType, String paramName, float value) {
    if (effectType.equals("adsr")) {
      float[] adsr = instrumentADSR.get(instName); if (adsr == null) adsr = new float[]{defAdsrA, defAdsrD, defAdsrS, defAdsrR};
      if (paramName.equals("adsrA")) adsr[0] = value; else if (paramName.equals("adsrD")) adsr[1] = value; else if (paramName.equals("adsrS")) adsr[2] = value; else if (paramName.equals("adsrR")) adsr[3] = value;
      instrumentADSR.put(instName, adsr);
      if (currentInstrument.equals(instName)) {
        if (paramName.equals("adsrA")) adsrA = value; else if (paramName.equals("adsrD")) adsrD = value; else if (paramName.equals("adsrS")) adsrS = value; else if (paramName.equals("adsrR")) adsrR = value;
        if (cp5 != null && cp5.getController(paramName) != null) cp5.getController(paramName).setValue(value);
      } return;
    }
    Object effect = null;
    if (effectType.equals("filter")) effect = instrumentFilters.get(instName);
    else if (effectType.equals("reverb")) effect = instrumentReverbs.get(instName);
    else if (effectType.equals("delay")) effect = instrumentDelays.get(instName);
    else if (effectType.equals("bitcrush")) effect = instrumentBitCrushers.get(instName);
    else if (effectType.equals("compressor")) effect = instrumentCompressors.get(instName);
    else if (effectType.equals("limiter")) effect = instrumentLimiters.get(instName);
    else if (effectType.equals("flanger")) effect = instrumentFlangers.get(instName);
    else if (effectType.equals("autofilter")) effect = instrumentAutoFilters.get(instName);
    else if (effectType.equals("pitchmod")) effect = instrumentPitchMods.get(instName);
    else if (effectType.equals("waveshaper")) effect = instrumentWaveshapers.get(instName);
    else if (effectType.equals("panning")) { updatePanning(instName, value); return; }
    if (effect != null) { try { java.lang.reflect.Field f = effect.getClass().getField(paramName); Object control = f.get(effect); java.lang.reflect.Method m = control.getClass().getMethod("setLastValue", float.class); m.invoke(control, value); }
      catch (Exception e) { try { String methodName = "set" + paramName.substring(0,1).toUpperCase() + paramName.substring(1); java.lang.reflect.Method m = effect.getClass().getMethod(methodName, float.class); m.invoke(effect, value); } catch(Exception ex) {} }
    }
  }`;
  return `setEffectParam("${target}", "${type}", "${param}", floatVal(${val}));
`;
});

Blockly.Processing.registerGenerator('sb_update_adsr', function(block) {
  const target = block.getFieldValue('TARGET');
  const a = Blockly.Processing.valueToCode(block, 'A', Blockly.Processing.ORDER_ATOMIC) || "0.01";
  const d = Blockly.Processing.valueToCode(block, 'D', Blockly.Processing.ORDER_ATOMIC) || "0.1";
  const s = Blockly.Processing.valueToCode(block, 'S', Blockly.Processing.ORDER_ATOMIC) || "0.5";
  const r = Blockly.Processing.valueToCode(block, 'R', Blockly.Processing.ORDER_ATOMIC) || "0.5";
  let code = `instrumentADSR.put("${target}", new float[]{floatVal(${a}), floatVal(${d}), floatVal(${s}), floatVal(${r})});
`;
  code += `if (currentInstrument.equals("${target}")) { adsrA = floatVal(${a}); adsrD = floatVal(${d}); adsrS = floatVal(${s}); adsrR = floatVal(${r}); if (cp5 != null) { cp5.getController("adsrA").setValue(adsrA); cp5.getController("adsrD").setValue(adsrD); cp5.getController("adsrS").setValue(adsrS); cp5.getController("adsrR").setValue(adsrR); } }
`;
  return code;
});
