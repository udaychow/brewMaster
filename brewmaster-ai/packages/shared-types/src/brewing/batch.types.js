"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualityResult = exports.QualityCheckType = exports.BatchStatus = void 0;
var BatchStatus;
(function (BatchStatus) {
    BatchStatus["PLANNED"] = "planned";
    BatchStatus["BREWING"] = "brewing";
    BatchStatus["FERMENTING"] = "fermenting";
    BatchStatus["CONDITIONING"] = "conditioning";
    BatchStatus["PACKAGING"] = "packaging";
    BatchStatus["COMPLETED"] = "completed";
    BatchStatus["QUALITY_HOLD"] = "quality_hold";
})(BatchStatus || (exports.BatchStatus = BatchStatus = {}));
var QualityCheckType;
(function (QualityCheckType) {
    QualityCheckType["VISUAL"] = "visual";
    QualityCheckType["TASTE"] = "taste";
    QualityCheckType["AROMA"] = "aroma";
    QualityCheckType["GRAVITY"] = "gravity";
    QualityCheckType["PH"] = "ph";
    QualityCheckType["MICROBIOLOGICAL"] = "microbiological";
})(QualityCheckType || (exports.QualityCheckType = QualityCheckType = {}));
var QualityResult;
(function (QualityResult) {
    QualityResult["PASS"] = "pass";
    QualityResult["FAIL"] = "fail";
    QualityResult["CONDITIONAL"] = "conditional";
})(QualityResult || (exports.QualityResult = QualityResult = {}));
