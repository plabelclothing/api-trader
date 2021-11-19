"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/** Core modules **/
const fs_1 = __importDefault(require("fs"));
/** External modules **/
const bignumber_js_1 = __importDefault(require("bignumber.js"));
/** Locale modules **/
const config_1 = __importDefault(require("../bin/config"));
/**
 * Merge not sold crypto
 * @param price
 * @param amount
 * @param cryptoMinAmount
 * @param typeCrypto
 */
const waitTrxUtil = (price, amount, cryptoMinAmount, typeCrypto) => {
    try {
        let arrForCreateTrx = [];
        const pathToFile = config_1.default.assets.waitTransactionFilePath[typeCrypto];
        /** Read file **/
        const fileContent = fs_1.default.readFileSync(pathToFile).toString();
        let arrTrx = [];
        try {
            arrTrx = JSON.parse(fileContent);
        }
        catch (e) {
            arrTrx = [];
        }
        if (!arrTrx.length) {
            arrTrx.push({
                a: amount,
                p: price,
            });
            fs_1.default.writeFileSync(pathToFile, JSON.stringify(arrTrx));
            return arrForCreateTrx;
        }
        let newArrTrx = [];
        let passedAmount = 0;
        for (const value of arrTrx) {
            if (value.p <= price) {
                passedAmount = new bignumber_js_1.default(passedAmount).plus(new bignumber_js_1.default(value.a)).toNumber();
                continue;
            }
            newArrTrx.push({
                p: value.p,
                a: value.a,
            });
        }
        if (passedAmount >= cryptoMinAmount) {
            fs_1.default.writeFileSync(pathToFile, JSON.stringify(newArrTrx));
            arrForCreateTrx.push({
                p: price,
                a: passedAmount,
            });
            return arrForCreateTrx;
        }
        arrTrx.push({
            p: price,
            a: amount,
        });
        fs_1.default.writeFileSync(pathToFile, JSON.stringify(arrTrx));
        return arrForCreateTrx;
    }
    catch (e) {
        throw e;
    }
};
exports.waitTrxUtil = waitTrxUtil;
