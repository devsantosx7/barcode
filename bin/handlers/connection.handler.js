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
exports.ConnectionHandler = void 0;
const electron_1 = require("electron");
const os = require("os");
const ciao = require("@homebridge/ciao");
const request_model_1 = require("../models/ionic/request.model");
const response_model_1 = require("../models/ionic/response.model");
const config_1 = require("../config");
class ConnectionHandler {
    constructor(uiHandler, settingsHandler) {
        this.uiHandler = uiHandler;
        this.settingsHandler = settingsHandler;
        this.wsClients = {};
        this.uiHandler = uiHandler;
        electron_1.ipcMain
            .on("getLocalAddresses", (event, arg) => {
            const addresses = this.getSortedPrivateIps();
            event.sender.send("localAddresses", addresses);
        })
            .on("getHostname", (event, arg) => {
            event.sender.send("hostname", os.hostname());
        })
            .on(response_model_1.responseModel.ACTION_KICK, (event, data) => {
            const device = data[0].device;
            const response = data[0].response;
            if (device.deviceId in this.wsClients) {
                this.wsClients[device.deviceId].send(JSON.stringify(response));
            }
        })
            .on(response_model_1.responseModel.ACTION_UNKICK, (event, data) => {
            const device = data[0].device;
            const response = data[0].response;
            console.log("@Unkick", device);
            if (device.deviceId in this.wsClients) {
                this.wsClients[device.deviceId].send(JSON.stringify(response));
            }
        });
        // Send the new settings to the already connected clients
        // The settings are also sent in the HELO request.
        settingsHandler.onSettingsChanged.subscribe((settings) => {
            for (let deviceId in this.wsClients) {
                let ws = this.wsClients[deviceId];
                ws.send(JSON.stringify(new response_model_1.responseModelUpdateSettings().fromObject({
                    outputProfiles: this.settingsHandler.outputProfiles,
                    events: this.getEnabledEvents(),
                    savedGeoLocations: this.settingsHandler.savedGeoLocations,
                })));
            }
        });
        electron_1.ipcMain.on("ipc_show_incentive_email_alert", (event, args) => {
            // Show email incentive alert in all connected devices
            for (let deviceId in this.wsClients) {
                let ws = this.wsClients[deviceId];
                const response2 = new response_model_1.responseModelShowEmailIncentiveAlert().fromObject({});
                ws.send(JSON.stringify(response2));
            }
        });
    }
    /**
     * Generates an array of enabled events basend on the server settings, like this:
     * ['on_smartphone_charge', 'on_scansession_archieved']
     */
    getEnabledEvents() {
        let enabledEvents = [];
        if (this.settingsHandler.onSmartphoneChargeCommand) {
            enabledEvents.push(response_model_1.responseModel.EVENT_ON_SMARTPHONE_CHARGE);
        }
        return enabledEvents;
    }
    static getInstance(uiHandler, settingsHandler) {
        if (!ConnectionHandler.instance) {
            ConnectionHandler.instance = new ConnectionHandler(uiHandler, settingsHandler);
        }
        return ConnectionHandler.instance;
    }
    announceServer() {
        const onFail = (err) => {
            console.log("Ciao error:", err);
            let message = "An unknown error occurred. Automatic pairing may not work, scan the QR code to pair the app instead. Please report this issue at support@barcodetopc.com. ";
            if (process.platform !== "win32" && process.platform !== "darwin") {
                message +=
                    "To remove this alert please try to install these packages: avahi-daemon avahi-discover libnss-mdns libavahi-compat-libdnssd1";
            }
            electron_1.dialog.showMessageBox(this.uiHandler.mainWindow, {
                type: "error",
                title: "Error",
                buttons: ["Ok"],
                message,
            });
        };
        try {
            const safeInterfaces = this.getSortedPrivateIps().filter(ip => typeof ip === 'string' && ip.length > 0);
            const responder = ciao.getResponder({ interface: safeInterfaces, disableIpv6: true });
            const serviceOptions = {
                name: config_1.Config.APP_NAME,
                type: "http",
                port: config_1.Config.PORT,
                hostname: os.hostname(),
            };
            console.log("Announcing server:", JSON.stringify(serviceOptions));
            this.ciaoService = responder.createService(serviceOptions);
            this.ciaoService.advertise().then(() => {
                console.log("Server announced");
            }).catch((err) => {
                onFail(err);
            });
        }
        catch (err) {
            onFail(err);
        }
    }
    removeServerAnnounce() {
        if (this.ciaoService) {
            this.ciaoService.end().then(() => {
                console.log("Server announcement stopped");
            });
        }
    }
    onWsMessage(ws, message, req) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (message.action) {
                case request_model_1.requestModel.ACTION_PING: {
                    ws.send(JSON.stringify(new response_model_1.responseModelPong()));
                    break;
                }
                case request_model_1.requestModel.ACTION_HELO: {
                    let request = message;
                    let response = new response_model_1.responseModelHelo();
                    response.fromObject({
                        version: electron_1.app.getVersion(),
                        outputProfiles: this.settingsHandler.outputProfiles,
                        events: this.getEnabledEvents(),
                        /**
                         * @deprecated
                         */
                        quantityEnabled: false,
                        serverUUID: this.settingsHandler.getServerUUID(),
                        savedGeoLocations: this.settingsHandler.savedGeoLocations,
                    });
                    if (request && request.deviceId) {
                        this.wsClients[request.deviceId] = ws;
                    }
                    ws.send(JSON.stringify(response));
                    break;
                }
                case request_model_1.requestModel.ACTION_EMAIL_INCENTIVE_COMPLETED: {
                    this.ipcClient.send("incentive_email", message);
                    // Reply back with the same data
                    ws.send(JSON.stringify(new request_model_1.requestModelEmailIncentiveCompleted().fromObject({
                        email: message.email,
                        name: message.name,
                    })));
                    break;
                }
            }
            return message;
        });
    }
    onWsClose(ws) {
        if (this.ipcClient) {
            this.findDeviceIdByWs(ws).then((deviceId) => {
                // console.log('@@@ close', deviceId)
                this.ipcClient.send("wsClose", { deviceId: deviceId });
            });
        }
        this.removeClient(ws);
    }
    onWsError(ws, err) {
        if (this.ipcClient) {
            this.findDeviceIdByWs(ws).then((deviceId) => {
                this.ipcClient.send("wsError", { deviceId: deviceId, err: err });
            });
        }
        this.removeClient(ws);
    }
    setIpcClient(ipcClient) {
        this.ipcClient = ipcClient;
    }
    findDeviceIdByWs(ws) {
        return new Promise((resolve, reject) => {
            Object.keys(this.wsClients).forEach((key) => {
                if (this.wsClients[key] == ws) {
                    resolve(key);
                }
            });
        });
    }
    removeClient(ws) {
        Object.keys(this.wsClients).forEach((key) => {
            delete this.wsClients[key];
        });
    }
    getSortedPrivateIps() {
        const interfaces = os.networkInterfaces();
        const ipList = [];
        // Prioritize Wi-Fi over Ethernet
        const priorityInterfaces = ['wlan0', 'Wi-Fi', 'en0', 'eth0', 'Ethernet'];
        // Collect all non-internal IPv4 addresses
        for (const ifaceName in interfaces) {
            if (interfaces[ifaceName]) {
                for (const iface of interfaces[ifaceName]) {
                    if (iface.family === 'IPv4' && !iface.internal) {
                        ipList.push({ interface: ifaceName, address: iface.address });
                    }
                }
            }
        }
        // Sort so Wi-Fi comes first, then Ethernet, then others
        ipList.sort((a, b) => {
            const aIndex = priorityInterfaces.indexOf(a.interface);
            const bIndex = priorityInterfaces.indexOf(b.interface);
            return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
        });
        return ipList.map(ip => ip.address); // Return only sorted IPs
    }
}
exports.ConnectionHandler = ConnectionHandler;
ConnectionHandler.EVENT_CODE_KICKED_OUT = 4001; // Used when the server kicks out a client
//# sourceMappingURL=connection.handler.js.map