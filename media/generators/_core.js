/**
 * @license
 * Copyright 2026 SynthBlockly Stage
 * @fileoverview Helper functions for generating Processing (Java) for blocks.
 */

Blockly.Processing = new Blockly.Generator('Processing');
Blockly.Processing.forBlock = {}; 

// Proxy blockToCode to handle missing generators gracefully
const originalBlockToCode = Blockly.Processing.blockToCode;
Blockly.Processing.blockToCode = function(block) {
  if (!block) return '';
  
  // Try to sync modern and legacy generator locations
  if (!this.forBlock[block.type] && this[block.type]) {
    this.forBlock[block.type] = this[block.type];
  }

  // If still not found, return a safe comment instead of throwing error
  if (!this.forBlock[block.type]) {
    console.warn('Missing generator for block type: ' + block.type);
    return '/* Missing generator for ' + block.type + ' */\n';
  }

  return originalBlockToCode.call(this, block);
};

/**
 * List of reserved words for Processing (Java).
 */
Blockly.Processing.addReservedWords(
    'setup,draw,if,else,for,switch,case,while,do,break,continue,return,void,boolean,char,byte,int,long,float,double,String,Array,color,PImage,PFont,PShape,size,background,fill,noFill,stroke,noStroke,strokeWeight,rect,ellipse,line,point,triangle,quad,arc,curve,bezier,map,constrain,abs,min,max,sin,cos,tan,random,println,millis,width,height,mouseX,mouseY,mousePressed,keyPressed,key,keyCode'
);

Blockly.Processing.ORDER_ATOMIC = 0;
Blockly.Processing.ORDER_NEW = 1.1;
Blockly.Processing.ORDER_MEMBER = 1.2;
Blockly.Processing.ORDER_FUNCTION_CALL = 2;
Blockly.Processing.ORDER_MULTIPLICATION = 5.1;
Blockly.Processing.ORDER_DIVISION = 5.2;
Blockly.Processing.ORDER_ADDITION = 6.2;
Blockly.Processing.ORDER_SUBTRACTION = 6.1;
Blockly.Processing.ORDER_RELATIONAL = 8;
Blockly.Processing.ORDER_EQUALITY = 9;
Blockly.Processing.ORDER_LOGICAL_AND = 13;
Blockly.Processing.ORDER_LOGICAL_OR = 14;
Blockly.Processing.ORDER_ASSIGNMENT = 16;
Blockly.Processing.ORDER_NONE = 99;

/**
 * Initialize the generator.
 */
Blockly.Processing.init = function(workspace) {
  Blockly.Processing.imports_ = Object.create(null);
  Blockly.Processing.global_vars_ = Object.create(null);
  Blockly.Processing.definitions_ = Object.create(null); 
  Blockly.Processing.setups_ = Object.create(null);
  Blockly.Processing.draws_ = Object.create(null); 
  Blockly.Processing.keyEvents_ = [];

  // Standard Imports for Lists and Utils
  Blockly.Processing.addImport("import java.util.*;");
  Blockly.Processing.addImport("import ddf.minim.*;");
  Blockly.Processing.addImport("import ddf.minim.ugens.*;");

  // Helper function for dynamic type conversion (Object to float)
  Blockly.Processing.definitions_['Helper_floatVal'] = 
    "float floatVal(Object o) {\n" +
    "  if (o == null) return 0.0f;\n" +
    "  if (o instanceof Number) return ((Number)o).floatValue();\n" +
    "  try { return Float.parseFloat(o.toString()); }\n" +
    "  catch (Exception e) { return 0.0f; }\n" +
    "}";

  if (!Blockly.Processing.nameDB_) {
    Blockly.Processing.nameDB_ = new Blockly.Names(Blockly.Processing.RESERVED_WORDS_);
  } else {
    Blockly.Processing.nameDB_.reset();
  }
  Blockly.Processing.nameDB_.setVariableMap(workspace.getVariableMap());
};

/**
 * 輔助函數：計算相對索引 (0-based)
 */
Blockly.Processing.getRelativeIndex = function(block, name) {
  const at = Blockly.Processing.valueToCode(block, name, Blockly.Processing.ORDER_ADDITION) || '1';
  // Use native JS check for numeric string
  if (!isNaN(parseFloat(at)) && isFinite(at)) {
    return String(Number(at) - 1);
  }
  return at + ' - 1';
};

/**
 * 輔助函數：添加 Import 語句
 */
Blockly.Processing.addImport = function(importStr) {
  if (Blockly.Processing.imports_) {
    Blockly.Processing.imports_[importStr] = importStr;
  }
};

/**
 * 輔助函數：注入程式碼到 setup()
 */
Blockly.Processing.provideSetup = function(code) {
  if (Blockly.Processing.setups_) {
    var id = 'setup_' + Object.keys(Blockly.Processing.setups_).length;
    Blockly.Processing.setups_[id] = code;
  }
};

/**
 * 輔助函數：注入程式碼到 draw() 的開頭
 */
Blockly.Processing.provideDraw = function(code) {
  if (Blockly.Processing.draws_) {
    var id = 'draw_' + Object.keys(Blockly.Processing.draws_).length;
    Blockly.Processing.draws_[id] = code;
  }
};

/**
 * Finish the code generation.
 */
Blockly.Processing.finish = function(code) {
  // 1. 處理 Imports (確保唯一、修剪空白、補齊分號)
  const uniqueImports = new Set();
  if (Blockly.Processing.imports_) {
    Object.values(Blockly.Processing.imports_).forEach(imp => {
      if (imp) {
        let cleanImp = imp.trim();
        if (cleanImp && !cleanImp.endsWith(';')) cleanImp += ';';
        if (cleanImp) uniqueImports.add(cleanImp);
      }
    });
  }
  const importsStr = Array.from(uniqueImports).sort().join('\n');

  // 2. 處理全域變數
  const globalVars = Object.values(Blockly.Processing.global_vars_ || {})
    .map(v => v.trim())
    .filter(v => v !== "")
    .sort()
    .join('\n');
  
  // 3. 處理定義 (含佔位符替換)
  let definitionsStr = Object.values(Blockly.Processing.definitions_ || {})
    .map(d => d.trim())
    .filter(d => d !== "")
    .join('\n\n');

  // --- 關鍵：處理鍵盤事件佔位符 ---
  let pressedEventsCode = "";
  let releasedEventsCode = "";
  if (Blockly.Processing.keyEvents_) {
    Blockly.Processing.keyEvents_.forEach(ev => {
      pressedEventsCode += `if (k == '${ev.key}') {\n      ${ev.code.replace(/\n/g, '\n      ')}\n    }\n    `;
    });
  }
  
  // 先定義暫時的變數處理替換，確保 definitionsStr 被更新
  let finalDefinitions = definitionsStr
    .replace('{{KEY_PRESSED_EVENT_PLACEHOLDER}}', pressedEventsCode)
    .replace('{{KEY_RELEASED_EVENT_PLACEHOLDER}}', releasedEventsCode);

  // 4. Setup 函式
  const setups = Object.values(Blockly.Processing.setups_ || [])
    .map(s => s.trim())
    .filter(s => s !== "");
  const setup = 'void setup() {\n  ' + setups.join('\n  ').replace(/\n/g, '\n  ') + '\n}\n';
  
  // 5. Draw 函式
  const drawParts = Object.values(Blockly.Processing.draws_ || [])
    .map(d => d.trim())
    .filter(d => d !== "");
  const fullDrawCode = (drawParts.join('\n') + '\n' + code).trim();
  const draw = 'void draw() {\n  ' + (fullDrawCode ? fullDrawCode.replace(/\n/g, '\n  ') : '') + '\n}\n';

  // 6. 最終組合 (嚴格控制換行)
  let segments = [];
  if (importsStr) segments.push(importsStr);
  if (globalVars) segments.push(globalVars);
  if (finalDefinitions) segments.push(finalDefinitions);
  segments.push(setup);
  segments.push(draw);

  const finalCode = segments.join('\n\n').trim();
  
  // 清理
  delete Blockly.Processing.imports_;
  delete Blockly.Processing.global_vars_;
  delete Blockly.Processing.definitions_;
  delete Blockly.Processing.setups_;
  delete Blockly.Processing.draws_;
  
  return finalCode; 
};

Blockly.Processing.scrubNakedValue = function(line) {
  return line + ';\n';
};

Blockly.Processing.quote_ = function(string) {
  return '"' + string.replace(/\\/g, '\\\\').replace(/"/g, '"') + '"';
};

Blockly.Processing.scrub_ = function(block, code) {
  var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  var nextCode = Blockly.Processing.blockToCode(nextBlock);
  return code + nextCode;
};