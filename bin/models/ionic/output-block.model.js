"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputBlockModel = void 0;
/**
 * It's an element of the Output template field.
 * It's also called Output component in the UI
 */
class OutputBlockModel {
    static FindEndIfIndex(outputBlocks, startFrom = 0) {
        let skip = 0;
        for (let i = startFrom; i < outputBlocks.length; i++) {
            if (outputBlocks[i].type == 'if') {
                skip++;
            }
            else if (outputBlocks[i].type == 'endif') {
                if (skip == 0) {
                    return i;
                }
                else {
                    skip--;
                }
            }
        }
        return -1;
    }
}
exports.OutputBlockModel = OutputBlockModel;
//# sourceMappingURL=output-block.model.js.map