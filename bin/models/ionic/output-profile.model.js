"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputProfileModel = void 0;
/**
 * It's a set of OutputBlocks, also called "Ouput template" in the UI
 */
class OutputProfileModel {
    constructor() {
        this.outputBlocks = [];
    }
    /**
     * @returns TRUE when the outputProfile contains components such as NUMBER or TEXT
     */
    static ContainsDialogComponents(outputProfile) {
        return outputProfile.outputBlocks.findIndex(x => x.value == 'number' || x.value == 'text' ||
            /**
             * @deprecated for update transition only
             */
            x.value == 'quantity') != -1;
    }
    /**
     * @returns TRUE when there is a block that requires the interaction with the UI
     */
    static ContainsBlockingComponents(outputProfile) {
        return outputProfile.outputBlocks.findIndex(x => x.value == 'number' || x.value == 'text' || x.type == 'select_option' || x.type == 'image' ||
            x.type == 'http' || x.type == 'run' || x.type == 'csv_lookup' || x.type == 'csv_update' ||
            x.type == 'alert' ||
            /**
             * @deprecated for update transition only
             */
            x.value == 'quantity') != -1;
    }
    /**
     * @returns TRUE when there is at least one components component that has a
     * different enabledFormats field from the other BARCODE components.
     */
    // static ContainsMixedBarcodeFormats(outputProfile: OutputProfileModel): boolean {
    //   for (let i = 0; i < outputProfile.outputBlocks.length; i++) {
    //     let block1 = outputProfile.outputBlocks[i];
    //     if (block1.type == 'barcode') {
    //       for (let j = i + 1; j < outputProfile.outputBlocks.length; j++) {
    //         let block2 = outputProfile.outputBlocks[j];
    //         if (block2.type == 'barcode' && JSON.stringify(block2.enabledFormats) != JSON.stringify(block1.enabledFormats)) {
    //           return true;
    //         }
    //       }
    //     }
    //   }
    //   return false;
    // }
    /**
     * @returns TRUE when there is at least two BARCODE components.
     */
    static ContainsMultipleBarcodeFormats(outputProfile) {
        let count = 0;
        for (let i = 0; i < outputProfile.outputBlocks.length; i++) {
            if (outputProfile.outputBlocks[i].type == 'barcode') {
                count++;
            }
            if (count >= 2) {
                return true;
            }
        }
        return false;
    }
}
exports.OutputProfileModel = OutputProfileModel;
//# sourceMappingURL=output-profile.model.js.map