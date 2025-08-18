"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseModelUnkick = exports.responseModelRemoteComponentResponse = exports.responseModelKick = exports.responseModelUpdateSettings = exports.responseModelEnableQuantity = exports.responseModelShowEmailIncentiveAlert = exports.responseModelPopup = exports.responseModelPutScanAck = exports.responseModelPong = exports.responseModelHelo = exports.responseModelGetVersion = exports.responseModel = void 0;
/**
 * When editing this file rember to reflect the same changes to
 * response.model.ts present on the server side.
 */
class responseModel {
}
exports.responseModel = responseModel;
responseModel.ACTION_GET_VERSION = 'getVersion';
responseModel.ACTION_HELO = 'helo';
responseModel.ACTION_PONG = 'pong';
responseModel.ACTION_PUT_SCAN_ACK = 'putScanAck';
responseModel.ACTION_POPUP = 'action_popup';
responseModel.ACTION_ENABLE_QUANTITY = 'enableQuantity';
responseModel.ACTION_UPDATE_SETTINGS = 'update_output_profiles';
responseModel.ACTION_REQUEST_SCAN_SESSION_UPDATE = 'requestScanSessionUpdate';
responseModel.ACTION_KICK = 'kick';
responseModel.ACTION_REMOTE_COMPONENT_RESPONSE = 'remoteComponentResponse';
responseModel.EVENT_ON_SMARTPHONE_CHARGE = 'on_smartphone_charge';
responseModel.ACTION_SHOW_EMAIL_INCENTIVE_ALERT = 'action_show_email_incentive_alert';
responseModel.ACTION_UNKICK = 'unkick';
/**
 * @deprecated
 */
class responseModelGetVersion extends responseModel {
    constructor() {
        super(...arguments);
        this.action = responseModel.ACTION_GET_VERSION;
    }
    fromObject(obj) {
        this.version = obj.version;
        return this;
    }
}
exports.responseModelGetVersion = responseModelGetVersion;
class responseModelHelo extends responseModel {
    constructor() {
        super(...arguments);
        this.action = responseModel.ACTION_HELO;
    }
    fromObject(obj) {
        this.outputProfiles = obj.outputProfiles;
        if (obj.events) {
            this.events = obj.events;
        }
        else {
            this.events = [];
        }
        this.savedGeoLocations = obj.savedGeoLocations || [];
        this.version = obj.version;
        this.outputProfiles = obj.outputProfiles;
        this.quantityEnabled = obj.quantityEnabled;
        this.serverUUID = obj.serverUUID;
        return this;
    }
}
exports.responseModelHelo = responseModelHelo;
class responseModelPong extends responseModel {
    constructor() {
        super(...arguments);
        this.action = responseModel.ACTION_PONG;
    }
    fromObject(obj) {
        return this;
    }
}
exports.responseModelPong = responseModelPong;
class responseModelPutScanAck extends responseModel {
    constructor() {
        super(...arguments);
        this.action = responseModel.ACTION_PUT_SCAN_ACK;
    }
    fromObject(obj) {
        this.scanSessionId = obj.scanSessionId;
        this.scanId = obj.scanId;
        this.outputBlocks = obj.outputBlocks;
        this.serverUUID = obj.serverUUID;
        return this;
    }
}
exports.responseModelPutScanAck = responseModelPutScanAck;
class responseModelPopup extends responseModel {
    constructor() {
        super(...arguments);
        this.action = responseModel.ACTION_POPUP;
    }
    fromObject(obj) {
        this.title = obj.title;
        this.message = obj.message;
        return this;
    }
}
exports.responseModelPopup = responseModelPopup;
class responseModelShowEmailIncentiveAlert extends responseModel {
    constructor() {
        super(...arguments);
        this.action = responseModel.ACTION_SHOW_EMAIL_INCENTIVE_ALERT;
    }
    fromObject(obj) {
        return this;
    }
}
exports.responseModelShowEmailIncentiveAlert = responseModelShowEmailIncentiveAlert;
/**
 * @deprecated For backwards compatibility only, use OutputProfiles instead
 */
class responseModelEnableQuantity extends responseModel {
    constructor() {
        super(...arguments);
        this.action = responseModel.ACTION_ENABLE_QUANTITY;
    }
    fromObject(obj) {
        this.enable = obj.enable;
        return this;
    }
}
exports.responseModelEnableQuantity = responseModelEnableQuantity;
class responseModelUpdateSettings extends responseModel {
    constructor() {
        super(...arguments);
        this.action = responseModel.ACTION_UPDATE_SETTINGS;
    }
    fromObject(obj) {
        this.outputProfiles = obj.outputProfiles;
        if (obj.events) {
            this.events = obj.events;
        }
        else {
            this.events = [];
        }
        this.savedGeoLocations = obj.savedGeoLocations || [];
        return this;
    }
}
exports.responseModelUpdateSettings = responseModelUpdateSettings;
class responseModelKick extends responseModel {
    constructor() {
        super(...arguments);
        this.action = responseModel.ACTION_KICK;
        this.message = '';
    }
    fromObject(obj) {
        this.message = obj.message;
        return this;
    }
}
exports.responseModelKick = responseModelKick;
class responseModelRemoteComponentResponse extends responseModel {
    constructor() {
        super(...arguments);
        this.action = responseModel.ACTION_REMOTE_COMPONENT_RESPONSE;
    }
    fromObject(obj) {
        this.id = obj.id;
        this.errorMessage = obj.errorMessage;
        this.outputBlock = obj.outputBlock;
        return this;
    }
}
exports.responseModelRemoteComponentResponse = responseModelRemoteComponentResponse;
class responseModelUnkick {
    constructor() {
        this.action = responseModel.ACTION_UNKICK;
    }
    fromObject() {
        return this;
    }
}
exports.responseModelUnkick = responseModelUnkick;
//# sourceMappingURL=response.model.js.map