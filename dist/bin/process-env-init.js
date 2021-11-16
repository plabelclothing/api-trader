"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setStartParams = exports.setServiceFee = exports.setBtcMinAmount = exports.setIsTrade = exports.getAll = exports.setCryptoAmount = void 0;
const libs_1 = require("../libs");
const enums_1 = require("../enums");
const config_1 = __importDefault(require("./config"));
/** Init RAM variables **/
const TRADE_CONST = {
    CRYPTO_BUY_AMOUNT: {
        BTC_USD: config_1.default.trade.cryptoBuyAmount.btcUsd,
        BTC_EUR: config_1.default.trade.cryptoBuyAmount.btcEur,
    },
    IS_TRADE: {
        BTC_EUR: config_1.default.trade.isTrade.btcEur,
        BTC_USD: config_1.default.trade.isTrade.btcUsd,
    },
    BTC_MIN_AMOUNT: 0.00002100,
    EXT_SERVICE_FEE: 0.005,
    SERVICE_FEE: config_1.default.trade.serviceFee,
    ACCOUNTS_ID: {},
};
/**
 * Set start params
 */
const setStartParams = async () => {
    try {
        /** Set min amount **/
        const resultMinAmount = await libs_1.getMinAmount(enums_1.CoupleType.BTC_EUR);
        TRADE_CONST.BTC_MIN_AMOUNT = resultMinAmount;
        /** Set fee **/
        const resultFee = await libs_1.getFee();
        TRADE_CONST.EXT_SERVICE_FEE = resultFee;
        /** Set account ids **/
        const accountIds = await libs_1.getAccountsId();
        TRADE_CONST.ACCOUNTS_ID = accountIds;
    }
    catch (e) {
        throw e;
    }
};
exports.setStartParams = setStartParams;
/**
 * Getter
 */
const getAll = () => {
    return TRADE_CONST;
};
exports.getAll = getAll;
/**
 * Setter crypto amount
 * @param value
 * @param type
 */
const setCryptoAmount = (value, type) => {
    TRADE_CONST.CRYPTO_BUY_AMOUNT[type] = value;
};
exports.setCryptoAmount = setCryptoAmount;
/**
 * Setter BTC Min amount
 * @param value
 */
const setBtcMinAmount = (value) => {
    TRADE_CONST.BTC_MIN_AMOUNT = value;
};
exports.setBtcMinAmount = setBtcMinAmount;
/**
 * Setter service fee
 */
const setServiceFee = (value) => {
    TRADE_CONST.EXT_SERVICE_FEE = value;
};
exports.setServiceFee = setServiceFee;
/**
 * Setter is trade flag
 * @param value
 * @param type
 */
const setIsTrade = (value, type) => {
    TRADE_CONST.IS_TRADE[type] = value;
};
exports.setIsTrade = setIsTrade;
