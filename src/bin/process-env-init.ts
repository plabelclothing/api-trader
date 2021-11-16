/** Locale variables **/
import {Bin} from '../types/bin';
import {getMinAmount, getFee} from '../libs';
import {CoupleType} from '../enums';
import config from './config';

/** Init RAM variables **/
const TRADE_CONST: Bin.ProcessTradeConst = {
    CRYPTO_BUY_AMOUNT: {
        BTC: config.trade.cryptoBuyAmount.btc,
    },
    IS_TRADE: {
        BTC_EUR: config.trade.isTrade.btcEur,
        BTC_USD: config.trade.isTrade.btcUsd,
    },
    BTC_MIN_AMOUNT: 0.00002100,
    EXT_SERVICE_FEE: 0.005,
    SERVICE_FEE: config.trade.serviceFee,
};

/**
 * Set start params
 */
const setStartParams = async () => {
    try {
        /** Set min amount **/
        const resultMinAmount = await getMinAmount(CoupleType.BTC_EUR);
        TRADE_CONST.BTC_MIN_AMOUNT = resultMinAmount;

        /** Set fee **/
        const resultFee = await getFee();
        TRADE_CONST.EXT_SERVICE_FEE = resultFee;
    } catch (e) {
        throw e;
    }
};

/**
 * Getter
 */
const getAll = () => {
    return TRADE_CONST;
}

/**
 * Setter crypto amount
 * @param value
 * @param type
 */
const setCryptoAmount = (value: number, type: keyof typeof TRADE_CONST.CRYPTO_BUY_AMOUNT) => {
    TRADE_CONST.CRYPTO_BUY_AMOUNT[type] = value;
};

/**
 * Setter BTC Min amount
 * @param value
 */
const setBtcMinAmount = (value: number) => {
    TRADE_CONST.BTC_MIN_AMOUNT = value;
};

/**
 * Setter service fee
 */
const setServiceFee = (value: number) => {
    TRADE_CONST.EXT_SERVICE_FEE = value;
};

/**
 * Setter is trade flag
 * @param value
 * @param type
 */
const setIsTrade = (value: boolean, type: keyof typeof TRADE_CONST.IS_TRADE) => {
    TRADE_CONST.IS_TRADE[type] = value;
};

export {
    setCryptoAmount,
    getAll,
    setIsTrade,
    setBtcMinAmount,
    setServiceFee,
    setStartParams,
}