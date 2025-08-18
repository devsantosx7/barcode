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
exports.SettingsHandler = void 0;
const electron_1 = require("electron");
const rxjs_1 = require("rxjs");
const settings_model_1 = require("../models/ionic/settings.model");
const config_1 = require("../config");
const ElectronStore = require("electron-store");
const node_machine_id_1 = require("node-machine-id");
const uuid_1 = require("uuid");
const os = require("os");
class SettingsHandler {
    constructor() {
        this.onSettingsChanged = new rxjs_1.ReplaySubject(); // triggered after the page load and on every setting change. See ElectronProvider.
        this.store = new ElectronStore();
        // this communication is needed because electronStore.onDidChange() triggers only within the same process
        electron_1.ipcMain.on('settings', (event, arg) => {
            const settings = this.store.get(config_1.Config.STORAGE_SETTINGS, new settings_model_1.SettingsModel(os.platform().toLowerCase()));
            this.settings = settings;
            this.onSettingsChanged.next(this.settings);
        });
    }
    static getInstance() {
        if (!SettingsHandler.instance) {
            SettingsHandler.instance = new SettingsHandler();
        }
        return SettingsHandler.instance;
    }
    // TODO: remove those pass thrugh methods
    get enableRealtimeStrokes() {
        return this.settings.enableRealtimeStrokes;
    }
    get enableOpenInBrowser() {
        return this.settings.enableOpenInBrowser;
    }
    get outputProfiles() {
        return this.settings.outputProfiles;
    }
    get newLineCharacter() {
        return this.settings.newLineCharacter;
    }
    get csvDelimiter() {
        return this.settings.csvDelimiter;
    }
    get exportOnlyText() {
        return this.settings.exportOnlyText;
    }
    get enableQuotes() {
        return this.settings.enableQuotes;
    }
    get enableHeaders() {
        return this.settings.enableHeaders;
    }
    get enableTray() {
        return this.settings.enableTray;
    }
    get openAutomatically() {
        return this.settings.openAutomatically;
    }
    get csvPath() {
        return this.settings.csvPath;
    }
    get xlsxPath() {
        return this.settings.xlsxPath;
    }
    get appendCSVEnabled() {
        return this.settings.appendCSVEnabled;
    }
    get outputToExcelEnabled() {
        return this.settings.outputToExcelEnabled;
    }
    get mapExcelHeadersToComponents() {
        return this.settings.mapExcelHeadersToComponents;
    }
    get outputToExcelMode() {
        return this.settings.outputToExcelMode;
    }
    get updateHeaderKey() {
        return this.settings.updateHeaderKey;
    }
    get typeMethod() {
        return this.settings.typeMethod;
    }
    get autoUpdate() {
        return this.settings.autoUpdate;
    }
    get onSmartphoneChargeCommand() {
        return this.settings.onSmartphoneChargeCommand;
    }
    get savedGeoLocations() {
        return this.store.get(config_1.Config.STORAGE_SAVED_GEOLOCATIONS, []);
    }
    get autoDelayMs() {
        return this.settings.autoDelayMs;
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
    // Duplicated code in the electron.ts file
    getServerUUID() {
        try {
            return (0, node_machine_id_1.machineIdSync)();
        }
        catch (_a) {
            let uuid;
            uuid = this.store.get('uuid', null);
            if (uuid == null) {
                uuid = (0, uuid_1.v4)();
                this.store.set('uuid', uuid);
            }
            return uuid;
        }
    }
}
exports.SettingsHandler = SettingsHandler;
//# sourceMappingURL=settings.handler.js.map