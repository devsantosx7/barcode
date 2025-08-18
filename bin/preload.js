"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const remote_1 = require("@electron/remote");
const electron_1 = require("electron");
const fs = require("fs");
const nodeMachineId = require("node-machine-id");
const os = require("os");
const path = require("path");
const uuid_1 = require("uuid");
/**
 * In the newer versions of Electron window.require('native dependency') has
 * been removed (context-isolation, see:
 * https://www.electronjs.org/docs/latest/tutorial/context-isolation).
 *
 * To communicate between native modules accessible only by the main process
 * and the renderer process we use this intermediate preload.js file.
 *
 * It's executed before the renderer starts, and exposes new objects to the
 * window object.
 *
 * Example call from the renderer: window.preload.nativeDep()
 *
 * Nested methods inside the dependency module cannot be called, so it's
 * required a pass-through method (see below).
 *
 * Promises do not work. Use synchronous methods.
 */
electron_1.contextBridge.exposeInMainWorld('preload', {
    ipcRenderer: {
        on(channel, listener) {
            return electron_1.ipcRenderer.on(channel, listener);
        },
        send(channel, ...args) {
            return electron_1.ipcRenderer.send(channel, args);
        },
        removeAllListeners(channel) {
            return electron_1.ipcRenderer.removeAllListeners(channel);
        },
        removeListener(channel, listener) {
            return electron_1.ipcRenderer.removeListener(channel, listener);
        },
    },
    showSaveDialogSync: (options) => {
        return remote_1.dialog.showSaveDialogSync((0, remote_1.getCurrentWindow)(), options);
    },
    showMessageBoxSync: (options) => {
        return remote_1.dialog.showMessageBoxSync(null, options);
    },
    showOpenDialogSync: (options) => {
        return remote_1.dialog.showOpenDialogSync((0, remote_1.getCurrentWindow)(), options);
    },
    appGetVersion: remote_1.app.getVersion,
    appGetLoginItemSettings: remote_1.app.getLoginItemSettings,
    appSetLoginItemSettings: remote_1.app.setLoginItemSettings,
    appGetPath: remote_1.app.getPath,
    shell: electron_1.shell,
    Menu: electron_1.Menu,
    MenuItem: electron_1.MenuItem,
    store: {
        get(key, defaultValue) {
            return electron_1.ipcRenderer.sendSync('electron-store-get', key, defaultValue);
        },
        set(key, value) {
            electron_1.ipcRenderer.send('electron-store-set', key, value);
        },
    },
    nodeMachineId: nodeMachineId,
    v4: uuid_1.v4,
    processPlatform: remote_1.process.platform,
    processArgv: remote_1.process.argv,
    path: path,
    systemPreferences: remote_1.systemPreferences,
    systemPreferencesIsTrustedAccessibilityClient: remote_1.systemPreferences.isTrustedAccessibilityClient,
    os: os,
    fsWriteFileSync: (path, data, options) => {
        return fs.writeFileSync(path, data, options);
    },
    fsReadFileSync: (path, options) => {
        return fs.readFileSync(path, options);
    },
});
//# sourceMappingURL=preload.js.map