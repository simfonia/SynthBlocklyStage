import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

let processingProcess: ChildProcess | null = null;

export function activate(context: vscode.ExtensionContext) {
    console.log('SynthBlockly Stage is active!');

    let disposable = vscode.commands.registerCommand('synthblockly-stage.openBlockly', () => {
        SynthBlocklyPanel.createOrShow(context.extensionUri);
    });

    context.subscriptions.push(disposable);

    context.subscriptions.push(
        vscode.commands.registerCommand('synthblockly-stage.runSketch', () => {
            if (SynthBlocklyPanel.currentPanel) {
                SynthBlocklyPanel.currentPanel.runSketch();
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('synthblockly-stage.stopSketch', () => {
            stopProcessing();
        })
    );
}

function stopProcessing() {
    if (processingProcess) {
        if (process.platform === 'win32') {
            // On Windows, processing-java spawns a child Java process. 
            // We need taskkill /T to kill the entire process tree.
            spawn('taskkill', ['/F', '/T', '/PID', processingProcess.pid!.toString()]);
        } else {
            processingProcess.kill();
        }
        processingProcess = null;
        vscode.window.showInformationMessage('Processing Sketch stopped.');
    }
}

class SynthBlocklyPanel {
    public static currentPanel: SynthBlocklyPanel | undefined;
    private static readonly viewType = 'synthblocklyStage';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _currentXmlPath: string | undefined; 
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (SynthBlocklyPanel.currentPanel) {
            SynthBlocklyPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            SynthBlocklyPanel.viewType,
            'SynthBlockly Stage',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'node_modules')
                ],
                retainContextWhenHidden: true
            }
        );

        SynthBlocklyPanel.currentPanel = new SynthBlocklyPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'executeCode':
                        this._handleExecuteCode(message.code);
                        return;
                    case 'openProject':
                        this._handleOpenProject();
                        return;
                    case 'saveProject':
                        this._handleSaveProject(message.xml);
                        return;
                    case 'newProject':
                        this._panel.webview.postMessage({ command: 'initializeWorkspace', xml: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>' });
                        return;
                    case 'webviewReady':
                        return;
                }
            },
            null,
            this._disposables
        );

        vscode.commands.executeCommand('setContext', 'synthblockly-stage.isWebviewOpen', true);
    }

    public runSketch() {
        this._panel.webview.postMessage({ command: 'generateCode' });
    }

    private async _handleOpenProject() {
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            openLabel: 'Open SynthBlockly Project',
            filters: { 'Blockly XML': ['xml'] }
        };

        const fileUri = await vscode.window.showOpenDialog(options);
        if (fileUri && fileUri[0]) {
            this._currentXmlPath = fileUri[0].fsPath; 
            const xml = fs.readFileSync(this._currentXmlPath, 'utf8');
            this._panel.webview.postMessage({ command: 'initializeWorkspace', xml: xml });
        }
    }

    private async _handleSaveProject(xml: string) {
        const options: vscode.SaveDialogOptions = {
            saveLabel: 'Save SynthBlockly Project',
            filters: { 'Blockly XML': ['xml'] },
            defaultUri: this._currentXmlPath ? vscode.Uri.file(this._currentXmlPath) : undefined
        };

        const fileUri = await vscode.window.showSaveDialog(options);
        if (fileUri) {
            this._currentXmlPath = fileUri.fsPath; 
            fs.writeFileSync(this._currentXmlPath, xml);
            vscode.window.showInformationMessage(`Project saved to ${path.basename(this._currentXmlPath)}`);
        }
    }

    private _handleExecuteCode(code: string) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        let baseDir: string;

        const isAscii = (str: string) => /^[\]x00-\x7F]*$/.test(str);
        
        if (workspaceFolders && isAscii(workspaceFolders[0].uri.fsPath)) {
            baseDir = workspaceFolders[0].uri.fsPath;
        } else {
            baseDir = path.join(process.env.TEMP || '.', 'SynthBlocklyStage');
            if (!fs.existsSync(baseDir)) {
                fs.mkdirSync(baseDir, { recursive: true });
            }
        }

        const sketchName = 'StageSketch';
        const sketchDir = path.join(baseDir, sketchName);
        const sketchFile = path.join(sketchDir, `${sketchName}.pde`);

        if (!fs.existsSync(sketchDir)) {
            fs.mkdirSync(sketchDir, { recursive: true });
        }

        let sourceDataDir: string | undefined;
        if (workspaceFolders) {
            const wsData = path.join(workspaceFolders[0].uri.fsPath, 'data');
            if (fs.existsSync(wsData)) sourceDataDir = wsData;
        }
        if (!sourceDataDir && this._currentXmlPath) {
            const xmlData = path.join(path.dirname(this._currentXmlPath), 'data');
            if (fs.existsSync(xmlData)) sourceDataDir = xmlData;
        }

        if (sourceDataDir) {
            const targetDataDir = path.join(sketchDir, 'data');
            if (!fs.existsSync(targetDataDir)) {
                try {
                    fs.symlinkSync(sourceDataDir, targetDataDir, 'junction');
                } catch(e) {
                    console.warn('Failed to link data directory:', e);
                }
            }
        }

        fs.writeFileSync(sketchFile, code);
        this._startProcessing(sketchDir);
    }

    private _startProcessing(sketchPath: string) {
        stopProcessing();

        const config = vscode.workspace.getConfiguration('synthblockly-stage');
        let processingPath = config.get<string>('processingPath');

        if (!processingPath) {
            const bundledPath = path.join(this._extensionUri.fsPath, 'processing-3.5.4', 'processing-java.exe');
            if (fs.existsSync(bundledPath)) {
                processingPath = bundledPath;
            } else {
                vscode.window.showErrorMessage('processing-java.exe not found. Please set the path in settings.');
                return;
            }
        }

        const outputChannel = vscode.window.createOutputChannel('SynthBlockly Stage Output');
        outputChannel.show();
        outputChannel.appendLine(`[Log] Using Sketch Path: ${sketchPath}`);
        outputChannel.appendLine(`[Log] Using Processing: ${processingPath}`);
        outputChannel.appendLine(`--- Launching Processing Sketch ---`);

        processingProcess = spawn(processingPath, [
            `--sketch=${sketchPath}`,
            '--run'
        ]);

        processingProcess.stdout?.on('data', (data) => outputChannel.append(data.toString()));
        processingProcess.stderr?.on('data', (data) => outputChannel.append(`[ERR] ${data.toString()}`));
        processingProcess.on('close', (code) => {
            outputChannel.appendLine(`--- Sketch finished (Exit code: ${code}) ---`);
            processingProcess = null;
        });
    }

    public dispose() {
        SynthBlocklyPanel.currentPanel = undefined;
        vscode.commands.executeCommand('setContext', 'synthblockly-stage.isWebviewOpen', false);
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) { x.dispose(); }
        }
    }

    private async _update() {
        this._panel.webview.html = await this._getHtmlForWebview(this._panel.webview);
    }

    private async _getHtmlForWebview(webview: vscode.Webview) {
        const mediaUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media'));
        const blocklyUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'blockly'));
        const blocklyMediaUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'blockly', 'media'));
        const iconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'icons'));
        const nonce = this._getNonce();

        const coreManifestUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'core_extension_manifest.json'));
        const toolboxPath = path.join(this._extensionUri.fsPath, 'media', 'toolbox.xml');
        const toolboxXml = fs.readFileSync(toolboxPath, 'utf8');

        const locale = vscode.env.language;
        const langFile = locale.startsWith('zh') ? 'zh-hant.js' : 'en.js';
        const langUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', langFile));

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
        <img id="newButton" class="toolbar-button" src="${iconUri}/new_24dp_1F1F1F.svg" title="New Project">
        <img id="openButton" class="toolbar-button" src="${iconUri}/open_24dp_1F1F1F.svg" title="Open Project">
        <img id="saveButton" class="toolbar-button" src="${iconUri}/save_24dp_1F1F1F.svg" title="Save Project">
    </div>
    <div id="blocklyDiv"></div>
    
    <script id="toolbox-xml" type="text/xml" style="display: none;">${toolboxXml}</script>

    <script nonce="${nonce}" src="${blocklyUri}/blockly.js"></script>
    <script nonce="${nonce}" src="${langUri}"></script>
    <script nonce="${nonce}" src="${mediaUri}/generators/_core.js"></script>
    <script nonce="${nonce}" src="${blocklyUri}/field-multilineinput.js"></script>
    <script nonce="${nonce}" src="${blocklyUri}/field-colour.js"></script>

    <script nonce="${nonce}">
        window.coreExtensionManifestUri = "${coreManifestUri}";
        window.blocklyMediaUri = "${blocklyMediaUri}/";
        window.isAngelMode = true;
    </script>

    <script nonce="${nonce}" type="module" src="${mediaUri}/main.js"></script>
</body>
</html>`;
    }

    private _getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}

export function deactivate() {}