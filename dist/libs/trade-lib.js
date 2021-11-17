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
            return;
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
                return;
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
        /** Send to rabbit **/
        const objRabbit = {
            i: transactionId,
        };
        try {
            await utils_1.RabbitUtil.sendToRabbit(objRabbit, {
                delay: config_1.default.rabbitMQ.deadLetterQueue.ttl,
                routingKey: config_1.default.rabbitMQ.deadLetterQueue.key,
            });
        }
        catch (e) {
            utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
                message: `Crypto deal ${type} is not send to rabbit. Id: ${transactionId}`,
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
        const tradeConst = process_env_init_1.getAll();
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
        const finalStatus = [enums_1.StatusTransaction.DONE, enums_1.StatusTransaction.REJECTED];
        if (!finalStatus.includes(resultOfGetOrder.data.status)) {
            try {
                return utils_1.RabbitUtil.sendToRabbit(objRabbit, {
                    delay: config_1.default.rabbitMQ.deadLetterQueue.ttl,
                    routingKey: config_1.default.rabbitMQ.deadLetterQueue.key,
                });
            }
            catch (e) {
                utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
                    message: `Crypto deal ${resultOfGetOrder.data.product_id} is not send to rabbit. Id: ${objRabbit.i}`,
                }));
            }
        }
        let boughtCrypto = new bignumber_js_1.default(resultOfGetOrder.data.filled_size).toNumber();
        if (boughtCrypto <= 0) {
            return;
        }
        /** Create price **/
        const fillFees = new bignumber_js_1.default(resultOfGetOrder.data.fill_fees).toNumber();
        const buyPrice = new bignumber_js_1.default(resultOfGetOrder.data.price).toNumber();
        const buyPriceWithFees = new bignumber_js_1.default(buyPrice).multipliedBy(new bignumber_js_1.default(boughtCrypto)).plus(new bignumber_js_1.default(fillFees)).toNumber();
        const priceWithServiceFee = new bignumber_js_1.default(buyPriceWithFees).multipliedBy(tradeConst.SERVICE_FEE).plus(new bignumber_js_1.default(buyPriceWithFees)).toNumber();
        const priceWithExtFee = new bignumber_js_1.default(priceWithServiceFee).multipliedBy(tradeConst.EXT_SERVICE_FEE).plus(new bignumber_js_1.default(priceWithServiceFee)).toNumber();
        let finalPrice = new bignumber_js_1.default(priceWithExtFee).dividedBy(boughtCrypto).toFixed(2);
        /** If bought crypto is smaller than crypto Min **/
        if (boughtCrypto < tradeConst.BTC_MIN_AMOUNT) {
            const resultOfWaitTransaction = utils_1.waitTrxUtil(new bignumber_js_1.default(finalPrice).toNumber(), boughtCrypto);
            if (!resultOfWaitTransaction.length) {
                return;
            }
            boughtCrypto = resultOfWaitTransaction[0].a;
            finalPrice = new bignumber_js_1.default(resultOfWaitTransaction[0].p).toFixed(2);
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
            price: finalPrice,
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
