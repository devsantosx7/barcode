"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UiHandler = void 0;
const electron_1 = require("electron");
const _path = require("path");
const fs = require("fs");
const config_1 = require("../config");
const utils_1 = require("../utils");
class UiHandler {
    constructor(settingsHandler) {
        this.tray = null;
        /**
         * quitImmediately must be set to TRUE before calling app.quit().
         *
         * This variable is used to detect when the user clicks the **close button** of the window:
         * since the 'close' event may fire for various reasons, everytime that quitImmediately is set
         * to FALSE we can assume that the user has clicked the close button.
         */
        this.quitImmediately = false;
        if (!electron_1.app.requestSingleInstanceLock()) {
            this.quitImmediately = true;
            electron_1.app.quit();
            return;
        }
        electron_1.app.on('second-instance', (event, argv, workingDirectory) => {
            // Send the second instance' argv value, so that it can grab the file
            // parameter, if there is one (.btpt)
            //
            // On macOS the file opening is handled differently, see the
            // main.ts>open-file event
            this.mainWindow.webContents.send('second-instance-open', argv);
            // Someone tried to run a second instance, we should focus the main window.
            // This can also be triggered from a btplink:// opening
            this.bringWindowUp();
        });
        // macOS Only -- We listen for the btplink:// here. On Windows, a second-instance-open event is triggered istead.
        electron_1.app.on('open-url', (event, url) => {
            event.preventDefault();
            this.mainWindow.webContents.send('open-url', url);
        });
        let canTriggerSettingsReadyCounter = 0;
        this.settingsHandler = settingsHandler;
        settingsHandler.onSettingsChanged.subscribe((settings) => {
            this.updateTray();
            canTriggerSettingsReadyCounter++;
            if (canTriggerSettingsReadyCounter == 2)
                this.onSettingsReady();
        });
        electron_1.app.on('ready', () => {
            this.createWindow();
            canTriggerSettingsReadyCounter++;
            if (canTriggerSettingsReadyCounter == 2)
                this.onSettingsReady();
            // Register btplink:// protocol
            if (process.platform === 'win32') {
                // Register the private URI scheme differently for Windows
                // https://stackoverflow.com/questions/45570589/electron-protocol-handler-not-working-on-windows
                electron_1.app.setAsDefaultProtocolClient(config_1.Config.BTPLINK_PROTOCOL, process.execPath, [electron_1.app.getAppPath()]);
            }
            else {
                electron_1.app.setAsDefaultProtocolClient(config_1.Config.BTPLINK_PROTOCOL);
            }
        });
        electron_1.app.on('window-all-closed', () => {
            // if (process.platform !== 'darwin') { // On OS X it is common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q, but since Barcode to PC needs the browser windows to perform operation on the localStorage this is not allowed
            electron_1.app.quit();
            // }
        });
        // app.on('activate', () => {
        //     if (this.mainWindow === null) { // On OS X it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open, but since the app will quit when there aren't active windows this event will never occour.
        //         this.createWindow()
        //     }
        // })
        electron_1.app.setName(config_1.Config.APP_NAME);
        if (electron_1.app.setAboutPanelOptions) {
            electron_1.app.setAboutPanelOptions({
                applicationName: config_1.Config.APP_NAME,
                applicationVersion: electron_1.app.getVersion(),
                credits: config_1.Config.AUTHOR,
            });
        }
        electron_1.ipcMain.on("onFirstHide", (e, a) => {
            // Warn the user that the window is hidden and is accessible from the tray icon
            electron_1.dialog.showMessageBox(null, {
                message: 'Window hidden',
                detail: electron_1.app.getName() + " has been hidden and will continue running in background. You can open the main window from the tray icon.",
                type: 'info',
                buttons: ["I understand"],
            });
        });
    }
    // Waits for the settings to be read and the 'ready' event to be sent
    onSettingsReady() {
        this.autoMinimize();
    }
    static getInstance(settingsHandler) {
        if (!UiHandler.instance) {
            UiHandler.instance = new UiHandler(settingsHandler);
        }
        return UiHandler.instance;
    }
    updateTray() {
        if (this.settingsHandler.enableTray) {
            if (this.tray == null) {
                let menuItems = [
                    // { label: 'Enable realtime ', type: 'radio', checked: false },
                    {
                        label: 'Exit', click: () => {
                            this.quitImmediately = true;
                            electron_1.app.quit();
                        }
                    },
                ];
                if (process.platform == 'darwin') {
                    // macOS
                    const icon = electron_1.nativeImage.createFromPath(_path.join(__dirname, '/../assets/tray/macos/icon.png'));
                    icon.setTemplateImage(true);
                    this.tray = new electron_1.Tray(icon);
                    menuItems.unshift({ label: 'Hide', role: 'hide' });
                    menuItems.unshift({ label: 'Show', click: () => { this.bringWindowUp(); } });
                }
                else if (process.platform.indexOf('win') != -1) {
                    // Windows
                    this.tray = new electron_1.Tray(electron_1.nativeImage.createFromPath((_path.join(__dirname, '/../assets/tray/windows/icon.ico'))));
                }
                else {
                    // Linux
                    this.tray = new electron_1.Tray(electron_1.nativeImage.createFromPath((_path.join(__dirname, '/../assets/tray/default.png'))));
                    menuItems.unshift({ label: 'Hide', role: 'hide', click: () => { this.mainWindow.hide(); } });
                    menuItems.unshift({ label: 'Show', click: () => { this.bringWindowUp(); } });
                }
                this.tray.on('click', (event, bounds) => {
                    if (process.platform != 'darwin')
                        this.mainWindow.isVisible() ? this.mainWindow.hide() : this.mainWindow.show();
                });
                const contextMenu = electron_1.Menu.buildFromTemplate(menuItems);
                this.tray.setContextMenu(contextMenu); // https://github.com/electron/electron/blob/master/docs/api/tray.md
                this.tray.setToolTip(electron_1.app.getName() + ' is running');
            }
        }
        else {
            if (this.tray != null) {
                this.tray.destroy();
                this.tray = null;
            }
        }
    }
    bringWindowUp() {
        if (this.mainWindow) {
            if (this.mainWindow.isMinimized())
                this.mainWindow.restore();
            this.mainWindow.show();
            this.mainWindow.focus();
            if (electron_1.app.dock != null) {
                electron_1.app.dock.show();
            }
        }
    }
    autoMinimize() {
        if (!UiHandler.IsFirstInstanceLaunch) {
            return;
        }
        // macOS
        if (process.platform === 'darwin' && this.settingsHandler.openAutomatically == 'minimized') {
            this.mainWindow.hide(); // corresponds to CMD+H, minimize() corresponds to clicking the yellow reduce to icon button
            if (this.settingsHandler.enableTray && electron_1.app.dock != null) {
                electron_1.app.dock.hide();
            }
        }
        // Windows and Linux do not have any minimization system settings, so
        // we have to read it from our settings
        if (process.platform !== 'darwin' && this.settingsHandler.openAutomatically == 'minimized') {
            if (this.settingsHandler.enableTray) {
                this.mainWindow.hide(); // removes the app from the taskbar
            }
            else {
                this.mainWindow.minimize(); // corresponds to clicking the reduce to icon button
            }
        }
        UiHandler.IsFirstInstanceLaunch = false;
    }
    createWindow() {
        this.mainWindow = new electron_1.BrowserWindow(UiHandler.WINDOW_OPTIONS);
        require("@electron/remote/main").enable(this.mainWindow.webContents);
        if (utils_1.Utils.IsDev()) {
            console.log('dev mode on');
            this.mainWindow.webContents.on('did-fail-load', () => {
                this.mainWindow.webContents.executeJavaScript(`document.write('Building Ionic project, please wait...')`);
                setTimeout(() => this.mainWindow.reload(), 2000);
            });
            this.mainWindow.loadURL('http://localhost:8200/');
            this.mainWindow.webContents.openDevTools({ mode: 'detach' });
            // const log = require("electron-log")
            // log.transports.file.level = "info"
            // autoUpdater.logger = log
        }
        else {
            let candidate = _path.join(__dirname, '../ui/index.html');
            if (!fs.existsSync(candidate))
                candidate = _path.join(__dirname, '../www/index.html');
            if (!fs.existsSync(candidate))
                candidate = _path.join(__dirname, '../renderer/index.html');
            console.log('[UI] carregando', candidate, 'exists?', fs.existsSync(candidate));
            if (fs.existsSync(candidate)) {
                this.mainWindow.loadFile(candidate);
            }
            else {
                this.mainWindow.loadURL('data:text/html,<h1>Renderer OK</h1>');
            }
        }
        if (global.__DEVELOPER_MODE__) {
            this.mainWindow.webContents.openDevTools({ mode: 'detach' });
        }
        if (process.platform === 'darwin') {
            let template = [
                {
                    label: config_1.Config.APP_NAME,
                    submenu: [
                        { role: 'about' },
                        { type: 'separator' },
                        { role: 'services', submenu: [] },
                        { type: 'separator' },
                        { role: 'hide' },
                        { role: 'hideOthers' },
                        { role: 'unhide' },
                        { type: 'separator' },
                        {
                            label: 'Quit ' + config_1.Config.APP_NAME, click: (menuItem, browserWindow, event) => {
                                this.quitImmediately = true;
                                electron_1.app.quit();
                            },
                            accelerator: 'CmdOrCtrl+Q',
                            registerAccelerator: true,
                        }
                    ]
                },
                {
                    label: 'Edit',
                    submenu: [
                        { role: "cut" },
                        { role: "copy" },
                        { role: "paste" },
                        { role: "selectAll" },
                        { type: 'separator' },
                        {
                            label: 'Find',
                            accelerator: process.platform === 'darwin' ? 'Cmd+F' : 'Ctrl+F',
                            click: () => {
                                this.ipcClient.send('find');
                            }
                        },
                    ]
                },
                {
                    label: 'View',
                    submenu: [
                        { role: 'resetZoom' },
                        { role: 'zoomIn' },
                        { role: 'zoomOut' },
                        { type: 'separator' },
                        { role: 'togglefullscreen' }
                    ]
                },
                {
                    role: 'window',
                    submenu: [
                        { role: 'minimize' },
                        { role: 'close' },
                        { role: 'zoom' },
                        { type: 'separator' },
                        { role: 'front' }
                    ]
                },
                {
                    role: 'help',
                    submenu: [
                    // {
                    //     label: 'Info',
                    //     click() { require('electron').shell.openExternal('https://electronjs.org') }
                    // }
                    ]
                }
            ];
            const menu = electron_1.Menu.buildFromTemplate(template);
            electron_1.Menu.setApplicationMenu(menu);
        }
        else if (process.platform === 'win32') {
            electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate([]));
        }
        this.mainWindow.on('close', (event) => {
            event.returnValue = true;
            if (this.quitImmediately) {
                return true;
            }
            // When the close button is clicked before the settings are loaded,
            // and thus the eventual trayIcon hasn't been created yet
            if (!this.settingsHandler) {
                return true;
            }
            if (this.settingsHandler.enableTray) {
                event.preventDefault();
                this.mainWindow.hide();
                if (electron_1.app.dock != null) {
                    electron_1.app.dock.hide();
                }
                event.returnValue = false;
                return false;
            }
            return true;
        });
        // Emitted when the window is closed.
        this.mainWindow.on('closed', () => {
            // Dereference the window object, usually you would store windows  in an array if your app supports multi windows, this is the time when you should delete the corresponding element.
            this.mainWindow = null;
            // wss.clients.forEach(client => {
            //     // if (client.readyState === WebSocket.OPEN) {
            //     client.close();
            //     // }
            // });
            // app.quit();
        });
        if (this.mainWindow.isVisible()) {
            if (electron_1.app.dock != null) {
                electron_1.app.dock.show();
            }
        }
        const selectionMenu = electron_1.Menu.buildFromTemplate([
            { role: 'copy' },
            { type: 'separator' },
            { role: 'selectAll' },
        ]);
        const inputMenu = electron_1.Menu.buildFromTemplate([
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { type: 'separator' },
            { role: 'selectAll' },
        ]);
        this.mainWindow.webContents.on('context-menu', (e, props) => {
            const { selectionText, isEditable } = props;
            if (isEditable) {
                inputMenu.popup({ window: this.mainWindow });
            }
            else if (selectionText && selectionText.trim() !== '') {
                selectionMenu.popup({ window: this.mainWindow });
            }
        });
    }
    onWsMessage(ws, message, req) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Method not implemented.");
            return message;
        });
    }
    onWsClose(ws) {
        throw new Error("Method not implemented.");
    }
    onWsError(ws, err) {
        throw new Error("Method not implemented.");
    }
    setIpcClient(ipcClient) {
        this.ipcClient = ipcClient;
        this.mainWindow.on('hide', () => {
            this.ipcClient.send('window-hide');
        });
    }
}
exports.UiHandler = UiHandler;
UiHandler.WINDOW_OPTIONS = {
    width: 1024, height: 768,
    minWidth: 800, minHeight: 600,
    title: config_1.Config.APP_NAME,
    webPreferences: {
        preload: _path.join(__dirname, '../preload.js'),
        contextIsolation: true,
        nodeIntegration: true,
        nativeWindowOpen: false,
    }
};
// Used to trigger the automatic window minimization only on the first launch
UiHandler.IsFirstInstanceLaunch = true;
//# sourceMappingURL=ui.handler.js.map