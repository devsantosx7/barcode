"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestModelRemoteComponent = exports.requestModelUndoInfiniteLoop = exports.requestModelOnSmartphoneCharge = exports.requestModelClearScanSessions = exports.requestModelUpdateScanSession = exports.requestModelDeleteScan = exports.requestModelDeleteScanSessions = exports.requestModelPutScanSessions = exports.requestModelEmailIncentiveCompleted = exports.requestModelHelo = exports.requestModelPing = exports.requestModelGetVersion = exports.requestModel = void 0;
class requestModel {
}
exports.requestModel = requestModel;
requestModel.ACTION_GET_VERSION = 'getVersion';
requestModel.ACTION_PING = 'ping';
requestModel.ACTION_HELO = 'helo';
requestModel.ACTION_PUT_SCAN_SESSIONS = 'putScanSessions';
requestModel.ACTION_DELETE_SCAN_SESSION = 'deleteScanSession';
requestModel.ACTION_DELETE_SCAN = 'deleteScan';
requestModel.ACTION_UPDATE_SCAN_SESSION = 'updateScanSession';
requestModel.ACTION_CLEAR_SCAN_SESSIONS = 'clearScanSessions';
requestModel.ACTION_ON_SMARTPHONE_CHARGE = 'action_on_smartphone_charge';
requestModel.ACTION_UNDO_INFINITE_LOOP = 'undo_infinite_loop';
requestModel.ACTION_REMOTE_COMPONENT = 'remoteComponent';
requestModel.ACTION_EMAIL_INCENTIVE_COMPLETED = 'action_email_incentive_completed';
/**
 * @deprecated
 */
class requestModelGetVersion extends requestModel {
    constructor() {
        super(...arguments);
        this.action = requestModel.ACTION_GET_VERSION;
    }
    fromObject(obj) {
        return this;
    }
}
exports.requestModelGetVersion = requestModelGetVersion;
class requestModelPing extends requestModel {
    constructor() {
        super(...arguments);
        this.action = requestModel.ACTION_PING;
    }
    fromObject(obj) {
        return this;
    }
}
exports.requestModelPing = requestModelPing;
class requestModelHelo extends requestModel {
    constructor() {
        super(...arguments);
        this.action = requestModel.ACTION_HELO;
    }
    fromObject(obj) {
        this.version = obj.version;
        this.deviceName = obj.deviceName;
        this.deviceId = obj.deviceId;
        return this;
    }
}
exports.requestModelHelo = requestModelHelo;
class requestModelEmailIncentiveCompleted extends requestModel {
    constructor() {
        super(...arguments);
        this.action = requestModel.ACTION_EMAIL_INCENTIVE_COMPLETED;
    }
    fromObject(obj) {
        this.email = obj.email;
        this.name = obj.name;
        return this;
    }
}
exports.requestModelEmailIncentiveCompleted = requestModelEmailIncentiveCompleted;
class requestModelPutScanSessions extends requestModel {
    constructor() {
        super(...arguments);
        this.action = requestModel.ACTION_PUT_SCAN_SESSIONS;
    }
    fromObject(obj) {
        this.scanSessions = obj.scanSessions;
        this.sendKeystrokes = obj.sendKeystrokes;
        this.deviceId = obj.deviceId;
        return this;
    }
}
exports.requestModelPutScanSessions = requestModelPutScanSessions;
class requestModelDeleteScanSessions extends requestModel {
    constructor() {
        super(...arguments);
        this.action = requestModel.ACTION_DELETE_SCAN_SESSION;
    }
    fromObject(obj) {
        this.scanSessionIds = obj.scanSessionIds;
        return this;
    }
}
exports.requestModelDeleteScanSessions = requestModelDeleteScanSessions;
class requestModelDeleteScan extends requestModel {
    constructor() {
        super(...arguments);
        this.action = requestModel.ACTION_DELETE_SCAN;
    }
    fromObject(obj) {
        this.scan = obj.scan;
        this.scanSessionId = obj.scanSessionId;
        return this;
    }
}
exports.requestModelDeleteScan = requestModelDeleteScan;
class requestModelUpdateScanSession extends requestModel {
    constructor() {
        super(...arguments);
        this.action = requestModel.ACTION_UPDATE_SCAN_SESSION;
    }
    fromObject(obj) {
        this.scanSessionId = obj.scanSessionId;
        this.scanSessionName = obj.scanSessionName;
        this.scanSessionDate = obj.scanSessionDate;
        return this;
    }
}
exports.requestModelUpdateScanSession = requestModelUpdateScanSession;
class requestModelClearScanSessions extends requestModel {
    constructor() {
        super(...arguments);
        this.action = requestModel.ACTION_CLEAR_SCAN_SESSIONS;
    }
    fromObject(obj) {
        return this;
    }
}
exports.requestModelClearScanSessions = requestModelClearScanSessions;
class requestModelOnSmartphoneCharge extends requestModel {
    constructor() {
        super(...arguments);
        this.action = requestModel.ACTION_ON_SMARTPHONE_CHARGE;
    }
    fromObject(obj) {
        return this;
    }
}
exports.requestModelOnSmartphoneCharge = requestModelOnSmartphoneCharge;
class requestModelUndoInfiniteLoop extends requestModel {
    constructor() {
        super(...arguments);
        this.action = requestModel.ACTION_UNDO_INFINITE_LOOP;
    }
    fromObject(obj) {
        this.count = obj.count;
        return this;
    }
}
exports.requestModelUndoInfiniteLoop = requestModelUndoInfiniteLoop;
class requestModelRemoteComponent extends requestModel {
    constructor() {
        super(...arguments);
        this.action = requestModel.ACTION_REMOTE_COMPONENT;
    }
    fromObject(obj) {
        this.id = obj.id;
        this.outputBlock = obj.outputBlock;
        return this;
    }
}
exports.requestModelRemoteComponent = requestModelRemoteComponent;
//# sourceMappingURL=request.model.js.map