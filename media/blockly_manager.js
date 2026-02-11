/**
 * @fileoverview Blockly Manager for SynthBlockly Stage.
 * Handles initialization, theme, and workspace operations.
 */

import { loadModules } from './module_loader.js';

let workspace = null;

export function getWorkspace() {
    return workspace;
}

export async function initBlockly(blocklyDiv, toolboxXml) {
    // Override showHelp
    Blockly.Block.prototype.showHelp = function() {
        const url = (typeof this.helpUrl === 'function') ? this.helpUrl() : this.helpUrl;
        if (url) {
            window.open(url); // Handled by bridge
        }
    };

    // Register Plugins
    const FieldMultilineInput = window.FieldMultilineInput || (window.Blockly && window.Blockly.FieldMultilineInput);
    if (FieldMultilineInput) {
        try { Blockly.fieldRegistry.register('field_multilinetext', FieldMultilineInput); } catch (e) {} 
    }
    const FieldColour = window.FieldColour || (window.Blockly && window.Blockly.FieldColour);
    if (FieldColour) {
        try { Blockly.fieldRegistry.register('field_colour', FieldColour); } catch (e) {}
    }

    // Load Modules
    await loadModules(window.coreExtensionManifestUri);

    // Define Theme
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
            'flyoutBackgroundColour': '#ffffff',
            'scrollbarColour': '#ccc',
            'insertionMarkerOpacity': 0.3,
            'scrollbarOpacity': 0.4,
            'cursorColour': '#d0d0d0'
        }
    });

    // Inject
    workspace = Blockly.inject(blocklyDiv, {
        toolbox: toolboxXml,
        theme: theme,
        media: window.blocklyMediaUri,
        grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
        zoom: { controls: true, wheel: true, startScale: 1.0 },
        move: { scrollbars: true, drag: true, wheel: true },
        disable: true,
        sounds: false
    });

    return workspace;
}

export function loadXml(xmlText) {
    if (!xmlText) return;
    Blockly.Events.disable();
    const xml = Blockly.utils.xml.textToDom(xmlText);
    Blockly.Xml.clearWorkspaceAndLoadFromXml(xml, workspace);
    Blockly.Events.enable();
}

export function getXmlText() {
    const xml = Blockly.Xml.workspaceToDom(workspace);
    return Blockly.Xml.domToPrettyText(xml);
}

export function generateFullCode() {
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
    return Blockly.Processing.finish(drawCode);
}
