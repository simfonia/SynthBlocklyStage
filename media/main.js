/**
 * @fileoverview Main entry point for SynthBlockly Stage webview.
 * Orchestrates modules and initializes the application.
 */

import * as VSCode from './vscode_bridge.js';
import * as BlocklyMgr from './blockly_manager.js';
import * as Events from './event_handlers.js';

async function init() {
    // 1. Initialize Polyfills (Critical first step)
    window.SB_Utils.initPolyfills();

    // 2. Setup Blockly
    const blocklyDiv = document.getElementById('blocklyDiv');
    const toolboxXml = document.getElementById('toolbox-xml').textContent;
    const workspace = await BlocklyMgr.initBlockly(blocklyDiv, toolboxXml);

    // 3. Initialize UI & Listeners
    Events.initUIHandlers();
    Events.attachWorkspaceListeners(workspace);

    // 4. Signal Extension Host
    VSCode.postMessage({ command: 'webviewReady' });
    Events.updateStatusUI();

    // 5. Handle Messages from Extension Host
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'generateCode':
                const finalCode = BlocklyMgr.generateFullCode();
                const xmlText = BlocklyMgr.getXmlText();
                VSCode.postMessage({ command: 'executeCode', code: finalCode, xml: xmlText });
                break;
            case 'initializeWorkspace':
                const isNew = message.xml.includes('<xml xmlns="https://developers.google.com/blockly/xml"></xml>') || message.isTemplate;
                loadProject(message.xml, !isNew, message.fileName, message.fullPath, isNew);
                break;
            case 'promptResponse':
                VSCode.handlePromptResponse(message.id, message.value);
                break;
        }
    });
}

function loadProject(xmlText, establishedPath, fileName, fullPath, forceDirty) {
    BlocklyMgr.loadXml(xmlText);
    Events.setPathState(establishedPath);
    Events.setDirtyState(forceDirty);
    
    const nameLabel = document.getElementById('projectName');
    if (nameLabel) {
        nameLabel.textContent = fileName ? `[ ${fileName} ]` : "";
        nameLabel.title = fullPath || "";
    }
}

// Start Application
init();