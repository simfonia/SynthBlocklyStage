/**
 * @fileoverview VS Code Bridge for SynthBlockly Stage.
 * Handles communication between Webview and Extension Host.
 */

const vscode = acquireVsCodeApi();
const dialogCallbacks = new Map();
let dialogIdCounter = 0;

/**
 * Bridge for standard Blockly prompts to VS Code InputBox
 */
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

/**
 * Handle responses from VS Code prompt
 */
export function handlePromptResponse(id, value) {
    const callback = dialogCallbacks.get(id);
    if (callback) {
        callback(value);
        dialogCallbacks.delete(id);
    }
}

/**
 * Intercept window.open calls to bypass sandbox restrictions
 */
window.open = function(url) {
    if (url) {
        console.log('[Help] Attempting to open:', url);
        let targetUrl = url;
        if (url.indexOf('http') !== 0) {
            const suffix = Blockly.Msg['HELP_LANG_SUFFIX'] || '_zh-hant.html';
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

/**
 * Send message to VS Code
 */
export function postMessage(data) {
    vscode.postMessage(data);
}
