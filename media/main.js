/**
 * @fileoverview Main JavaScript for the SynthBlockly Stage webview.
 * Handles Blockly initialization, module loading, and communication with VS Code.
 */

import { loadModules } from './module_loader.js';

// --- VS Code Bridge for Dialogs ---
const dialogCallbacks = new Map();
let dialogIdCounter = 0;

Blockly.dialog.setPrompt(function(message, defaultValue, callback) {
    const id = `dialog_${dialogIdCounter++}`;
    dialogCallbacks.set(id, callback);
    vscode.postMessage({
        command: 'showPrompt',
        message: message,
        defaultValue: defaultValue,
        id: id
    });
});

// Initialize Polyfills from Utils
window.SB_Utils.initPolyfills();

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
            'logic_category': { 'colour': Blockly.Msg['LOGIC_HUE'] || '#5C81A6' },
            'loop_category': { 'colour': Blockly.Msg['LOOPS_HUE'] || '#5CA65C' },
            'math_category': { 'colour': Blockly.Msg['MATH_HUE'] || '#5C68A6' },
            'text_category': { 'colour': Blockly.Msg['TEXT_HUE'] || '#A65C81' },
            'variable_category': { 'colour': Blockly.Msg['VARIABLES_HUE'] || '#A6745C' },
            'procedure_category': { 'colour': Blockly.Msg['FUNCTIONS_HUE'] || '#995CA6' },
            'structure_category': { 'colour': Blockly.Msg['STRUCTURE_HUE'] || '#16A085' },
            'live_show_category': { 'colour': Blockly.Msg['LIVE_SHOW_HUE'] || '#2C3E50' },
            'audio_effects_category': { 'colour': Blockly.Msg['EFFECTS_HUE'] || '#8E44AD' },
            'performance_category': { 'colour': Blockly.Msg['PERFORMANCE_HUE'] || '#E67E22' },
            'instrument_control_category': { 'colour': Blockly.Msg['INSTRUMENT_CONTROL_HUE'] || '#FF5722' }
        },
        'blockStyles': {
            'variable_blocks': { 'colourPrimary': Blockly.Msg['VARIABLES_HUE'] || '#A6745C' },
            'procedure_blocks': { 'colourPrimary': Blockly.Msg['FUNCTIONS_HUE'] || '#995CA6' }
        },
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
    let orphanUpdateTimer = null;
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
        // --- 效能優化：過濾無意義事件 ---
        // 1. 忽略 UI 捲動或選取事件
        if (event.isUiEvent) return;
        // 2. 忽略由我們自己觸發的「禁用狀態」變更事件，防止無限遞迴
        if (event.type === Blockly.Events.CHANGE && event.element === 'disabled') return;

        // 關鍵效能優化：正在拖曳時跳過所有邏輯檢查，確保動畫（如垃圾桶）流暢
        if (workspace && workspace.isDragging()) return;

        // Only trigger isDirty for actual block changes
        const isBlockChange = [
            Blockly.Events.BLOCK_CREATE,
            Blockly.Events.BLOCK_DELETE,
            Blockly.Events.BLOCK_CHANGE,
            Blockly.Events.BLOCK_MOVE
        ].includes(event.type);

        if (isBlockChange) {
            // 延遲執行所有重型檢查，確保操作流暢
            if (orphanUpdateTimer) clearTimeout(orphanUpdateTimer);
            orphanUpdateTimer = setTimeout(() => {
                if (workspace.getTopBlocks().length > 0) {
                    if (!isDirty) {
                        isDirty = true;
                        updateStatusUI();
                    }
                    triggerAutoSave();
                    
                    // 靜止後才檢查按鍵衝突與孤兒積木
                    window.SB_Utils.checkKeyConflicts(workspace);
                    window.SB_Utils.updateOrphanBlocks(workspace);
                }
            }, 100); 
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
                const isNew = message.xml.includes('<xml xmlns="https://developers.google.com/blockly/xml"></xml>') || 
                              message.isTemplate; // New flag from extension
                loadXmlToWorkspace(message.xml, !isNew, message.fileName, message.fullPath, isNew);
                break;
            case 'promptResponse':
                const callback = dialogCallbacks.get(message.id);
                if (callback) {
                    callback(message.value);
                    dialogCallbacks.delete(message.id);
                }
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

function loadXmlToWorkspace(xmlText, establishedPath = true, fileName = "", fullPath = "", forceDirty = false) {
    if (!xmlText) return;
    try {
        Blockly.Events.disable(); // Prevent dirty state during initial load
        const xml = Blockly.utils.xml.textToDom(xmlText);
        Blockly.Xml.clearWorkspaceAndLoadFromXml(xml, workspace);
        Blockly.Events.enable();
        
        isDirty = forceDirty; // Use the forceDirty flag
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

// Add a blur event listener to handle cases where a drag is released outside the webview.
window.addEventListener('blur', () => {
    setTimeout(() => {
        if (workspace && workspace.isDragging() && Blockly.Gesture.inProgress()) {
            try {
                Blockly.Gesture.clearForced();
            } catch (e) {
                console.warn('[Gesture] Clear failed:', e);
            }
        }
    }, 10);
});
