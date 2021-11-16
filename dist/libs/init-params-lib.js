"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/** External modules **/
const axios_1 = __importDefault(require("axios"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
/** Locale modules **/
const config_1 = __importDefault(require("../bin/config"));
const utils_1 = require("../utils");
/**
 * Get min trade amount
 * @param type
 */
const getMinAmount = async (type) => {
    try {
        const timestamp = Date.now() / 1000;
        const passphrase = config_1.default.coinbase.passphrase;
        const requestPath = `/products/${type}`;
        const method = 'GET';
        const sign = await utils_1.signUtil(timestamp, requestPath, null, method);
        const result = await axios_1.default({
            url: `${config_1.default.coinbase.host}${requestPath}`,
            method,
            headers: {
                'Accept': 'application/json',
                'cb-access-key': config_1.default.coinbase.key,
                'cb-access-passphrase': passphrase,
                'cb-access-sign': sign,
                'cb-access-timestamp': timestamp
            }
        });
        const minAmount = new bignumber_js_1.default(result.data.base_min_size).toNumber();
        return minAmount;
    }
    catch (e) {
        throw e;
    }
};
exports.getMinAmount = getMinAmount;
/**
 * Get min trade amount
 */
const getAccountsId = async () => {
    try {
        const timestamp = Date.now() / 1000;
        const passphrase = config_1.default.coinbase.passphrase;
        const requestPath = `/accounts`;
        const method = 'GET';
        const sign = await utils_1.signUtil(timestamp, requestPath, null, method);
        const result = await axios_1.default({
            url: `${config_1.default.coinbase.host}${requestPath}`,
            method,
            headers: {
                'Accept': 'application/json',
                'cb-access-key': config_1.default.coinbase.key,
                'cb-access-passphrase': passphrase,
                'cb-access-sign': sign,
                'cb-access-timestamp': timestamp
            }
        });
        let objAccount = {};
        result.data.forEach((val) => {
            objAccount[val.currency] = val.id;
        });
        return objAccount;
    }
    catch (e) {
        throw e;
    }
};
exports.getAccountsId = getAccountsId;
/**
 * Get fee
 */
const getFee = async () => {
    try {
        const timestamp = Date.now() / 1000;
        const passphrase = config_1.default.coinbase.passphrase;
        const requestPath = `/fees`;
        const method = 'GET';
        const sign = await utils_1.signUtil(timestamp, requestPath, null, method);
        const result = await axios_1.default({
            url: `${config_1.default.coinbase.host}${requestPath}`,
            method,
            headers: {
                'Accept': 'application/json',
                'cb-access-key': config_1.default.coinbase.key,
                'cb-access-passphrase': passphrase,
                'cb-access-sign': sign,
                'cb-access-timestamp': timestamp
            }
        });
        const fee = new bignumber_js_1.default(result.data.maker_fee_rate).toNumber();
        return fee;
    }
    catch (e) {
        throw e;
    }
};
exports.getFee = getFee;
