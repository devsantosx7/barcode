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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScansHandler = void 0;
const axios_1 = require("axios");
const axios_oauth_1_0a_1 = require("axios-oauth-1.0a");
const child_process_1 = require("child_process");
const parse = require("csv-parse/lib/sync");
const stringify = require("csv-stringify");
const electron_1 = require("electron");
const fs = require("fs");
const http = require("http");
const https = require("https");
const os = require("os");
const isNumeric_1 = require("rxjs/util/isNumeric");
const semver_1 = require("semver");
const Supplant = require("supplant");
const request_model_1 = require("../models/ionic/request.model");
const response_model_1 = require("../models/ionic/response.model");
const scan_model_1 = require("../models/ionic/scan.model");
const config_1 = require("../config");
const woocommerce_rest_api_1 = require("@woocommerce/woocommerce-rest-api");
const XLSX = require("xlsx");
XLSX.set_fs(fs);
// Instead of using the classic import syntax, we dynamically load nutjs, so that
// we can apply a fallback when the library is not supported.
//
// Original import: import { keyboard, Key } from '@nut-tree-fork/nut-js';
let nut, DefaultClipboardProvider;
let nutLoaded = true;
try {
    nut = require('@nut-tree-fork/nut-js');
    ({ DefaultClipboardProvider } = require('@nut-tree-fork/default-clipboard-provider'));
}
catch (e) {
    nutLoaded = false;
    console.warn('nut-js indisponível; desativando typing/clipboard:', e.message);
    nut = {
        keyboard: {
            type: async () => { },
            pressKey: async () => { },
            releaseKey: async () => { },
            config: {}
        },
        clipboard: { setText: async () => { } },
        Key: {}
    };
    DefaultClipboardProvider = class {
    };
}
const { keyboard, Key } = nut;
class ScansHandler {
    constructor(settingsHandler, uiHandler, gsheet) {
        this.settingsHandler = settingsHandler;
        this.uiHandler = uiHandler;
        this.gsheet = gsheet;
        this.devices = {};
        setTimeout(() => {
            if (!nutLoaded) {
                electron_1.app.on('ready', () => __awaiter(this, void 0, void 0, function* () {
                    const result = yield electron_1.dialog.showMessageBox(this.uiHandler.mainWindow, {
                        type: 'error',
                        title: 'Platform not supported',
                        buttons: ['Download v3.18.1'],
                        message: 'Please downgrade the server version to v3.18.1 to use it on this computer. (Use the "Versions archive" button)',
                    });
                    if (result.response === 0) {
                        yield electron_1.shell.openExternal('https://barcodetopc.com/download/');
                    }
                    process.exit(1);
                }));
            }
        }, 60000);
    }
    static getInstance(settingsHandler, uiHandler, gsheet) {
        if (!ScansHandler.instance) {
            ScansHandler.instance = new ScansHandler(settingsHandler, uiHandler, gsheet);
        }
        return ScansHandler.instance;
    }
    onWsMessage(ws, message, req) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log('message', message)
            switch (message.action) {
                case request_model_1.requestModel.ACTION_PUT_SCAN_SESSIONS: {
                    let request = message;
                    // Prevent malformed requests
                    // At the moment the server supports only one scanSession at a time
                    if (request.scanSessions.length != 1) {
                        return message;
                    }
                    // If there are more than one scan inside the session it means
                    // that it's a request to sync an archieved scanSession,
                    // So we can skip executing the output template.
                    //
                    // Note: perhaps do a separate request would be a better solution?
                    if (request.scanSessions.length == 1 && request.scanSessions[0].scannings && request.scanSessions[0].scannings.length != 1) {
                        // What if the archived scanSession contains a scan with ack = false?
                        // For example it would imply that the RUN component has never been executed.
                        // Workaround: discard these scans and let the user sync them using the sync button.
                        //             the app will continue to display the (!) red mark.
                        request.scanSessions = request.scanSessions.map(x => {
                            x.scannings = x.scannings.filter(x => x.ack);
                            return x;
                        })
                            // If the scanSessions contains ALL .ack = false, then discard the enteire scan session to avoid empty user interface.
                            .filter(x => x.scannings.length != 0);
                        return message;
                    }
                    // The only possible case left is when there is only one scanSession:
                    let scanSession = request.scanSessions[0];
                    let scan = scanSession.scannings[0];
                    // Set this variable to TRUE when an outputBlock.value is changed from the server
                    // This way the ACK response will communicate to the app the updated scan value.
                    // This was the v3.12.0 way of executing remote components
                    // @deprecated
                    let outputBloksValueChanged = false;
                    // Keyboard emulation
                    for (let outputBlock of scan.outputBlocks) {
                        // Legacy code that skips the keyboard output of the components
                        // when the Skip Output option is enabled, except for some components
                        // wich in the older version of the app had a business-logic code embedded
                        // in the Keyboard Emulation
                        if (outputBlock.skipOutput &&
                            outputBlock.type != 'http' &&
                            outputBlock.type != 'run' &&
                            outputBlock.type != 'csv_lookup' &&
                            outputBlock.type != 'csv_update' &&
                            outputBlock.type != 'google_sheets') {
                            // For these components the continue; is called inside the switch below (< v3.12.0)
                            continue;
                        }
                        switch (outputBlock.type) {
                            case 'key':
                                yield this.keyTap(Number(outputBlock.keyId), outputBlock.modifierKeys.map(x => Number(x)));
                                break;
                            case 'text':
                                yield this.typeString(outputBlock.value);
                                break;
                            case 'variable':
                                yield this.typeString(outputBlock.value);
                                break;
                            case 'date_time':
                                yield this.typeString(outputBlock.value);
                                break;
                            case 'function':
                                yield this.typeString(outputBlock.value);
                                break;
                            case 'barcode':
                                yield this.typeString(outputBlock.value);
                                break;
                            case 'select_option':
                                yield this.typeString(outputBlock.value);
                                break;
                            case 'image': {
                                if (outputBlock.outputImagePath) {
                                    const base64 = outputBlock.image.split(',')[1];
                                    const buffer = Buffer.from(base64, 'base64');
                                    fs.writeFile(outputBlock.outputImagePath, buffer, (err) => {
                                        if (err) {
                                            console.error(err);
                                        }
                                    });
                                }
                                break;
                            }
                            case 'delay': {
                                if ((0, isNumeric_1.isNumeric)(outputBlock.value)) {
                                    yield new Promise(resolve => setTimeout(resolve, parseInt(outputBlock.value)));
                                }
                                break;
                            }
                            case 'woocommerce': {
                                if (!outputBlock.skipOutput) {
                                    yield this.typeString(outputBlock.value);
                                }
                                break;
                            }
                            case 'http': {
                                if ((0, semver_1.lt)(this.devices[request.deviceId].version, new semver_1.SemVer('3.12.0'))) {
                                    /** @deprecated */
                                    if (outputBlock.skipOutput) {
                                        axios_1.default.request({ url: outputBlock.value, method: outputBlock.method, timeout: outputBlock.timeout || config_1.Config.DEFAULT_COMPONENT_TIMEOUT });
                                    }
                                    else {
                                        try {
                                            let response = (yield axios_1.default.request({ url: outputBlock.value, method: outputBlock.method, timeout: outputBlock.timeout || config_1.Config.DEFAULT_COMPONENT_TIMEOUT })).data;
                                            if (typeof response == 'object') {
                                                response = JSON.stringify(response);
                                            }
                                            outputBlock.value = response;
                                            // message = request;
                                            yield this.typeString(outputBlock.value);
                                        }
                                        catch (error) {
                                            // Do not change the value when the request fails to allow the Send again feature to work
                                            // if (error.code) {
                                            //      if (error.code == 'ECONNREFUSED') outputBlock.value = 'Connection refused';
                                            // }
                                        }
                                        outputBloksValueChanged = true;
                                    }
                                }
                                else {
                                    // New versions, where the app is >= v3.12.0
                                    if (!outputBlock.skipOutput)
                                        yield this.typeString(outputBlock.value);
                                    // When the skipOutput is true, we don't do anything.
                                    // At this point the component has been already
                                    // executed by the ACTION_REMOTE_COMPONENT request.
                                    // The same applies to the RUN and CSV LOOKUP components.
                                }
                                break;
                            }
                            case 'run': {
                                if ((0, semver_1.lt)(this.devices[request.deviceId].version, new semver_1.SemVer('3.12.0'))) {
                                    /** @deprecated */
                                    if (outputBlock.skipOutput) {
                                        (0, child_process_1.exec)(outputBlock.value, { cwd: os.homedir(), timeout: outputBlock.timeout || config_1.Config.DEFAULT_COMPONENT_TIMEOUT });
                                    }
                                    else {
                                        try {
                                            outputBlock.value = (0, child_process_1.execSync)(outputBlock.value, { cwd: os.homedir(), timeout: outputBlock.timeout || config_1.Config.DEFAULT_COMPONENT_TIMEOUT }).toString();
                                            yield this.typeString(outputBlock.value);
                                        }
                                        catch (error) {
                                            // Do not change the value when the command fails to allow the Send again feature to work
                                            // if (error.code) {
                                            //     if (error.code == 'ETIMEDOUT') outputBlock.value = 'Timeout. Max allowed 10 seconds';
                                            //     if (error.code == 'ENOBUFS') outputBlock.value = 'Too much output. Max allowed 1024 bytes';
                                            // }
                                        }
                                        outputBloksValueChanged = true;
                                    }
                                }
                                else {
                                    if (!outputBlock.skipOutput)
                                        yield this.typeString(outputBlock.value);
                                }
                                break;
                            }
                            case 'csv_lookup': {
                                if ((0, semver_1.lt)(this.devices[request.deviceId].version, new semver_1.SemVer('3.12.0'))) {
                                    /** @deprecated */
                                    try {
                                        const content = fs.readFileSync(outputBlock.csvFile).toString().replace(/^\ufeff/, '');
                                        const records = parse(content, { columns: false, ltrim: true, rtrim: true, });
                                        const resultRow = records.find(x => x[outputBlock.searchColumn - 1] == outputBlock.value);
                                        outputBlock.value = resultRow[outputBlock.resultColumn - 1];
                                        yield this.typeString(outputBlock.value);
                                    }
                                    catch (error) {
                                        // If there is an error opening the file: do nothing
                                        if (error.code == 'ENOENT')
                                            continue;
                                        // If there is an error finding the desired columns
                                        outputBlock.value = outputBlock.notFoundValue;
                                    }
                                    outputBloksValueChanged = true;
                                }
                                else {
                                    if (!outputBlock.skipOutput)
                                        yield this.typeString(outputBlock.value);
                                }
                                break;
                            }
                            case 'google_sheets':
                            case 'csv_update': {
                                if (!outputBlock.skipOutput)
                                    yield this.typeString(outputBlock.value);
                                break;
                            }
                        } // end switch(outputBlock.type)
                    } // end for
                    // Append to CSV/Excel
                    // Compute the variables for the file path
                    let variables = {
                        barcodes: [],
                        barcode: null,
                        number: null,
                        text: null,
                        /**
                         * We use the date of the Scan Session because it may be
                         * get synced later, and this may cause even days of
                         * difference => We use the most close date we've have
                         * compared to the actual scan date.
                         *
                         * We're not using the date from the Output template
                         * because there isn't a way to tell if a block
                         * contains a date since the TIMESTAMP component is of
                         * variable type. Solution => create a separate type
                         *
                         * Note that in the Output Template is handled
                         * differently (app side) by using the actual scan date
                         * instead.
                        */
                        timestamp: (scanSession.date * 1000),
                        // We assign a default value to date for backwards compatibility
                        // If the output template is created with a v3.17.0+ version
                        // the value of the date variable will be overwritten below.
                        date: new Date(scanSession.date).toISOString().slice(0, 10),
                        // The time variable is @deprecated. We keep it for backwards compatibility
                        time: new Date(scanSession.date).toLocaleTimeString().replace(/:/g, '-'),
                        date_time: null,
                        scan_session_name: scanSession.name,
                        device_name: null,
                        select_option: null,
                        run: null,
                        http: null,
                        woocommerce: null,
                        csv_lookup: null,
                        csv_update: null,
                        google_sheets: null,
                        javascript_function: null,
                        static_text: null,
                        geolocation: null,
                    };
                    // Search if there is a corresponding Output component to assign to the NULL variables
                    let keys = Object.keys(variables);
                    for (let i = 0; i < keys.length; i++) {
                        let key = keys[i];
                        if (variables[key] === null) { // Skips barcodes, timestamp, date, etc.
                            // Extract the variable value from the Output template
                            let value = 'Add a ' + key.toUpperCase() + ' component to the Output template';
                            let outputBlock = scanSession.scannings[0].outputBlocks.find(x => x.name.toLowerCase() == key);
                            if (typeof (outputBlock) != "undefined") {
                                value = outputBlock.value;
                            }
                            variables[key] = value;
                        }
                        else if (key == 'barcodes') {
                            let barcodes = scanSession.scannings[0].outputBlocks.filter(x => x.name.toLowerCase() == 'barcode').map(x => x.value);
                            variables.barcodes = barcodes;
                        }
                    }
                    const newLineCharacter = this.settingsHandler.newLineCharacter.replace('CR', '\r').replace('LF', '\n');
                    // Avoid writing the same scan twice, unless the user explicitly wants it
                    if (!scanSession.scannings[0].ack || (scanSession.scannings[0].ack == true && scanSession.scannings[0].repeated == true)) {
                        if (this.settingsHandler.outputToExcelEnabled && this.settingsHandler.xlsxPath) {
                            try {
                                // Inject the variables to the file path
                                const path = new Supplant().text(this.settingsHandler.xlsxPath, variables);
                                const workbook = XLSX.readFile(path);
                                const sheetName = workbook.SheetNames[0];
                                const worksheet = workbook.Sheets[sheetName];
                                let jsonExistingData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                                const existingDataHeaders = jsonExistingData[0];
                                const csvDataWithHeaders = scan_model_1.ScanModel.ToCSV(scanSession.scannings, // Warning: contains only the last scan
                                this.settingsHandler.exportOnlyText, this.settingsHandler.enableQuotes, this.settingsHandler.csvDelimiter, newLineCharacter, this.settingsHandler.mapExcelHeadersToComponents);
                                // Append a new line to the existing data
                                let jsonNewRow;
                                let headers2ComponentsIndexMap = {};
                                if (this.settingsHandler.mapExcelHeadersToComponents) {
                                    // Match the headers with the existing data
                                    const newDataHeaders = csvDataWithHeaders.split(newLineCharacter)[0].split(this.settingsHandler.csvDelimiter);
                                    const newData = csvDataWithHeaders.split(newLineCharacter)[1].split(this.settingsHandler.csvDelimiter);
                                    console.log('New data headers:', newDataHeaders);
                                    console.log('New data:', newData);
                                    // Create an empty array that has the same length as the existingDataHeaders
                                    jsonNewRow = new Array(existingDataHeaders.length).fill(null);
                                    for (let i = 0; i < newDataHeaders.length; i++) {
                                        // try to put the newDataCSV into the same order of the existing header that we have in existingDataHeaders
                                        const index = existingDataHeaders.indexOf(newDataHeaders[i]);
                                        if (index != -1) {
                                            jsonNewRow[index] = newData[i];
                                            headers2ComponentsIndexMap[index] = i;
                                            console.log(`Mapped component ${newDataHeaders[i]} to Excel header ${existingDataHeaders[index]} (${i} -> ${index})`);
                                        }
                                        else {
                                            console.log(`Cannot map component ${newDataHeaders[i]} (index: ${i}) to any of the Excel header items ${existingDataHeaders}`);
                                        }
                                    }
                                }
                                else {
                                    // Simple append
                                    jsonNewRow = csvDataWithHeaders.split(newLineCharacter)[0].split(this.settingsHandler.csvDelimiter);
                                }
                                if (this.settingsHandler.outputToExcelMode == 'add') {
                                    jsonExistingData.push(jsonNewRow.map(x => x || '')); // Fill the empty cells with empty strings
                                }
                                else if (this.settingsHandler.outputToExcelMode == 'update') {
                                    // Find the column Header that matches the component Label
                                    const hederIndex = existingDataHeaders.indexOf(this.settingsHandler.updateHeaderKey);
                                    const componentsLabels = csvDataWithHeaders.split(newLineCharacter)[0].split(this.settingsHandler.csvDelimiter);
                                    const keyComponentIndex = componentsLabels.indexOf(this.settingsHandler.updateHeaderKey);
                                    let success = false;
                                    if (hederIndex != -1 && keyComponentIndex != -1) {
                                        // Find the first match
                                        success = ScansHandler.updateFirstMatch(jsonExistingData, jsonNewRow, headers2ComponentsIndexMap, hederIndex, keyComponentIndex);
                                    }
                                    if (!success) {
                                        // Fallback to 'add'
                                        jsonExistingData.push(jsonNewRow);
                                    }
                                }
                                const newWorksheet = XLSX.utils.aoa_to_sheet(jsonExistingData);
                                workbook.Sheets[sheetName] = newWorksheet;
                                XLSX.writeFile(workbook, path);
                            }
                            catch (error) {
                                electron_1.dialog.showMessageBox(this.uiHandler.mainWindow, {
                                    type: 'error',
                                    title: 'Excel Write error',
                                    buttons: ['OK'],
                                    message: "An error occurred while appending the scan to the specified Excel file. Please make sure that:\n\n\t1) the file is not open in other programs\n\t2) the server has the write permissions to the specified path\n\t3) the file name doesn't contain special characters"
                                });
                                console.log('Excel/CSV Write error:', error);
                            }
                        }
                        if (this.settingsHandler.appendCSVEnabled && this.settingsHandler.csvPath) {
                            // Inject the variables to the file path
                            const path = new Supplant().text(this.settingsHandler.csvPath, variables);
                            // Generate header when needed
                            let header = null;
                            if (this.settingsHandler.enableHeaders) {
                                const headerAndData = scan_model_1.ScanModel.ToCSV(scanSession.scannings, this.settingsHandler.exportOnlyText, this.settingsHandler.enableQuotes, this.settingsHandler.csvDelimiter, newLineCharacter, true);
                                const firstRow = fs.existsSync(path) && (fs.readFileSync(path, 'utf8').match(/(^.*)/) || [])[1] || '';
                                // Check if a non-empty and valid header has been generated from the data
                                if (headerAndData && headerAndData.length > 0 && headerAndData.split(newLineCharacter).length > 0) {
                                    // Generate the final string that will be used as header only if it is not already in the file
                                    const isHeaderPresent = firstRow && firstRow != '' && firstRow.includes(headerAndData[0]);
                                    if (!isHeaderPresent) {
                                        header = headerAndData.split(newLineCharacter)[0];
                                    }
                                }
                            }
                            // The ToCSV() method includes the skipOutput logic
                            let rows = scan_model_1.ScanModel.ToCSV(scanSession.scannings, // Warning: contains only the last scan
                            this.settingsHandler.exportOnlyText, this.settingsHandler.enableQuotes, this.settingsHandler.csvDelimiter, newLineCharacter, false);
                            try {
                                if (rows.length != 0) {
                                    fs.appendFileSync(path, rows + newLineCharacter);
                                    // Prepend the header
                                    if (header) {
                                        const data = fs.readFileSync(path);
                                        const fd = fs.openSync(path, 'w+');
                                        const insert = Buffer.from(header + newLineCharacter);
                                        fs.writeSync(fd, insert, 0, insert.length, 0);
                                        fs.writeSync(fd, data, 0, data.length, insert.length);
                                        fs.close(fd, (err) => {
                                            if (err)
                                                console.log('CSV Append Header Error:', err);
                                        });
                                    }
                                }
                            }
                            catch (error) {
                                electron_1.dialog.showMessageBox(this.uiHandler.mainWindow, {
                                    type: 'error',
                                    title: 'CSV Write error',
                                    buttons: ['OK'],
                                    message: "An error occurred while appending the scan to the specified CSV file. Please make sure that:\n\n\t1) the file is not open in other programs\n\t2) the server has the write permissions to the specified path\n\t3) the file name doesn't contain special characters"
                                });
                                console.log('Excel/CSV Write error:', error);
                            }
                        }
                    }
                    if (this.settingsHandler.enableOpenInBrowser) {
                        electron_1.shell.openExternal(scan_model_1.ScanModel.ToString(scan));
                    }
                    let updatedOutputBloks = null;
                    if (outputBloksValueChanged) {
                        updatedOutputBloks = scan.outputBlocks;
                        scan.displayValue = scan_model_1.ScanModel.ToString(scan);
                        message = request;
                    }
                    // ACK
                    let response = new response_model_1.responseModelPutScanAck();
                    response.fromObject({
                        scanId: scan.id,
                        scanSessionId: scanSession.id,
                        outputBlocks: updatedOutputBloks,
                        serverUUID: this.settingsHandler.getServerUUID(),
                    });
                    ws.send(JSON.stringify(response));
                    // END ACK
                    break;
                }
                case request_model_1.requestModel.ACTION_ON_SMARTPHONE_CHARGE:
                    let request = message;
                    (0, child_process_1.exec)(this.settingsHandler.onSmartphoneChargeCommand, { cwd: os.homedir() });
                    break;
                case request_model_1.requestModel.ACTION_HELO: {
                    let request = message;
                    this.devices[request.deviceId] = {
                        version: new semver_1.SemVer(request.version),
                        name: request.deviceName,
                    };
                    break;
                }
                case request_model_1.requestModel.ACTION_REMOTE_COMPONENT: {
                    // REMOTE_COMPONENT' job is to perform an action on the server,
                    // and then write/overwrite the results in the request.outputBlock
                    // object and send it back to the app.
                    let request = message;
                    let remoteComponentResponse = new response_model_1.responseModelRemoteComponentResponse();
                    let responseOutputBlock = request.outputBlock;
                    let errorMessage = null;
                    switch (request.outputBlock.type) {
                        case 'woocommerce': {
                            try {
                                process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
                                const wooCommerce = new woocommerce_rest_api_1.default({
                                    url: request.outputBlock.url_woocommerce,
                                    consumerKey: request.outputBlock.consumer_key,
                                    consumerSecret: request.outputBlock.consumer_secret,
                                    version: 'wc/v3',
                                });
                                let data = request.outputBlock.fields.reduce((params, field) => { params[field.key] = field.value; return params; }, {});
                                const endPoint = request.outputBlock.value.toLowerCase().indexOf('product') != -1 ? 'products' : 'orders';
                                switch (request.outputBlock.value) {
                                    case 'createOrder':
                                    case 'createProduct': {
                                        responseOutputBlock.value = JSON.stringify((yield wooCommerce.post(endPoint, data)).data);
                                        break;
                                    }
                                    case 'retriveOrder':
                                    case 'retriveProduct': {
                                        responseOutputBlock.value = JSON.stringify((yield wooCommerce.get(`${endPoint}/${data['id'] || ''}`, data)).data);
                                        break;
                                    }
                                    case 'updateOrder':
                                    case 'updateProduct': {
                                        // @ts-ignore
                                        const { id } = data, paramsWithoutId = __rest(data, ["id"]);
                                        responseOutputBlock.value = JSON.stringify((yield wooCommerce.put(`${endPoint}/${data['id'] || ''}`, paramsWithoutId)).data);
                                        break;
                                    }
                                    case 'deleteOrder':
                                    case 'deleteProduct': {
                                        // @ts-ignore
                                        const { id } = data, paramsWithoutId = __rest(data, ["id"]);
                                        responseOutputBlock.value = JSON.stringify((yield wooCommerce.delete(`${endPoint}/${data['id'] || ''}`, paramsWithoutId)).data);
                                        break;
                                    }
                                }
                            }
                            catch (error) {
                                responseOutputBlock.value = "";
                                errorMessage = 'The WOOCOMMERCE ' + request.outputBlock.value.toUpperCase() + ' request failed. <br>';
                                errorMessage += '<br><b>Error</b>: ' + error.message;
                                if (error.response) {
                                    errorMessage += '<br><b>Response Data</b>: ' + JSON.stringify(error.response.data);
                                    errorMessage += '<br><b>Response Headers</b>: ' + JSON.stringify(error.response.headers);
                                }
                            }
                            finally { }
                            break;
                        }
                        case 'http': {
                            try {
                                let params = JSON.parse(request.outputBlock.httpParams || '{}');
                                if (Object.keys(params).length === 0)
                                    params = null;
                                let haeders = JSON.parse(request.outputBlock.httpHeaders || '{}');
                                if (Object.keys(haeders).length === 0)
                                    haeders = null;
                                // Add OAuth header
                                const client = axios_1.default.create();
                                if (request.outputBlock.httpOAuthMethod && request.outputBlock.httpOAuthMethod != 'disabled') {
                                    (0, axios_oauth_1_0a_1.default)(client, {
                                        algorithm: request.outputBlock.httpOAuthMethod,
                                        key: request.outputBlock.httpOAuthConsumerKey,
                                        secret: request.outputBlock.httpOAuthConsumerSecret,
                                    });
                                }
                                process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
                                let response = (yield client.request({
                                    url: request.outputBlock.value,
                                    data: request.outputBlock.httpData,
                                    params: params,
                                    headers: haeders,
                                    method: request.outputBlock.method || request.outputBlock.httpMethod,
                                    timeout: request.outputBlock.timeout || config_1.Config.DEFAULT_COMPONENT_TIMEOUT,
                                    httpAgent: new http.Agent(),
                                    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                                })).data;
                                if (typeof response == 'object')
                                    response = JSON.stringify(response);
                                responseOutputBlock.value = response;
                            }
                            catch (error) {
                                responseOutputBlock.value = "";
                                errorMessage = 'The HTTP ' + request.outputBlock.httpMethod.toUpperCase() + ' request failed. <br><br>Error code: ' + error.code;
                            }
                            finally { }
                            break;
                        }
                        case 'run': {
                            try {
                                responseOutputBlock.value = (0, child_process_1.execSync)(request.outputBlock.value, { cwd: os.homedir(), timeout: request.outputBlock.timeout || config_1.Config.DEFAULT_COMPONENT_TIMEOUT }).toString();
                            }
                            catch (error) {
                                responseOutputBlock.value = "";
                                let output = error.output.toString().substr(2);
                                errorMessage = 'The RUN command failed.<br>';
                                if (output.length) {
                                    responseOutputBlock.value = output;
                                    errorMessage += '<br>Output: ' + output;
                                }
                                else {
                                    errorMessage += '<br>Output: null';
                                }
                                errorMessage += '<br>Exit status: ' + error.status;
                            }
                            break;
                        }
                        case 'csv_lookup': {
                            // Try to open the file
                            let fileContent;
                            try {
                                fileContent = fs.readFileSync(request.outputBlock.csvFile).toString().replace(/^\ufeff/, '');
                            }
                            catch (error) {
                                errorMessage = 'The CSV_LOOKUP component failed to access ' + request.outputBlock.csvFile + '<br>Make you sure the path is correct and that the server has the read permissions.<br><br>Error code: ' + error.code; // ENOENT
                                break;
                            }
                            // Try to find the columns
                            try {
                                const records = parse(fileContent, { columns: false, ltrim: true, rtrim: true, delimiter: request.outputBlock.delimiter });
                                const resultRow = records.find(x => x[request.outputBlock.searchColumn - 1] == request.outputBlock.value);
                                responseOutputBlock.value = resultRow[request.outputBlock.resultColumn - 1];
                            }
                            catch (error) {
                                responseOutputBlock.value = request.outputBlock.notFoundValue;
                                break;
                            }
                            break;
                        }
                        case 'google_sheets': {
                            let result = null;
                            if (request.outputBlock.action === 'get') {
                                result = yield this.gsheet.get(request.outputBlock.sheetId, request.outputBlock.workSheetIndex, request.outputBlock.searchColumnA1, request.outputBlock.value, request.outputBlock.columnToReadA1, request.outputBlock.rowToUpdate);
                            }
                            else if (request.outputBlock.action === 'update') {
                                result = yield this.gsheet.update(request.outputBlock.sheetId, request.outputBlock.workSheetIndex, request.outputBlock.searchColumnA1, request.outputBlock.value, request.outputBlock.columnToUpdateA1, request.outputBlock.newValue, request.outputBlock.rowToUpdate, request.outputBlock.appendIfNotFound);
                            }
                            else if (request.outputBlock.action === 'append') {
                                result = yield this.gsheet.append(request.outputBlock.sheetId, request.outputBlock.workSheetIndex, request.outputBlock.columnsToAppend);
                            }
                            if (result !== null) {
                                responseOutputBlock.value = result;
                            }
                            else {
                                responseOutputBlock.value = request.outputBlock.notFoundValue;
                            }
                            break;
                        }
                        case 'csv_update': {
                            // Try to open the file
                            let fileContent;
                            try {
                                fileContent = fs.readFileSync(request.outputBlock.csvFile).toString().replace(/^\ufeff/, '');
                            }
                            catch (error) {
                                errorMessage = 'The CSV_UPDATE component failed to access ' + request.outputBlock.csvFile + '<br>Make you sure the path is correct and that the server has the read permissions.<br><br>Error code: ' + error.code; // ENOENT
                                break;
                            }
                            // Try to find the columns
                            try {
                                const records = parse(fileContent, { columns: false, ltrim: true, rtrim: true, delimiter: request.outputBlock.delimiter });
                                let output = request.outputBlock.notFoundValue;
                                // Replace the values
                                let result;
                                switch (request.outputBlock.rowToUpdate) {
                                    case 'all':
                                        result = records.map(row => {
                                            if (row[request.outputBlock.searchColumn - 1] == request.outputBlock.value) {
                                                row[request.outputBlock.columnToUpdate - 1] = request.outputBlock.newValue;
                                                output = request.outputBlock.newValue;
                                            }
                                            return row;
                                        });
                                        break;
                                    case 'first':
                                        const firstIndex = records.findIndex(x => x[request.outputBlock.searchColumn - 1] == request.outputBlock.value);
                                        console.log('First index: ', firstIndex);
                                        if (firstIndex != -1) {
                                            console.log('row: ', records[firstIndex]);
                                            records[firstIndex][request.outputBlock.columnToUpdate - 1] = request.outputBlock.newValue;
                                            output = request.outputBlock.newValue;
                                        }
                                        result = records;
                                        break;
                                    case 'last':
                                        const lastIndex = ScansHandler.findLastIndex(records, x => x[request.outputBlock.searchColumn - 1] == request.outputBlock.value);
                                        if (lastIndex != -1) {
                                            records[lastIndex][request.outputBlock.columnToUpdate - 1] = request.outputBlock.newValue;
                                            output = request.outputBlock.newValue;
                                        }
                                        result = records;
                                        break;
                                }
                                // Write the file synchronously
                                yield new Promise((resolve) => {
                                    stringify(result, { delimiter: request.outputBlock.delimiter }, (err, output) => {
                                        fs.writeFileSync(request.outputBlock.csvFile, output);
                                        resolve();
                                    });
                                });
                                responseOutputBlock.value = output;
                            }
                            catch (error) {
                                responseOutputBlock.value = request.outputBlock.notFoundValue;
                                break;
                            }
                            break;
                        }
                    } // end switch(outputBlock.type)
                    remoteComponentResponse.fromObject({
                        id: request.id,
                        errorMessage: errorMessage,
                        outputBlock: responseOutputBlock,
                    });
                    ws.send(JSON.stringify(remoteComponentResponse));
                    break;
                } // end ACTION_REMOTE_COMPONENT
            } // end switch(message.action)
            return message;
        });
    }
    keyTap(key, modifiers) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.settingsHandler.enableRealtimeStrokes || !key) {
                return;
            }
            yield keyboard.pressKey(...modifiers, key);
            yield keyboard.releaseKey(...modifiers, key);
        });
    }
    typeString(string) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.settingsHandler.enableRealtimeStrokes || !string) {
                return;
            }
            if (this.settingsHandler.typeMethod == 'keyboard') {
                keyboard.config.autoDelayMs = this.settingsHandler.autoDelayMs;
                yield keyboard.type(string);
            }
            else if (this.settingsHandler.typeMethod == 'clipboard') {
                electron_1.clipboard.writeText(string);
                if (process.platform === "darwin") {
                    yield keyboard.pressKey(Key.LeftSuper, Key.V);
                    yield keyboard.releaseKey(Key.LeftSuper, Key.V);
                }
                else {
                    yield keyboard.pressKey(Key.LeftControl, Key.V);
                    yield keyboard.releaseKey(Key.LeftControl, Key.V);
                }
            }
            else if (this.settingsHandler.typeMethod == 'clipboardCopy') {
                electron_1.clipboard.writeText(string);
            }
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
    }
    /**
     * Returns the index of the last element in the array where predicate is true, and -1
     * otherwise.
     * @param array The source array to search in
     * @param predicate find calls predicate once for each element of the array, in descending
     * order, until it finds one where predicate returns true. If such an element is found,
     * findLastIndex immediately returns that element index. Otherwise, findLastIndex returns -1.
     *
     * https://stackoverflow.com/questions/40929260/find-last-index-of-element-inside-array-by-certain-condition
     */
    static findLastIndex(array, predicate) {
        let l = array.length;
        while (l--) {
            if (predicate(array[l], l, array))
                return l;
        }
        return -1;
    }
    static updateFirstMatch(jsonExistingData, jsonNewRow, headers2ComponentsIndexMap, hederIndex, keyComponentIndex) {
        console.log(jsonExistingData, jsonNewRow, headers2ComponentsIndexMap, hederIndex, keyComponentIndex);
        for (let i = 1; i < jsonExistingData.length; i++) {
            const row = jsonExistingData[i];
            if (row[hederIndex] == jsonNewRow[keyComponentIndex]) {
                console.log(`Found match in row ${i}, overriding the matching columns now...`);
                console.log('Row= ', row);
                console.log('NewRow= ', jsonNewRow);
                for (let colIndex = 0; colIndex < jsonNewRow.length; colIndex++) {
                    if (colIndex == keyComponentIndex)
                        continue;
                    const newCellValue = jsonNewRow[colIndex];
                    if (newCellValue !== null)
                        row[colIndex] = newCellValue;
                }
                return true;
            }
        }
        return false;
    }
}
exports.ScansHandler = ScansHandler;
//# sourceMappingURL=scans.handler.js.map