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
exports.GSheetHandler = void 0;
const google_auth_library_1 = require("google-auth-library");
const google_spreadsheet_1 = require("google-spreadsheet");
const googleapis_1 = require("googleapis");
const http = require("http");
const Url = require("url");
const config_1 = require("../config");
const electron_1 = require("electron");
class GSheetHandler {
    constructor() {
        electron_1.ipcMain.on('gsheet_refresh_data', (event, args) => __awaiter(this, void 0, void 0, function* () {
            const data = args[0];
            const oAuth2Client = yield this.getAuthenticatedClient(data.tokens);
            try {
                const drive = googleapis_1.google.drive({ version: 'v3', auth: oAuth2Client });
                const res = yield drive.files.list({ q: "mimeType='application/vnd.google-apps.spreadsheet'", fields: 'nextPageToken, files(id, name)' });
                if (res.data.files) {
                    this.ipcClient.send('gsheet_refresh_data', { tokens: oAuth2Client.credentials, spreadSheets: res.data.files });
                }
            }
            catch (e) {
                this.showErrorNativeDialog('gsheetErrorFailedToGetList', { email: config_1.Config.EMAIL_SUPPORT });
            }
        }));
        electron_1.ipcMain.on('gsheet_refresh_tokens', (event, args) => __awaiter(this, void 0, void 0, function* () {
            const savedTokens = args[0];
            if (!savedTokens || !savedTokens.refresh_token)
                return;
            const oAuth2Client = new google_auth_library_1.OAuth2Client(config_1.Config.GAPIS_CREDENTIALS.client_id, config_1.Config.GAPIS_CREDENTIALS.client_secret, config_1.Config.GAPIS_CREDENTIALS.redirect_uri);
            oAuth2Client.setCredentials(savedTokens);
            oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: GSheetHandler.scopes });
            const tokenResponse = yield oAuth2Client.refreshAccessToken();
            this.ipcClient.send('gsheet_refresh_tokens', tokenResponse.credentials);
        }));
    }
    get(sheetId, workSheetIndex, searchColumnA1, searchValue, columnToReadA1, matchCriteria = 'first') {
        return __awaiter(this, void 0, void 0, function* () {
            const workSheet = yield this.getWorkSheet(sheetId, workSheetIndex);
            const rows = yield workSheet.getRows();
            const lookupColumnIndex = searchColumnA1.toUpperCase().charCodeAt(0) - 65;
            const replaceColumnIndex = columnToReadA1.toUpperCase().charCodeAt(0) - 65;
            // Find and read the correspondig cell
            for (let i = 0; i < rows.length; i++) {
                const index = matchCriteria === 'last' ? rows.length - 1 - i : i;
                const row = rows[index];
                if (row._rawData[lookupColumnIndex] == searchValue) {
                    return row._rawData[replaceColumnIndex];
                }
            }
            return null;
        });
    }
    update(sheetId, workSheetIndex, searchColumnA1, searchValue, columnToUpdateA1, newValue, matchCriteria = 'first', appendIfNotFound) {
        return __awaiter(this, void 0, void 0, function* () {
            const workSheet = yield this.getWorkSheet(sheetId, workSheetIndex);
            const rows = yield workSheet.getRows();
            const lookupColumnIndex = searchColumnA1.toUpperCase().charCodeAt(0) - 65;
            const replaceColumnIndex = columnToUpdateA1.toUpperCase().charCodeAt(0) - 65;
            let needleFound = false;
            // Find and update the values row by row
            for (let i = 0; i < rows.length; i++) {
                const index = matchCriteria === 'last' ? rows.length - 1 - i : i;
                const row = rows[index];
                if (row._rawData[lookupColumnIndex] === searchValue) {
                    row._rawData[replaceColumnIndex] = newValue;
                    yield row.save();
                    needleFound = true;
                    // If its the first or last match, exit
                    if (matchCriteria !== 'all')
                        return newValue;
                }
            }
            return needleFound ? newValue : null;
        });
    }
    append(sheetId, workSheetIndex, columnsToAppend) {
        return __awaiter(this, void 0, void 0, function* () {
            const workSheet = yield this.getWorkSheet(sheetId, workSheetIndex);
            yield workSheet.addRow(columnsToAppend);
            yield workSheet.saveUpdatedCells();
            return true;
        });
    }
    getWorkSheet(sheetId, workSheetIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            const savedTokens = yield this.getSavedTokens();
            const spreadSheet = new google_spreadsheet_1.GoogleSpreadsheet(sheetId);
            spreadSheet.useOAuth2Client(yield this.getAuthenticatedClient(savedTokens));
            yield spreadSheet.loadInfo();
            const workSheet = spreadSheet.sheetsByIndex[workSheetIndex];
            yield workSheet.loadCells();
            return workSheet;
        });
    }
    getSavedTokens() {
        return new Promise(resolve => {
            electron_1.ipcMain.on('gsheet_get_saved_tokens', (event, args) => __awaiter(this, void 0, void 0, function* () {
                electron_1.ipcMain.removeAllListeners('gsheet_get_saved_tokens');
                resolve(args[0]);
            }));
            this.ipcClient.send('gsheet_get_saved_tokens');
        });
    }
    showErrorNativeDialog(translateStringId, interpolateParams) {
        this.ipcClient.send('showErrorNativeDialog', translateStringId, interpolateParams);
    }
    getAuthenticatedClient(savedTokens) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const oAuth2Client = new google_auth_library_1.OAuth2Client(config_1.Config.GAPIS_CREDENTIALS.client_id, config_1.Config.GAPIS_CREDENTIALS.client_secret, config_1.Config.GAPIS_CREDENTIALS.redirect_uri);
            if (savedTokens) {
                oAuth2Client.setCredentials(savedTokens);
                // Make a call to google to see if the token is valid
                try {
                    const drive = googleapis_1.google.drive({ version: 'v3', auth: oAuth2Client });
                    const res = yield drive.files.list({ q: "mimeType='application/vnd.google-apps.spreadsheet'", fields: 'nextPageToken, files(id, name)' });
                    if (res.status !== 401) {
                        // Resolve & Exit
                        resolve(oAuth2Client);
                        return;
                    }
                }
                catch (e) {
                    console.log('GSHEETS: Cannot login with the current token, opening consent dialog...', e);
                    this.showErrorNativeDialog('cannotAccessSpreadsheetError');
                    // If instead an errow is thrown, or the status is 401, the flow will go down and authenticate again
                }
            }
            // Generate the url that will be used for the consent dialog and put the scope as sheets
            // The refres_token is retreived only the first time the app is approved. To force it use `prompt: 'consent'`
            // If the user has approved the app on multiple computer, the second computer won't receive the refres_token (I guess).
            // So, force the promp here:
            const authorizeUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: GSheetHandler.scopes, });
            // Open an http server to accept the oauth callback. In this simple example, the
            // only request to our webserver is to /oauth2callback?code=<code>
            if (GSheetHandler.httpAuthServer && GSheetHandler.httpAuthServer.listening) {
                GSheetHandler.httpAuthServer.close();
            }
            const onGetToken = (token) => __awaiter(this, void 0, void 0, function* () {
                const tokenResponse = yield oAuth2Client.getToken(token);
                oAuth2Client.setCredentials(tokenResponse.tokens);
                this.ipcClient.send('gsheet_refresh_tokens', tokenResponse.tokens); // Save this token to login again
                resolve(oAuth2Client);
            });
            // The oauth token can be obtained either from btplink://
            electron_1.ipcMain.on('oauth_token', (event, args) => __awaiter(this, void 0, void 0, function* () {
                const token = args[0];
                onGetToken(token);
            }));
            // Or from a request to http://localhost:OAUTH_HTTP_PORT/oauth
            GSheetHandler.httpAuthServer = http.createServer((req, res) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const searchParams = new Url.URL(req.url, `http://localhost:${config_1.Config.OAUTH_HTTP_PORT}`).searchParams;
                    if (req.url.indexOf('/oauth') > -1) {
                        const token = searchParams.get('code');
                        if (token) {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.end(`Ok`);
                            GSheetHandler.httpAuthServer.close();
                            onGetToken(token);
                            return;
                        }
                    }
                    const error = searchParams.get('error');
                    res.end('Error: ' + error + '\n\nIf persists please contact ' + config_1.Config.EMAIL_SUPPORT);
                    GSheetHandler.httpAuthServer.close();
                    reject();
                }
                catch (e) {
                    res.end('Error: ' + e + '\n\nIf persists please contact ' + config_1.Config.EMAIL_SUPPORT);
                    GSheetHandler.httpAuthServer.close();
                    reject(e);
                }
            }));
            try {
                GSheetHandler.httpAuthServer.listen(config_1.Config.OAUTH_HTTP_PORT, () => { });
            }
            catch (_a) { }
            electron_1.shell.openExternal(authorizeUrl);
        }));
    }
    onWsMessage(ws, message, req) {
        throw new Error('Method not implemented.');
    }
    onWsClose(ws) {
        throw new Error('Method not implemented.');
    }
    onWsError(ws, err) {
        throw new Error('Method not implemented.');
    }
    setIpcClient(ipcClient) {
        this.ipcClient = ipcClient;
    }
    static getInstance() {
        if (!GSheetHandler.instance) {
            GSheetHandler.instance = new GSheetHandler();
        }
        return GSheetHandler.instance;
    }
}
exports.GSheetHandler = GSheetHandler;
GSheetHandler.scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.metadata.readonly'];
//# sourceMappingURL=gsheet.handler.js.map