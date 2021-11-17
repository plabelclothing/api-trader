"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/** External modules **/
const axios_1 = __importDefault(require("axios"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const uuid_1 = require("uuid");
/** Locale modules **/
const process_env_init_1 = require("../bin/process-env-init");
const enums_1 = require("../enums");
const config_1 = __importDefault(require("../bin/config"));
const utils_1 = require("../utils");
/**
 * Buy the crypto
 * @param type
 */
const buyCrypto = async (type) => {
    try {
        const tradeConst = process_env_init_1.getAll();
        const passphrase = config_1.default.coinbase.passphrase;
        let accountId;
        const coupleType = enums_1.CoupleType[type];
        /** Set account ID **/
        if (!tradeConst.ACCOUNTS_ID.hasOwnProperty(enums_1.CoupleTypeMap[type])) {
            throw new Error(`Account ID is not exist for ${type}`);
        }
        accountId = tradeConst.ACCOUNTS_ID[enums_1.CoupleTypeMap[type]];
        /** Check is trade this crypto **/
        if (!tradeConst.IS_TRADE[type]) {
            return;
        }
        /** Get balance account **/
        const timestampAccountBalance = Date.now() / 1000;
        const requestPathAccountBalance = `/accounts/${accountId}`;
        const methodAccountBalance = 'GET';
        const sign = await utils_1.signUtil(timestampAccountBalance, requestPathAccountBalance, null, methodAccountBalance);
        const resultOfGetBalance = await axios_1.default({
            url: `${config_1.default.coinbase.host}${requestPathAccountBalance}`,
            method: methodAccountBalance,
            headers: {
                'Accept': 'application/json',
                'cb-access-key': config_1.default.coinbase.key,
                'cb-access-passphrase': passphrase,
                'cb-access-sign': sign,
                'cb-access-timestamp': timestampAccountBalance
            }
        });
        const accountBalance = new bignumber_js_1.default(resultOfGetBalance.data.available).toNumber();
        if (accountBalance <= 0) {
            return utils_1.logger.log("warn" /* WARN */, utils_1.loggerMessage({
                message: `Account ${type} ${accountId} is broke, step.1`,
            }));
        }
        /** Get order book **/
        const timestampOrderBook = Date.now() / 1000;
        const requestPathOrderBook = `/products/${coupleType}/book?level=1`;
        const methodOrderBook = 'GET';
        const signOrderBook = await utils_1.signUtil(timestampOrderBook, requestPathOrderBook, null, methodOrderBook);
        const resultOfGetOrderBook = await axios_1.default({
            url: `${config_1.default.coinbase.host}${requestPathOrderBook}`,
            method: methodOrderBook,
            headers: {
                'Accept': 'application/json',
                'cb-access-key': config_1.default.coinbase.key,
                'cb-access-passphrase': passphrase,
                'cb-access-sign': signOrderBook,
                'cb-access-timestamp': timestampOrderBook
            }
        });
        /** Get asks **/
        const asks = resultOfGetOrderBook.data.asks;
        const bids = resultOfGetOrderBook.data.bids;
        let bestAks = asks[0][0];
        let finalExchange = bids[0][0];
        finalExchange = new bignumber_js_1.default(finalExchange).plus(1).toFixed(2);
        if (finalExchange >= bestAks) {
            return;
        }
        let cryptoToBuy = new bignumber_js_1.default(tradeConst.CRYPTO_BUY_AMOUNT[type]).toNumber();
        // const exchangeFromOrderBookSale = new BigNumber(finalExchange).multipliedBy(0.01).toNumber();
        // finalExchange = new BigNumber(finalExchange).minus(new BigNumber(exchangeFromOrderBookSale)).toFixed(2);
        // /** if amount crypto is smaller than i want to buy **/
        // if (new BigNumber(asks[0][1]).toNumber() < tradeConst.CRYPTO_BUY_AMOUNT[type]) {
        //     let sumExchange = 0;
        //     for (let i = 0; i < 3; i++) {
        //         sumExchange = new BigNumber(sumExchange).plus(new BigNumber(asks[i][0])).toNumber();
        //     }
        //     finalExchange = new BigNumber(sumExchange).dividedBy(3).toFixed(2);
        // }
        /** Check account balance default amount **/
        let defaultAmountBuyFiat = new bignumber_js_1.default(finalExchange).multipliedBy(new bignumber_js_1.default(cryptoToBuy)).toNumber();
        let defaultAmountBuyFiatFee = new bignumber_js_1.default(defaultAmountBuyFiat).multipliedBy(new bignumber_js_1.default(tradeConst.EXT_SERVICE_FEE)).toNumber();
        let defaultAmountBuyFiatWithFee = new bignumber_js_1.default(defaultAmountBuyFiatFee).plus(new bignumber_js_1.default(defaultAmountBuyFiat)).toNumber();
        /** Check min crypto to buy **/
        if (defaultAmountBuyFiatWithFee > accountBalance) {
            cryptoToBuy = new bignumber_js_1.default(tradeConst.BTC_MIN_AMOUNT).toNumber();
            defaultAmountBuyFiat = new bignumber_js_1.default(finalExchange).multipliedBy(new bignumber_js_1.default(cryptoToBuy)).toNumber();
            defaultAmountBuyFiatFee = new bignumber_js_1.default(defaultAmountBuyFiat).multipliedBy(new bignumber_js_1.default(tradeConst.EXT_SERVICE_FEE)).toNumber();
            defaultAmountBuyFiatWithFee = new bignumber_js_1.default(defaultAmountBuyFiatFee).plus(new bignumber_js_1.default(defaultAmountBuyFiat)).toNumber();
            if (defaultAmountBuyFiatWithFee > accountBalance) {
                return utils_1.logger.log("warn" /* WARN */, utils_1.loggerMessage({
                    message: `Account ${type} ${accountId} is broke, step.2`,
                }));
            }
        }
        /** Create an order **/
        const transactionId = uuid_1.v4();
        const timestampOrder = Date.now() / 1000;
        const requestPathOrder = `/orders`;
        const methodOrder = 'POST';
        const bodyOrder = {
            profile_id: 'default profile_id',
            type: 'limit',
            side: 'buy',
            stp: 'dc',
            time_in_force: 'GTT',
            cancel_after: 'min',
            post_only: 'false',
            product_id: coupleType,
            size: cryptoToBuy,
            price: finalExchange,
            client_oid: transactionId,
        };
        const signOrder = await utils_1.signUtil(timestampOrder, requestPathOrder, bodyOrder, methodOrder);
        await axios_1.default({
            url: `${config_1.default.coinbase.host}${requestPathOrder}`,
            method: methodOrder,
            headers: {
                'Accept': 'application/json',
                'cb-access-key': config_1.default.coinbase.key,
                'cb-access-passphrase': passphrase,
                'cb-access-sign': signOrder,
                'cb-access-timestamp': timestampOrder
            },
            data: bodyOrder,
        });
        /** Create a future exchange price **/
        const futureAmountWithServiceFee = new bignumber_js_1.default(defaultAmountBuyFiatWithFee).multipliedBy(tradeConst.SERVICE_FEE).plus(new bignumber_js_1.default(defaultAmountBuyFiatWithFee)).toNumber();
        const futureAmountWithExtServiceFee = new bignumber_js_1.default(futureAmountWithServiceFee).multipliedBy(tradeConst.EXT_SERVICE_FEE).plus(new bignumber_js_1.default(futureAmountWithServiceFee)).toNumber();
        const futureExchange = new bignumber_js_1.default(futureAmountWithExtServiceFee).dividedBy(new bignumber_js_1.default(cryptoToBuy)).toFixed(2);
        /** Send to rabbit **/
        const objRabbit = {
            i: transactionId,
            e: futureExchange,
            c: 0,
        };
        try {
            await utils_1.RabbitUtil.sendToRabbit(objRabbit, {
                delay: config_1.default.rabbitMQ.deadLetterQueue.ttl,
                routingKey: config_1.default.rabbitMQ.deadLetterQueue.key,
            });
        }
        catch (e) {
            utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
                message: `Crypto deal ${type} is not send to rabbit. Id: ${transactionId}, future price: ${futureExchange}`,
            }));
        }
    }
    catch (e) {
        throw e;
    }
};
exports.buyCrypto = buyCrypto;
/**
 * Sell crypto
 * @param objRabbit
 */
const sellCrypto = async (objRabbit) => {
    try {
        const passphrase = config_1.default.coinbase.passphrase;
        /** Get order info **/
        const timestampOrder = Date.now() / 1000;
        const requestPathOrder = `/orders/client:${objRabbit.i}`;
        const methodOrder = 'GET';
        const signOrder = await utils_1.signUtil(timestampOrder, requestPathOrder, null, methodOrder);
        const resultOfGetOrder = await axios_1.default({
            url: `${config_1.default.coinbase.host}${requestPathOrder}`,
            method: methodOrder,
            headers: {
                'Accept': 'application/json',
                'cb-access-key': config_1.default.coinbase.key,
                'cb-access-passphrase': passphrase,
                'cb-access-sign': signOrder,
                'cb-access-timestamp': timestampOrder
            }
        });
        if (resultOfGetOrder.data.done_reason !== 'filled' && objRabbit.c < 7) {
            try {
                objRabbit.c++;
                return utils_1.RabbitUtil.sendToRabbit(objRabbit, {
                    delay: config_1.default.rabbitMQ.deadLetterQueue.ttl,
                    routingKey: config_1.default.rabbitMQ.deadLetterQueue.key,
                });
            }
            catch (e) {
                utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
                    message: `Crypto deal ${resultOfGetOrder.data.product_id} is not send to rabbit. Id: ${objRabbit.i}, future price: ${objRabbit.e}`,
                }));
            }
        }
        const boughtCrypto = new bignumber_js_1.default(resultOfGetOrder.data.size).toNumber();
        if (boughtCrypto <= 0) {
            return utils_1.logger.log("warn" /* WARN */, utils_1.loggerMessage({
                message: `Transaction is not success ${objRabbit.i}`,
            }));
        }
        /** Create a sell order **/
        const transactionId = uuid_1.v4();
        const timestampOrderSell = Date.now() / 1000;
        const requestPathOrderSell = `/orders`;
        const methodOrderSell = 'POST';
        const bodyOrderSell = {
            profile_id: 'default profile_id',
            type: 'limit',
            side: 'sell',
            stp: 'dc',
            time_in_force: 'GTC',
            post_only: 'false',
            product_id: resultOfGetOrder.data.product_id,
            size: boughtCrypto,
            price: objRabbit.e,
            client_oid: transactionId,
        };
        const signOrderSell = await utils_1.signUtil(timestampOrderSell, requestPathOrderSell, bodyOrderSell, methodOrderSell);
        await axios_1.default({
            url: `${config_1.default.coinbase.host}${requestPathOrderSell}`,
            method: methodOrderSell,
            headers: {
                'Accept': 'application/json',
                'cb-access-key': config_1.default.coinbase.key,
                'cb-access-passphrase': passphrase,
                'cb-access-sign': signOrderSell,
                'cb-access-timestamp': timestampOrderSell
            },
            data: bodyOrderSell,
        });
    }
    catch (e) {
        throw e;
    }
};
exports.sellCrypto = sellCrypto;
