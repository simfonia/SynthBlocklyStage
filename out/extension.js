"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
let processingProcess = null;
function activate(context) {
    console.log('SynthBlockly Stage is active!');
    let disposable = vscode.commands.registerCommand('synthblockly-stage.openBlockly', () => {
        SynthBlocklyPanel.createOrShow(context);
    });
    context.subscriptions.push(disposable);
    context.subscriptions.push(vscode.commands.registerCommand('synthblockly-stage.runSketch', () => {
        if (SynthBlocklyPanel.currentPanel) {
            SynthBlocklyPanel.currentPanel.runSketch();
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('synthblockly-stage.stopSketch', () => {
        stopProcessing();
    }));
}
function stopProcessing() {
    if (processingProcess) {
        if (process.platform === 'win32') {
            (0, child_process_1.spawn)('taskkill', ['/F', '/T', '/PID', processingProcess.pid.toString()]);
        }
        else {
            processingProcess.kill();
        }
        processingProcess = null;
        vscode.window.showInformationMessage('Processing Sketch stopped.');
    }
}
class SynthBlocklyPanel {
    static currentPanel;
    static viewType = 'synthblocklyStage';
    _panel;
    _extensionContext;
    _extensionUri;
    _currentXmlPath;
    _disposables = [];
    static createOrShow(context) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        if (SynthBlocklyPanel.currentPanel) {
            SynthBlocklyPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel(SynthBlocklyPanel.viewType, 'SynthBlockly Stage', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(context.extensionUri, 'media'),
                vscode.Uri.joinPath(context.extensionUri, 'node_modules')
            ],
            retainContextWhenHidden: true
        });
        SynthBlocklyPanel.currentPanel = new SynthBlocklyPanel(panel, context);
    }
    constructor(panel, context) {
        this._panel = panel;
        this._extensionContext = context;
        this._extensionUri = context.extensionUri;
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'executeCode':
                    this._handleExecuteCode(message.code, message.xml);
                    return;
                case 'openProject':
                    this._handleOpenProject(message.isDirty);
                    return;
                case 'openHelp':
                    this._handleOpenHelp(message.url, message.fileName);
                    return;
                case 'saveProject':
                    this._handleSaveProject(message.xml, message.code);
                    return;
                case 'setProcessingPath':
                    this._handleSetProcessingPath();
                    return;
                case 'autoSaveProject':
                    this._handleAutoSave({ xml: message.xml, code: message.code });
                    return;
                case 'newProject':
                    this._handleNewProject(message.isDirty);
                    return;
                case 'webviewReady':
                    this._handleWebviewReady();
                    return;
                case 'showExamples':
                    this._handleShowExamples(message.isDirty);
                    return;
                case 'showPrompt':
                    this._handleShowPrompt(message.message, message.defaultValue, message.id);
                    return;
            }
        }, null, this._disposables);
        vscode.commands.executeCommand('setContext', 'synthblockly-stage.isWebviewOpen', true);
    }
    async _handleShowPrompt(prompt, defaultValue, id) {
        const result = await vscode.window.showInputBox({
            prompt: prompt,
            value: defaultValue
        });
        this._panel.webview.postMessage({
            command: 'promptResponse',
            id: id,
            value: result
        });
    }
    _handleWebviewReady() {
        // We do nothing here regarding auto-loading. 
        // The workspace starts empty by default.
        // lastPath is already stored in globalState and will be used when _handleOpenProject is called.
        this._currentXmlPath = undefined;
        this._panel.title = `SynthBlockly Stage`;
    }
    runSketch() {
        this._panel.webview.postMessage({ command: 'generateCode' });
    }
    async _handleOpenHelp(url, fileName) {
        try {
            let targetUri;
            if (fileName) {
                const filePath = path.join(this._extensionUri.fsPath, 'media', 'docs', fileName);
                targetUri = vscode.Uri.file(filePath);
            }
            else if (url) {
                targetUri = vscode.Uri.parse(url);
            }
            else {
                return;
            }
            await vscode.env.openExternal(targetUri);
        }
        catch (e) {
            vscode.window.showErrorMessage(`Failed to open help: ${e}`);
        }
    }
    async _handleSetProcessingPath() {
        const options = {
            canSelectMany: false,
            openLabel: 'Select processing-java.exe',
            filters: { 'Executable': ['exe', 'app', 'bin'] }
        };
        const fileUri = await vscode.window.showOpenDialog(options);
        if (fileUri && fileUri[0]) {
            const config = vscode.workspace.getConfiguration('synthblockly-stage');
            await config.update('processingPath', fileUri[0].fsPath, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Processing path updated: ${fileUri[0].fsPath}`);
        }
    }
    async _handleNewProject(isDirty) {
        if (isDirty) {
            const answer = await vscode.window.showWarningMessage("You have unsaved changes. Are you sure you want to start a new project?", { modal: true }, "Discard Changes");
            if (answer !== "Discard Changes") {
                return;
            }
        }
        this._currentXmlPath = undefined;
        this._panel.title = "SynthBlockly Stage";
        this._panel.webview.postMessage({
            command: 'initializeWorkspace',
            xml: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
            fileName: "",
            fullPath: ""
        });
    }
    async _handleOpenProject(isDirty) {
        if (isDirty) {
            const answer = await vscode.window.showWarningMessage("You have unsaved changes. Are you sure you want to open another project?", { modal: true }, "Discard Changes");
            if (answer !== "Discard Changes") {
                return;
            }
        }
        const lastPath = this._extensionContext.globalState.get('lastPath');
        const defaultUri = lastPath ? vscode.Uri.file(lastPath) : undefined;
        const options = {
            canSelectMany: false,
            openLabel: 'Open SynthBlockly Project',
            filters: { 'Blockly XML': ['xml'] },
            defaultUri: defaultUri
        };
        const fileUri = await vscode.window.showOpenDialog(options);
        if (fileUri && fileUri[0]) {
            this._currentXmlPath = fileUri[0].fsPath;
            const fileName = path.basename(this._currentXmlPath);
            this._extensionContext.globalState.update('lastPath', path.dirname(this._currentXmlPath));
            this._extensionContext.globalState.update('lastXmlPath', this._currentXmlPath);
            const xml = fs.readFileSync(this._currentXmlPath, 'utf8');
            this._panel.title = `SynthBlockly: ${fileName}`;
            this._panel.webview.postMessage({
                command: 'initializeWorkspace',
                xml: xml,
                fileName: fileName,
                fullPath: this._currentXmlPath
            });
        }
    }
    async _handleShowExamples(isDirty) {
        const examplesDir = path.join(this._extensionUri.fsPath, 'examples');
        if (!fs.existsSync(examplesDir)) {
            vscode.window.showInformationMessage("No examples found.");
            return;
        }
        // 掃描資料夾
        const examples = fs.readdirSync(examplesDir).filter(dir => {
            const fullPath = path.join(examplesDir, dir);
            return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, `${dir}.xml`));
        });
        if (examples.length === 0) {
            vscode.window.showInformationMessage("No examples found.");
            return;
        }
        // 顯示 QuickPick
        const selected = await vscode.window.showQuickPick(examples, {
            placeHolder: "Select an example to load",
            canPickMany: false
        });
        if (selected) {
            // 如果選中了，直接載入
            if (isDirty) {
                const answer = await vscode.window.showWarningMessage("You have unsaved changes. Are you sure you want to load an example?", { modal: true }, "Discard Changes");
                if (answer !== "Discard Changes") {
                    return;
                }
            }
            const exampleName = selected;
            const examplePath = path.join(examplesDir, exampleName, `${exampleName}.xml`);
            if (fs.existsSync(examplePath)) {
                this._currentXmlPath = examplePath;
                const xml = fs.readFileSync(examplePath, 'utf8');
                this._panel.title = `SynthBlockly: ${exampleName} (Example)`;
                this._panel.webview.postMessage({
                    command: 'initializeWorkspace',
                    xml: xml,
                    fileName: `${exampleName}.xml`,
                    fullPath: this._currentXmlPath
                });
            }
        }
    }
    _handleAutoSave(data) {
        if (!this._currentXmlPath)
            return;
        // Prevent auto-saving for examples
        if (this._currentXmlPath.includes(`${path.sep}examples${path.sep}`)) {
            return;
        }
        try {
            fs.writeFileSync(this._currentXmlPath, data.xml);
            const pdePath = path.join(path.dirname(this._currentXmlPath), `${path.basename(this._currentXmlPath, '.xml')}.pde`);
            fs.writeFileSync(pdePath, data.code);
            this._extensionContext.globalState.update('lastXmlPath', this._currentXmlPath);
        }
        catch (e) {
            console.error('[AutoSave] Failed:', e);
        }
    }
    /**
     * Clean name to be a valid Processing/Java identifier
     */
    _sanitizeProjectName(name) {
        // 1. Remove the .xml extension if present
        let clean = name.replace(/\.xml$/i, '');
        // 2. Replace any non-alphanumeric character (including dots and spaces) with underscores
        clean = clean.replace(/[^a-zA-Z0-9_]/g, '_');
        // 3. Ensure it doesn't start with a number (Java class naming rule)
        if (/^[0-9]/.test(clean)) {
            clean = "SB_" + clean;
        }
        return clean;
    }
    async _handleSaveProject(xml, code) {
        const lastPath = this._extensionContext.globalState.get('lastPath');
        const defaultUri = this._currentXmlPath ? vscode.Uri.file(this._currentXmlPath) : (lastPath ? vscode.Uri.file(lastPath) : undefined);
        const options = {
            saveLabel: 'Save SynthBlockly Project',
            filters: { 'Blockly XML': ['xml'] },
            defaultUri: defaultUri
        };
        const fileUri = await vscode.window.showSaveDialog(options);
        if (fileUri) {
            const userChosenPath = fileUri.fsPath;
            const parentDir = path.dirname(userChosenPath);
            const parentDirName = path.basename(parentDir);
            const rawFileName = path.basename(userChosenPath, '.xml');
            // Apply Sanitizer to ensure folder and files are Processing-legal
            const cleanName = this._sanitizeProjectName(rawFileName);
            let targetFolder;
            let finalXmlPath;
            let finalPdePath;
            // If the user selected an XML file inside a folder already named after the project,
            // we overwrite that project instead of creating a new nested folder.
            if (parentDirName === cleanName) {
                targetFolder = parentDir;
                finalXmlPath = path.join(targetFolder, `${cleanName}.xml`);
                finalPdePath = path.join(targetFolder, `${cleanName}.pde`);
            }
            else {
                // New Project structure: parent/CleanName/CleanName.xml
                targetFolder = path.join(parentDir, cleanName);
                finalXmlPath = path.join(targetFolder, `${cleanName}.xml`);
                finalPdePath = path.join(targetFolder, `${cleanName}.pde`);
            }
            if (!fs.existsSync(targetFolder)) {
                fs.mkdirSync(targetFolder, { recursive: true });
            }
            fs.writeFileSync(finalXmlPath, xml);
            fs.writeFileSync(finalPdePath, code);
            this._currentXmlPath = finalXmlPath;
            this._extensionContext.globalState.update('lastPath', targetFolder);
            this._extensionContext.globalState.update('lastXmlPath', this._currentXmlPath);
            const displayFileName = `${cleanName}.xml`;
            this._panel.title = `SynthBlockly: ${displayFileName}`;
            this._panel.webview.postMessage({
                command: 'initializeWorkspace',
                xml: xml,
                fileName: displayFileName,
                fullPath: this._currentXmlPath
            });
            vscode.window.showInformationMessage(`Project saved to: ${targetFolder}`);
            return finalXmlPath;
        }
        return undefined;
    }
    async _handleExecuteCode(code, xml) {
        if (!this._currentXmlPath) {
            const savedPath = await this._handleSaveProject(xml, code);
            if (!savedPath) {
                vscode.window.showWarningMessage("Please save your project before running.");
                return;
            }
        }
        const projectDir = path.dirname(this._currentXmlPath);
        const fileName = path.basename(this._currentXmlPath, '.xml');
        const sketchPdePath = path.join(projectDir, `${fileName}.pde`);
        const targetDataDir = path.join(projectDir, 'data');
        fs.writeFileSync(sketchPdePath, code);
        if (!fs.existsSync(targetDataDir)) {
            fs.mkdirSync(targetDataDir, { recursive: true });
        }
        const builtinSamplesDir = path.join(this._extensionUri.fsPath, 'media', 'samples');
        if (fs.existsSync(builtinSamplesDir)) {
            fs.readdirSync(builtinSamplesDir).forEach(cat => {
                const sourceCat = path.join(builtinSamplesDir, cat);
                const destCat = path.join(targetDataDir, cat);
                if (fs.statSync(sourceCat).isDirectory() && !fs.existsSync(destCat)) {
                    try {
                        fs.symlinkSync(sourceCat, destCat, 'junction');
                    }
                    catch (e) { }
                }
            });
        }
        this._startProcessing(projectDir);
    }
    _startProcessing(sketchPath) {
        stopProcessing();
        const config = vscode.workspace.getConfiguration('synthblockly-stage');
        let processingPath = config.get('processingPath');
        if (!processingPath || !fs.existsSync(processingPath)) {
            vscode.window.showWarningMessage('Please set processing-java.exe path.', 'Set Path').then(sel => {
                if (sel === 'Set Path')
                    this._handleSetProcessingPath();
            });
            return;
        }
        const outputChannel = vscode.window.createOutputChannel('SynthBlockly Stage Output');
        outputChannel.show();
        outputChannel.appendLine(`[Log] Execution Path: ${sketchPath}`);
        processingProcess = (0, child_process_1.spawn)(processingPath, [`--sketch=${sketchPath}`, '--run']);
        processingProcess.stdout?.on('data', (data) => outputChannel.append(data.toString()));
        processingProcess.stderr?.on('data', (data) => outputChannel.append(`[ERR] ${data.toString()}`));
        processingProcess.on('close', (code) => {
            outputChannel.appendLine(`--- Sketch finished ---`);
            processingProcess = null;
        });
    }
    dispose() {
        SynthBlocklyPanel.currentPanel = undefined;
        vscode.commands.executeCommand('setContext', 'synthblockly-stage.isWebviewOpen', false);
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x)
                x.dispose();
        }
    }
    async _update() {
        this._panel.webview.html = await this._getHtmlForWebview(this._panel.webview);
    }
    async _getHtmlForWebview(webview) {
        const mediaUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media'));
        const blocklyUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'blockly'));
        const blocklyMediaUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'blockly', 'media'));
        const iconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'icons'));
        const nonce = this._getNonce();
        const coreManifestUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'core_extension_manifest.json'));
        const toolboxXml = fs.readFileSync(path.join(this._extensionUri.fsPath, 'media', 'toolbox.xml'), 'utf8');
        const langUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', vscode.env.language.startsWith('zh') ? 'zh-hant.js' : 'en.js'));
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} data:; script-src 'nonce-${nonce}' ${webview.cspSource}; connect-src ${webview.cspSource}; media-src ${webview.cspSource};">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SynthBlockly Stage</title>
    <link rel="stylesheet" href="${mediaUri}/style.css">
</head>
<body>
    <div id="toolbar">
        <img id="newButton" class="toolbar-button" src="${iconUri}/new_24dp_1F1F1F.png" title="New Project">
        <img id="examplesButton" class="toolbar-button" src="${iconUri}/examples_24dp_1F1F1F.png" title="Load Example">
        <img id="openButton" class="toolbar-button" src="${iconUri}/load_project_24dp_1F1F1F.png" title="Open Project">
        <img id="saveButton" class="toolbar-button" src="${iconUri}/save_as_24dp_1F1F1F.png" title="Save As">
        <img id="setPathButton" class="toolbar-button" src="${iconUri}/settings_24dp_1F1F1F.png" title="Set Processing Path">
        <span id="projectName" class="project-name"></span>
        <span id="saveStatus" class="status-label"></span>
    </div>
    <div id="blocklyDiv"></div>
    <script id="toolbox-xml" type="text/xml" style="display: none;">${toolboxXml}</script>
    <script nonce="${nonce}" src="${blocklyUri}/blockly.js"></script>
    <script nonce="${nonce}" src="${blocklyUri}/field-multilineinput.js"></script>
    <script nonce="${nonce}" src="${blocklyUri}/field-colour.js"></script>
    <script nonce="${nonce}" src="${langUri}"></script>
    <script nonce="${nonce}" src="${mediaUri}/generators/_core.js"></script>
    <script nonce="${nonce}">
        window.coreExtensionManifestUri = "${coreManifestUri}";
        window.blocklyMediaUri = "${blocklyMediaUri}/";
        window.docsBaseUri = "${mediaUri}/docs/";
    </script>
    <script nonce="${nonce}" type="module" src="${mediaUri}/main.js"></script>
</body>
</html>`;
    }
    _getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map