"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsModel = void 0;
const nutjs_key_model_1 = require("./nutjs-key.model");
/**
 * Server global settings, editable from the Settings page and also accessible
 * from the main process.
 *
 * WARNING: do not forget to initialize the fields! Otherwise they won't work
 * properly.
 */
class SettingsModel {
    constructor(os) {
        this.os = os;
        this.enableRealtimeStrokes = true;
        this.enableOpenInBrowser = false;
        /**
         * @deprecated use outputProfiles instead
         */
        this.typedString = [
            { name: 'BARCODE', value: 'BARCODE', type: 'barcode', skipOutput: false, label: null, enabledFormats: [] },
            { name: 'ENTER', value: '', keyId: nutjs_key_model_1.NutjsKey.Enter, type: 'key', modifierKeys: [] }
        ];
        this.outputProfiles = [
            {
                // Keep in sync with settings.ts, and barcode-to-pc-app/settings.ts/generateDefaultOutputProfiles()
                name: "Output template 1",
                version: null,
                outputBlocks: [
                    { name: 'BARCODE', value: 'BARCODE', type: 'barcode', skipOutput: false, label: null, enabledFormats: [], filter: null, errorMessage: null },
                    { name: 'ENTER', value: '', keyId: nutjs_key_model_1.NutjsKey.Enter, type: 'key', modifierKeys: [] }
                ]
            },
        ];
        this.newLineCharacter = (this.os.indexOf('windows') == -1) ? 'LF' : 'CRLF';
        this.csvDelimiter = ",";
        this.exportOnlyText = true;
        this.enableQuotes = false;
        this.enableHeaders = false;
        this.enableTray = true;
        this.openAutomatically = 'yes';
        this.appendCSVEnabled = false;
        this.outputToExcelEnabled = false;
        this.mapExcelHeadersToComponents = false;
        this.csvPath = null;
        this.xlsxPath = null;
        this.outputToExcelMode = 'add';
        this.updateHeaderKey = '';
        this.typeMethod = 'keyboard';
        this.autoUpdate = true;
        this.onSmartphoneChargeCommand = '';
        this.maxScanSessionsNumber = 2000; // Update also SettingsPage.MAX_SCAN_SESSION_NUMBER_UNLIMITED
        this.savedGeoLocations = [];
        this.autoDelayMs = 0;
    }
}
exports.SettingsModel = SettingsModel;
//# sourceMappingURL=settings.model.js.map