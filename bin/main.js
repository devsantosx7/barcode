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
const electron_1 = require("electron");
const WebSocket = require("ws");
const config_1 = require("./config");
const connection_handler_1 = require("./handlers/connection.handler");
const scans_handler_1 = require("./handlers/scans.handler");
const settings_handler_1 = require("./handlers/settings.handler");
const ui_handler_1 = require("./handlers/ui.handler");
const gsheet_handler_1 = require("./handlers/gsheet.handler");
const ElectronStore = require("electron-store");
require('@electron/remote/main').initialize();
const { isLicensed, flags, cfg } = require("../common/license");
if (!isLicensed()) {
    console.log("[license] app em modo não licenciado (regra padrão ativa)");
}
globalThis.__FEATURE_FLAGS__ = flags();
globalThis.__DEVELOPER_MODE__ = Boolean(cfg && cfg.developerMode);
console.log("[license] flags", globalThis.__FEATURE_FLAGS__);
let wss = null;
const settingsHandler = settings_handler_1.SettingsHandler.getInstance();
const uiHandler = ui_handler_1.UiHandler.getInstance(settingsHandler);
const gsheetHandler = gsheet_handler_1.GSheetHandler.getInstance();
const scansHandler = scans_handler_1.ScansHandler.getInstance(settingsHandler, uiHandler, gsheetHandler);
const connectionHandler = connection_handler_1.ConnectionHandler.getInstance(uiHandler, settingsHandler);
let ipcClient, lastArgv;
const store = new ElectronStore();
electron_1.ipcMain.on('electron-store-get', (event, key, defaultValue) => __awaiter(void 0, void 0, void 0, function* () {
    event.returnValue = store.get(key, defaultValue);
}));
electron_1.ipcMain.on('electron-store-set', (event, key, value) => __awaiter(void 0, void 0, void 0, function* () {
    store.set(key, value);
}));
electron_1.ipcMain
    .on('pageLoad', (event) => {
    if (wss != null || event.sender == null) {
        return;
    }
    ipcClient = event.sender;
    // The open-file event can be triggered before pageLoad event, so we
    // need to save the last argv value, so that we can send them to the
    // ionic project when the app finally loads. (macOS only)
    if (lastArgv) {
        ipcClient.send('second-instance-open', lastArgv);
        lastArgv = null;
    }
    wss = new WebSocket.Server({ port: config_1.Config.PORT });
    connectionHandler.announceServer();
    // TODO: get rid of setIpcClients, they generate unknown of unknowns
    connectionHandler.setIpcClient(ipcClient);
    uiHandler.setIpcClient(ipcClient);
    scansHandler.setIpcClient(ipcClient);
    gsheetHandler.setIpcClient(ipcClient);
    // wss events should be registered immediately
    wss.on('connection', (ws, req) => {
        console.log("ws(incoming connection)", req.connection.remoteAddress);
        // const clientAddress = req.connection.remoteAddress;
        ws.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
            console.log('ws(message): ', message);
            // TODO: da sempre false, perchè?
            // è necessario questo controllo?
            if (!uiHandler.mainWindow) {
                return;
            }
            let messageObj = JSON.parse(message.toString());
            messageObj = yield scansHandler.onWsMessage(ws, messageObj, req);
            messageObj = yield connectionHandler.onWsMessage(ws, messageObj, req);
            ipcClient.send(messageObj.action, messageObj); // forward ws messages to ipc
        }));
        ws.on('close', () => {
            console.log('ws(close)', req.connection.remoteAddress);
            connectionHandler.onWsClose(ws);
        });
        ws.on('error', (err) => {
            console.log('ws(error): ', err, req.connection.remoteAddress);
            connectionHandler.onWsError(ws, err);
        });
    });
    // app.on('before-quit', (event) => {
    //    closeServer();
    // })
    electron_1.app.on('window-all-closed', () => {
        closeServer();
        electron_1.app.quit(); // TODO: keep the server running (this can't be done at the moment because the scannings are saved in the browserWindow localStorage)
    });
});
// On macOS when you open an associated file (eg. btpt) electron emits
// the 'open-file' event.
// On Windows, instead, will be opened a second instance of the app, and
// it is handled on the ui.handler.ts file.
electron_1.app.on('will-finish-launching', () => {
    electron_1.app.on('open-file', (event, path) => {
        event.preventDefault();
        let argv = ['', path];
        lastArgv = argv;
        if (ipcClient) {
            ipcClient.send('second-instance-open', argv);
        }
    });
});
function closeServer() {
    console.log('closing server');
    if (wss) {
        wss.close();
        wss = null;
        connectionHandler.removeServerAnnounce();
    }
}
//# sourceMappingURL=main.js.map