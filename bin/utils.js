"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
class Utils {
    static IsDev() {
        return process.argv.slice(1).some(val => val === '--dev');
    }
}
exports.Utils = Utils;
//# sourceMappingURL=utils.js.map