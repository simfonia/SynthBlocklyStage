/**
 * @fileoverview Main JavaScript for the SynthBlockly Stage webview.
 * Handles Blockly initialization, module loading, and communication with VS Code.
 */

import { loadModules } from './module_loader.js';

const vscode = acquireVsCodeApi();
let workspace = null;

/**
 * Initializes the Blockly workspace.
 */
async function init() {
    // 0. 強化插件註冊 (參考 piBlockly 成功經驗)
    const FieldColour = window.FieldColour || (window.Blockly && window.Blockly.FieldColour);
    if (FieldColour) {
        try {
            Blockly.registry.register('field', 'field_colour', FieldColour);
            console.log('[Registry] field_colour registered.');
        } catch (e) {
            console.log('[Registry] field_colour already registered.');
        }
    } else {
        console.warn('[Warning] FieldColour class not found.');
    }

    const FieldMultilineInput = window.FieldMultilineInput || (window.Blockly && window.Blockly.FieldMultilineInput);
    if (FieldMultilineInput) {
        try {
            Blockly.registry.register('field', 'field_multilineinput', FieldMultilineInput);
            console.log('[Registry] field_multilineinput registered.');
        } catch (e) {
            console.log('[Registry] field_multilineinput already registered.');
        }
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
        move: { scrollbars: true, drag: true, wheel: true }
    });

    // 5. Signal VS Code that we are ready
    vscode.postMessage({ command: 'webviewReady' });

    // 6. Handle Toolbar Buttons
    document.getElementById('openButton')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'openProject' });
    });

    document.getElementById('saveButton')?.addEventListener('click', () => {
        const xml = Blockly.Xml.workspaceToDom(workspace);
        const xmlText = Blockly.Xml.domToText(xml);
        vscode.postMessage({ command: 'saveProject', xml: xmlText });
    });

    document.getElementById('newButton')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'newProject' });
    });

    // 7. Handle messages from VS Code
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'generateCode':
                generateAndSendCode();
                break;
            case 'initializeWorkspace':
                loadXmlToWorkspace(message.xml);
                break;
        }
    });
}

function generateAndSendCode() {
    // Initialize generator
    Blockly.Processing.init(workspace);
    
    // Get all top blocks to ensure we visit both setup and draw
    const topBlocks = workspace.getTopBlocks(true);
    let drawCode = '';
    
    topBlocks.forEach(block => {
        if (block.type === 'processing_draw') {
            // Code from draw blocks will be passed to finish()
            drawCode += Blockly.Processing.blockToCode(block);
        } else {
            // This will trigger the generator for setup blocks, 
            // populating Blockly.Processing.setups_
            Blockly.Processing.blockToCode(block);
        }
    });

    // Finalize generation (drawCode goes into void draw())
    const finalCode = Blockly.Processing.finish(drawCode);

    vscode.postMessage({
        command: 'executeCode',
        code: finalCode
    });
}

function loadXmlToWorkspace(xmlText) {
    if (!xmlText) return;
    try {
        const xml = Blockly.utils.xml.textToDom(xmlText);
        Blockly.Xml.clearWorkspaceAndLoadFromXml(xml, workspace);
    } catch (e) {
        console.error('Failed to load XML', e);
    }
}

// Start initialization
init();
