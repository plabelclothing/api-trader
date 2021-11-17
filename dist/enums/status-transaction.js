"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StatusTransaction;
(function (StatusTransaction) {
    StatusTransaction["OPEN"] = "open";
    StatusTransaction["DONE"] = "done";
    StatusTransaction["REJECTED"] = "rejected";
})(StatusTransaction = exports.StatusTransaction || (exports.StatusTransaction = {}));
var DoneReasonTransaction;
(function (DoneReasonTransaction) {
    DoneReasonTransaction["CANCELED"] = "canceled";
    DoneReasonTransaction["FILLED"] = "filled";
})(DoneReasonTransaction = exports.DoneReasonTransaction || (exports.DoneReasonTransaction = {}));
