/**
 * @fileoverview Event Handlers for SynthBlockly Stage.
 * Manages UI interactions, workspace changes, and status updates.
 */

import * as VSCode from './vscode_bridge.js';
import * as BlocklyMgr from './blockly_manager.js';

let isDirty = false;
let hasPath = false;
let autoSaveTimeout = null;
let orphanUpdateTimer = null;

export function setPathState(established) { hasPath = established; }
export function setDirtyState(dirty) { isDirty = dirty; updateStatusUI(); }
export function getDirtyState() { return isDirty; }

export function updateStatusUI() {
    const label = document.getElementById('saveStatus');
    if (!label) return;
    const projectName = document.getElementById('projectName');
    const isExample = projectName && projectName.title && projectName.title.toLowerCase().includes('examples');

    if (!hasPath) {
        label.textContent = "○ New Project (unsaved!)";
        label.className = "status-label status-dirty";
    } else if (isExample) {
        label.textContent = isDirty ? "● Example (Modified)" : "✓ Example (Read Only)";
        label.className = isDirty ? "status-label status-dirty" : "status-label status-saved";
    } else {
        label.textContent = isDirty ? "● Unsaved Changes" : "✓ Saved";
        label.className = isDirty ? "status-label status-dirty" : "status-label status-saved";
    }
}

export function triggerAutoSave() {
    const projectName = document.getElementById('projectName');
    if (projectName && projectName.title && projectName.title.toLowerCase().includes('examples')) return;
    
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        const xmlText = BlocklyMgr.getXmlText();
        const finalCode = BlocklyMgr.generateFullCode();
        VSCode.postMessage({ command: 'autoSaveProject', xml: xmlText, code: finalCode });
        isDirty = false;
        updateStatusUI();
    }, 2000);
}

export function initUIHandlers() {
    const setupButtonHover = (id) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('mouseover', () => { btn.src = btn.src.replace('1F1F1F', 'FE2F89'); });
        btn.addEventListener('mouseout', () => { btn.src = btn.src.replace('FE2F89', '1F1F1F'); });
    };

    ['newButton', 'examplesButton', 'openButton', 'saveButton', 'setPathButton'].forEach(setupButtonHover);

    document.getElementById('setPathButton')?.addEventListener('click', () => { VSCode.postMessage({ command: 'setProcessingPath' }); });
    document.getElementById('examplesButton')?.addEventListener('click', () => { VSCode.postMessage({ command: 'showExamples', isDirty: isDirty }); });
    document.getElementById('openButton')?.addEventListener('click', () => { VSCode.postMessage({ command: 'openProject', isDirty: isDirty }); });
    document.getElementById('newButton')?.addEventListener('click', () => { VSCode.postMessage({ command: 'newProject', isDirty: isDirty }); });

    document.getElementById('saveButton')?.addEventListener('click', () => {
        const xmlText = BlocklyMgr.getXmlText();
        const finalCode = BlocklyMgr.generateFullCode();
        VSCode.postMessage({ command: 'saveProject', xml: xmlText, code: finalCode });
        // Removed: isDirty = false; hasPath = true; updateStatusUI();
        // The UI will be updated via 'initializeWorkspace' message from Host upon successful save.
    });
}

export function attachWorkspaceListeners(workspace) {
    workspace.addChangeListener((event) => {
        if (event.isUiEvent) return;
        if (event.type === Blockly.Events.CHANGE && event.element === 'disabled') return;
        if (workspace.isDragging()) return;

        const isBlockChange = [
            Blockly.Events.BLOCK_CREATE, Blockly.Events.BLOCK_DELETE,
            Blockly.Events.BLOCK_CHANGE, Blockly.Events.BLOCK_MOVE
        ].includes(event.type);

        if (isBlockChange) {
            if (orphanUpdateTimer) clearTimeout(orphanUpdateTimer);
            orphanUpdateTimer = setTimeout(() => {
                if (workspace.getTopBlocks().length > 0) {
                    if (!isDirty) { isDirty = true; updateStatusUI(); }
                    triggerAutoSave();
                    window.SB_Utils.checkKeyConflicts(workspace);
                    window.SB_Utils.updateOrphanBlocks(workspace);
                }
            }, 100); 
        }
    });

    window.addEventListener('blur', () => {
        setTimeout(() => {
            if (workspace && workspace.isDragging() && Blockly.Gesture.inProgress()) {
                try { Blockly.Gesture.clearForced(); } catch (e) {}
            }
        }, 10);
    });
}
