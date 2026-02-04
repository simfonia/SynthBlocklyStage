/**
 * @fileoverview Main JavaScript for the SynthBlockly Stage webview.
 * Handles Blockly initialization, module loading, and communication with VS Code.
 */

import { loadModules } from './module_loader.js';

// --- Blockly API Polyfills (v12 to v13 compatibility) ---
if (Blockly.Workspace.prototype.getAllVariables === undefined) {
  Blockly.Workspace.prototype.getAllVariables = function() {
    return this.getVariableMap().getAllVariables();
  };
}
if (Blockly.Workspace.prototype.getVariable === undefined) {
  Blockly.Workspace.prototype.getVariable = function(name, opt_type) {
    return this.getVariableMap().getVariable(name, opt_type);
  };
}
if (Blockly.Workspace.prototype.getVariableById === undefined) {
  Blockly.Workspace.prototype.getVariableById = function(id) {
    return this.getVariableMap().getVariableById(id);
  };
}

// --- Key Management System ---
window.SB_KEYS = {
  // 系統保留：移調與還原，使用者絕對不能自訂
  SYSTEM: ['up', 'down', 'left', 'right', '+', '-', 'backspace'],
  // 鋼琴音階：當舞台積木存在時，這些鍵被佔用
  PIANO: ['q', '2', 'w', '3', 'e', 'r', '5', 't', '6', 'y', '7', 'u', 'i', '9', 'o', '0', 'p'],
  // 完整可用清單 (排除系統鍵)
  ALL: 'abcdefghijklmnopqrstuvwxyz1234567890[]\;,./'.split('')
};

/**
 * 動態計算目前可用的按鍵列表
 * @param {Blockly.Block} currentBlock 當前積木 (用以排除自己佔用的鍵)
 * @returns {Array} [[label, value], ...]
 */
window.getAvailableKeys = function(currentBlock) {
  const workspace = currentBlock.workspace;
  const hasStage = workspace.getAllBlocks(false).some(b => b.type === 'visual_stage_setup');
  
  // 找出其他積木已經佔用的鍵
  const occupiedKeys = new Set();
  workspace.getAllBlocks(false).forEach(b => {
    if (b !== currentBlock && (b.type === 'ui_key_event' || b.type === 'ui_key_pressed')) {
      const val = b.getFieldValue('KEY');
      if (val) occupiedKeys.add(val.toLowerCase());
    }
  });

  const options = [];
  window.SB_KEYS.ALL.forEach(k => {
    const isPiano = window.SB_KEYS.PIANO.includes(k);
    const isOccupied = occupiedKeys.has(k);
    const isSystem = window.SB_KEYS.SYSTEM.includes(k);

    if (isSystem) return; // 系統鍵永不出現

    let label = k.toUpperCase();
    if (hasStage && isPiano) return; // 有舞台時，鋼琴鍵不出現
    if (isOccupied) return; // 已被其他積木佔用，不出現

    options.push([label, k]);
  });

  return options.length > 0 ? options : [['(無可用按鍵)', 'NONE']];
};

/**
 * 全域檢查衝突並標記警告
 */
window.checkKeyConflicts = function(workspace) {
  const hasStage = workspace.getAllBlocks(false).some(b => b.type === 'visual_stage_setup');
  const usedKeys = new Map();

  workspace.getAllBlocks(false).forEach(b => {
    if (b.type === 'ui_key_event' || b.type === 'ui_key_pressed') {
      const k = b.getFieldValue('KEY');
      if (!k) return;
      
      const isPiano = window.SB_KEYS.PIANO.includes(k.toLowerCase());
      
      if (hasStage && isPiano) {
        b.setWarningText("此按鍵已分配給「舞台鋼琴」功能，此積木將失效。");
        b.setFieldValue(" [！已被舞台鋼琴佔用]", "CONFLICT_LABEL");
        const svg = b.getSvgRoot();
        if (svg) {
          svg.classList.add('blockly-conflict-glow');
          // 嘗試找到 Label 並加上紅色 Class
          const labelField = b.getField("CONFLICT_LABEL");
          if (labelField && labelField.getSvgRoot()) {
            labelField.getSvgRoot().classList.add('blockly-conflict-text');
          }
        }
        if (typeof b.setDisabled === 'function') b.setDisabled(true);
      } else if (usedKeys.has(k.toLowerCase())) {
        b.setWarningText("此按鍵已被另一個積木重複定義。");
        b.setFieldValue(" [！按鍵衝突]", "CONFLICT_LABEL");
        const svg = b.getSvgRoot();
        if (svg) {
          svg.classList.add('blockly-conflict-glow');
          const labelField = b.getField("CONFLICT_LABEL");
          if (labelField && labelField.getSvgRoot()) {
            labelField.getSvgRoot().classList.add('blockly-conflict-text');
          }
        }
        if (typeof b.setDisabled === 'function') b.setDisabled(true);
      } else {
        b.setWarningText(null);
        b.setFieldValue("", "CONFLICT_LABEL");
        const svg = b.getSvgRoot();
        if (svg) {
          svg.classList.remove('blockly-conflict-glow');
        }
        if (typeof b.setDisabled === 'function') b.setDisabled(false);
        usedKeys.set(k.toLowerCase(), b);
      }
    }
  });
};

const vscode = acquireVsCodeApi();

// --- 攔截所有 window.open 呼叫並轉交給 VS Code (解決沙盒限制) ---
window.open = function(url) {
    if (url) {
        console.log('[Help] Attempting to open:', url);
        
        let targetUrl = url;
        // 如果網址指向本地文檔 (不包含 http)，則加上語系後綴
        if (url.indexOf('http') !== 0) {
            const suffix = Blockly.Msg['HELP_LANG_SUFFIX'] || '_zh-hant.html';
            // 移除原本可能帶有的 .html 結尾以便重新拼接正確語系
            const baseUrl = url.replace('_zh-hant.html', '').replace('_en.html', '').replace('.html', '');
            targetUrl = baseUrl + suffix;
        }

        if (targetUrl.indexOf('vscode-resource') !== -1 || targetUrl.indexOf('http') !== 0) {
            const parts = targetUrl.split('/');
            const filename = parts[parts.length - 1];
            vscode.postMessage({ command: 'openHelp', fileName: filename });
        } else {
            vscode.postMessage({ command: 'openHelp', url: targetUrl });
        }
    }
    return null;
};

let workspace = null;
let isDirty = false;
let hasPath = false; // Tracks if the current project has a file location

function updateStatusUI() {
    const label = document.getElementById('saveStatus');
    if (!label) return;
    
    const projectName = document.getElementById('projectName');
    const isExample = projectName && projectName.title && projectName.title.toLowerCase().includes('examples');

    if (!hasPath) {
        label.textContent = "○ New Project (unsaved!)";
        label.className = "status-label status-dirty";
    } else if (isExample) {
        if (isDirty) {
            label.textContent = "● Example (Modified)";
            label.className = "status-label status-dirty";
        } else {
            label.textContent = "✓ Example (Read Only)";
            label.className = "status-label status-saved";
        }
    } else if (isDirty) {
        label.textContent = "● Unsaved Changes";
        label.className = "status-label status-dirty";
    } else {
        label.textContent = "✓ Saved";
        label.className = "status-label status-saved";
    }
}

/**
 * Initializes the Blockly workspace.
 */
// 0. 強化插件註冊 (必須在載入 Manifest 與 Inject 之前)
async function init() {
    // Override showHelp to use VS Code message passing
    Blockly.Block.prototype.showHelp = function() {
        const url = (typeof this.helpUrl === 'function') ? this.helpUrl() : this.helpUrl;
        if (url) {
            vscode.postMessage({
                command: 'openHelp',
                url: url
            });
        }
    };

    const FieldMultilineInput = window.FieldMultilineInput || (window.Blockly && window.Blockly.FieldMultilineInput);
    if (FieldMultilineInput) {
        try {
            Blockly.fieldRegistry.register('field_multilinetext', FieldMultilineInput);
            console.log('[Registry] field_multilinetext manually registered.');
        } catch (e) {} 
    }

    const FieldColour = window.FieldColour || (window.Blockly && window.Blockly.FieldColour);
    if (FieldColour) {
        try {
            Blockly.fieldRegistry.register('field_colour', FieldColour);
            console.log('[Registry] field_colour manually registered.');
        } catch (e) {}
    }

    // 1. Get the container
    const blocklyDiv = document.getElementById('blocklyDiv');
    const toolboxXml = document.getElementById('toolbox-xml').textContent;

    // 2. Load all modules defined in the manifest
    await loadModules(window.coreExtensionManifestUri);

    // 3. Define Theme
    const theme = Blockly.Theme.defineTheme('synth_stage_theme', {
        'base': Blockly.Themes.Classic,
        'categoryStyles': {
            'logic_category': { 'colour': '#5C81A6' },
            'loop_category': { 'colour': '#5CA65C' },
            'math_category': { 'colour': '#5C68A6' },
            'text_category': { 'colour': '#A65C81' },
            'variable_category': { 'colour': '#A6745C' },
            'procedure_category': { 'colour': '#995CA6' },
            'structure_category': { 'colour': '#16A085' }
        },
        'blockStyles': {},
        'componentStyles': {
            'workspaceBackgroundColour': '#f7f7f7',
            'toolboxBackgroundColour': '#ffffff',
            'toolboxForegroundColour': '#333',
            'flyoutBackgroundColour': '#ffffff',
            'flyoutForegroundColour': '#333',
            'scrollbarColour': '#ccc',
            'insertionMarkerColour': '#000',
            'insertionMarkerOpacity': 0.3,
            'scrollbarOpacity': 0.4,
            'cursorColour': '#d0d0d0'
        }
    });

    // 4. Inject Blockly
    workspace = Blockly.inject(blocklyDiv, {
        toolbox: toolboxXml,
        theme: theme,
        media: window.blocklyMediaUri, // Use local media assets
        grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
        zoom: { controls: true, wheel: true, startScale: 1.0 },
        move: { scrollbars: true, drag: true, wheel: true },
        disable: true,
        sounds: false // Disable by default to prevent NotAllowedError
    });

    // Enable sounds after first user interaction
    const unlockSounds = () => {
        if (workspace && workspace.options) {
            // Attempt to set sounds in both common locations
            workspace.options.showSounds = true;
            if (workspace.options.parentOptions) {
                workspace.options.parentOptions.sounds = true;
            }
            console.log('[Audio] Sounds unlocked after interaction');
        }
        document.removeEventListener('click', unlockSounds);
        document.removeEventListener('keydown', unlockSounds);
    };
    document.addEventListener('click', unlockSounds);
    document.addEventListener('keydown', unlockSounds);

    let autoSaveTimeout = null;
function triggerAutoSave() {
    // Prevent auto-saving for examples
    const projectName = document.getElementById('projectName');
    if (projectName && projectName.title && projectName.title.toLowerCase().includes('examples')) {
        return;
    }
    
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            const xml = Blockly.Xml.workspaceToDom(workspace);
            const xmlText = Blockly.Xml.domToPrettyText(xml);
            
            // Generate current code
            Blockly.Processing.init(workspace);
            const topBlocks = workspace.getTopBlocks(true);
            let drawCode = '';
            topBlocks.forEach(block => {
                if (block.type === 'processing_draw') {
                    drawCode += Blockly.Processing.blockToCode(block);
                } else {
                    Blockly.Processing.blockToCode(block);
                }
            });
            const finalCode = Blockly.Processing.finish(drawCode);

            vscode.postMessage({ 
                command: 'autoSaveProject', 
                xml: xmlText,
                code: finalCode
            });
            isDirty = false;
            updateStatusUI();
            console.log('[Status] Auto-saved');
        }, 2000); // 2 seconds debounce
    };

    workspace.addChangeListener((event) => {
        // Only trigger isDirty for actual block changes, not UI or scrolling
        const isBlockChange = [
            Blockly.Events.BLOCK_CREATE,
            Blockly.Events.BLOCK_DELETE,
            Blockly.Events.BLOCK_CHANGE,
            Blockly.Events.BLOCK_MOVE
        ].includes(event.type);

        if (isBlockChange && !event.isUiEvent && workspace.getTopBlocks().length > 0) {
            if (!isDirty) {
                isDirty = true;
                updateStatusUI();
                console.log('[Status] Workspace is now DIRTY');
            }
            triggerAutoSave();
            
            // Check for key conflicts whenever workspace changes
            if (window.checkKeyConflicts) {
                window.checkKeyConflicts(workspace);
            }
        }
    });

    // 5. Signal VS Code that we are ready
    vscode.postMessage({ command: 'webviewReady' });
    updateStatusUI();

    // 6. Handle Toolbar Buttons
    const setupButtonHover = (id) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('mouseover', () => {
            btn.src = btn.src.replace('1F1F1F', 'FE2F89');
        });
        btn.addEventListener('mouseout', () => {
            btn.src = btn.src.replace('FE2F89', '1F1F1F');
        });
    };

    ['newButton', 'examplesButton', 'openButton', 'saveButton', 'setPathButton'].forEach(setupButtonHover);

    document.getElementById('setPathButton')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'setProcessingPath' });
    });

    document.getElementById('examplesButton')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'showExamples', isDirty: isDirty });
    });

    document.getElementById('openButton')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'openProject', isDirty: isDirty });
    });

    document.getElementById('saveButton')?.addEventListener('click', () => {
        const xml = Blockly.Xml.workspaceToDom(workspace);
        const xmlText = Blockly.Xml.domToPrettyText(xml);
        
        // Generate current code for saving pde alongside xml
        Blockly.Processing.init(workspace);
        const topBlocks = workspace.getTopBlocks(true);
        let drawCode = '';
        topBlocks.forEach(block => {
            if (block.type === 'processing_draw') {
                drawCode += Blockly.Processing.blockToCode(block);
            } else {
                Blockly.Processing.blockToCode(block);
            }
        });
        const finalCode = Blockly.Processing.finish(drawCode);

        vscode.postMessage({ 
            command: 'saveProject', 
            xml: xmlText,
            code: finalCode
        });
        isDirty = false;
        hasPath = true; // Manual save established a path
        updateStatusUI();
    });

    document.getElementById('newButton')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'newProject', isDirty: isDirty });
    });

    // 7. Handle messages from VS Code
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'generateCode':
                generateAndSendCode();
                break;
            case 'initializeWorkspace':
                // Check if this is a fresh new project (empty/default XML)
                const isNew = message.xml.includes('<xml xmlns="https://developers.google.com/blockly/xml"></xml>');
                loadXmlToWorkspace(message.xml, !isNew, message.fileName, message.fullPath);
                break;
        }
    });
}

function generateAndSendCode() {
    // Initialize generator
    Blockly.Processing.init(workspace);
    
    // Get the XML content to support force-save on run
    const xml = Blockly.Xml.workspaceToDom(workspace);
    const xmlText = Blockly.Xml.domToPrettyText(xml);

    // Get all top blocks to ensure we visit all independent blocks (setup, draw, event hats)
    const topBlocks = workspace.getTopBlocks(true);
    let drawCode = '';
    
    topBlocks.forEach(block => {
        if (block.type === 'processing_draw') {
            // Code from draw blocks will be passed to finish()
            drawCode += Blockly.Processing.blockToCode(block);
        } else {
            // This will trigger the generator for all other top blocks
            // (e.g., sb_minim_init, ui_key_event, visual_stage_setup)
            Blockly.Processing.blockToCode(block);
        }
    });

    // Finalize generation (drawCode goes into void draw())
    const finalCode = Blockly.Processing.finish(drawCode);

    vscode.postMessage({
        command: 'executeCode',
        code: finalCode,
        xml: xmlText
    });
}

function loadXmlToWorkspace(xmlText, establishedPath = true, fileName = "", fullPath = "") {
    if (!xmlText) return;
    try {
        Blockly.Events.disable(); // Prevent dirty state during initial load
        const xml = Blockly.utils.xml.textToDom(xmlText);
        Blockly.Xml.clearWorkspaceAndLoadFromXml(xml, workspace);
        Blockly.Events.enable();
        isDirty = false;
        hasPath = establishedPath;
        
        // Update Filename UI
        const nameLabel = document.getElementById('projectName');
        if (nameLabel) {
            nameLabel.textContent = fileName ? `[ ${fileName} ]` : "";
            nameLabel.title = fullPath || ""; // Set hover tooltip to full path
        }

        updateStatusUI();
        console.log('[Status] Workspace loaded. Path:', hasPath);
    } catch (e) {
        Blockly.Events.enable();
        console.error('Failed to load XML', e);
    }
}

// Start initialization
init();
