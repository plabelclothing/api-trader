/** External modules **/
import axios from 'axios';
import BigNumber from 'bignumber.js';
import {v4} from 'uuid';

/** Locale modules **/
import {getAll} from '../bin/process-env-init';
import {Bin} from '../types/bin';
import {
    CoupleTypeIsTrade,
    CoupleTypeMap,
    LoggerLevel,
    CoupleType,
    StatusTransaction,
    CoupleTypeMinAmount,
} from '../enums';
import config from '../bin/config';
import {logger, loggerMessage, signUtil, RabbitUtil, waitTrxUtil} from '../utils';
import {Libs} from '../types/libs';
import {Utils} from "../types/utils";

/**
 * Buy the crypto
 * @param type
 */
const buyCrypto = async (type: keyof typeof CoupleTypeIsTrade) => {
    try {
        const tradeConst: Bin.ProcessTradeConst = getAll();
        const passphrase = config.coinbase.passphrase;
        let accountId: string;
        const coupleType = CoupleType[type];

        /** Set account ID **/
        if (!tradeConst.ACCOUNTS_ID.hasOwnProperty(CoupleTypeMap[type])) {
            throw new Error(`Account ID is not exist for ${type}`);
        }
        accountId = tradeConst.ACCOUNTS_ID[CoupleTypeMap[type]];

        /** Check is trade this crypto **/
        if (!tradeConst.IS_TRADE[type]) {
            return;
        }

        /** Get balance account **/
        const timestampAccountBalance = Date.now() / 1000;
        const requestPathAccountBalance = `/accounts/${accountId}`;
        const methodAccountBalance = 'GET';

        const sign = signUtil(timestampAccountBalance, requestPathAccountBalance, null, methodAccountBalance);

        const resultOfGetBalance = await axios({
            url: `${config.coinbase.host}${requestPathAccountBalance}`,
            method: methodAccountBalance,
            headers: {
                'Accept': 'application/json',
                'cb-access-key': config.coinbase.key,
                'cb-access-passphrase': passphrase,
                'cb-access-sign': sign,
                'cb-access-timestamp': timestampAccountBalance
            }
        });

        const accountBalance = new BigNumber(resultOfGetBalance.data.available).toNumber();

        if (accountBalance <= 0) {
            return;
        }

        /** Get order book **/
        const timestampOrderBook = Date.now() / 1000;
        const requestPathOrderBook = `/products/${coupleType}/book?level=1`;
        const methodOrderBook = 'GET';

        const signOrderBook = signUtil(timestampOrderBook, requestPathOrderBook, null, methodOrderBook);

        const resultOfGetOrderBook = await axios({
            url: `${config.coinbase.host}${requestPathOrderBook}`,
            method: methodOrderBook,
            headers: {
                'Accept': 'application/json',
                'cb-access-key': config.coinbase.key,
                'cb-access-passphrase': passphrase,
                'cb-access-sign': signOrderBook,
                'cb-access-timestamp': timestampOrderBook
            }
        });

        /** Get asks **/
        const asks: [any] = resultOfGetOrderBook.data.asks;
        const bids: [any] = resultOfGetOrderBook.data.bids;
        let bestAks = asks[0][0];
        let finalExchange = bids[0][0];

        finalExchange = new BigNumber(finalExchange).plus(1).toFixed(2);

        if (finalExchange >= bestAks) {
            return;
        }

        let cryptoToBuy: number = new BigNumber(tradeConst.CRYPTO_BUY_AMOUNT[type]).toNumber();

        /** Check account balance default amount **/
        let defaultAmountBuyFiat: number = new BigNumber(finalExchange).multipliedBy(new BigNumber(cryptoToBuy)).toNumber();
        let defaultAmountBuyFiatFee: number = new BigNumber(defaultAmountBuyFiat).multipliedBy(new BigNumber(tradeConst.EXT_SERVICE_FEE)).toNumber();
        let defaultAmountBuyFiatWithFee: number = new BigNumber(defaultAmountBuyFiatFee).plus(new BigNumber(defaultAmountBuyFiat)).toNumber();

        /** Check min crypto to buy **/
        if (defaultAmountBuyFiatWithFee > accountBalance) {
            cryptoToBuy = new BigNumber(tradeConst.BTC_MIN_AMOUNT).toNumber();
            defaultAmountBuyFiat = new BigNumber(finalExchange).multipliedBy(new BigNumber(cryptoToBuy)).toNumber();
            defaultAmountBuyFiatFee = new BigNumber(defaultAmountBuyFiat).multipliedBy(new BigNumber(tradeConst.EXT_SERVICE_FEE)).toNumber();
            defaultAmountBuyFiatWithFee = new BigNumber(defaultAmountBuyFiatFee).plus(new BigNumber(defaultAmountBuyFiat)).toNumber();

            if (defaultAmountBuyFiatWithFee > accountBalance) {
                return;
            }
        }

        /** Create an order **/
        const transactionId = v4();
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

        const signOrder = signUtil(timestampOrder, requestPathOrder, bodyOrder, methodOrder);

        await axios({
            url: `${config.coinbase.host}${requestPathOrder}`,
            method: methodOrder,
            headers: {
                'Accept': 'application/json',
                'cb-access-key': config.coinbase.key,
                'cb-access-passphrase': passphrase,
                'cb-access-sign': signOrder,
                'cb-access-timestamp': timestampOrder
            },
            data: bodyOrder,
        });

        /** Send to rabbit **/
        const objRabbit: Libs.ObjRabbit = {
            i: transactionId,
            c: 0,
        };

        try {
            await RabbitUtil.sendToRabbit(objRabbit, {
                delay: config.rabbitMQ.deadLetterQueue.sell.ttl,
                routingKey: config.rabbitMQ.deadLetterQueue.sell.key,
            }, false);
        } catch (e) {
            logger.log(LoggerLevel.ERROR, loggerMessage({
                message: `Crypto deal ${type} is not send to rabbit. Id: ${transactionId}`,
            }));
        }
    } catch (e) {
        throw e;
    }
};

/**
 * Sell crypto
 * @param objRabbit
 */
const sellCrypto = async (objRabbit: Libs.ObjRabbit) => {
    try {
        const tradeConst: Bin.ProcessTradeConst = getAll();
        const passphrase = config.coinbase.passphrase;

        /** Get order info **/
        const timestampOrder = Date.now() / 1000;
        const requestPathOrder = `/orders/client:${objRabbit.i}`;
        const methodOrder = 'GET';

        const signOrder = signUtil(timestampOrder, requestPathOrder, null, methodOrder);

        const resultOfGetOrder = await axios({
            url: `${config.coinbase.host}${requestPathOrder}`,
            method: methodOrder,
            headers: {
                'Accept': 'application/json',
                'cb-access-key': config.coinbase.key,
                'cb-access-passphrase': passphrase,
                'cb-access-sign': signOrder,
                'cb-access-timestamp': timestampOrder
            }
        });

        const finalStatus = [StatusTransaction.DONE, StatusTransaction.REJECTED];

        if (!finalStatus.includes(resultOfGetOrder.data.status) && objRabbit.c < 2) {
            try {
                objRabbit.c++;
                return RabbitUtil.sendToRabbit(objRabbit, {
                    delay: config.rabbitMQ.deadLetterQueue.sell.ttl,
                    routingKey: config.rabbitMQ.deadLetterQueue.sell.key,
                }, false);
            } catch (e) {
                logger.log(LoggerLevel.ERROR, loggerMessage({
                    message: `Crypto deal ${resultOfGetOrder.data.product_id} is not send to rabbit. Id: ${objRabbit.i}`,
                }));
            }
        }

        /** If time is ended and bought crypto is 0 create a cancel **/
        let boughtCrypto = new BigNumber(resultOfGetOrder.data.filled_size).toNumber();

        if (boughtCrypto <= 0) {
            const timestampCancelOrder = Date.now() / 1000;
            const requestPathCancelOrder = `/orders/client:${objRabbit.i}`;
            const methodCancelOrder = 'DELETE';

            const signCancelOrder = signUtil(timestampCancelOrder, requestPathCancelOrder, null, methodCancelOrder);

            return axios({
                url: `${config.coinbase.host}${requestPathCancelOrder}`,
                method: methodCancelOrder,
                headers: {
                    'Accept': 'application/json',
                    'cb-access-key': config.coinbase.key,
                    'cb-access-passphrase': passphrase,
                    'cb-access-sign': signCancelOrder,
                    'cb-access-timestamp': timestampCancelOrder
                }
            });
        }

        /** Create price **/
        const fillFees = new BigNumber(resultOfGetOrder.data.fill_fees).toNumber();
        const buyPrice = new BigNumber(resultOfGetOrder.data.price).toNumber();
        const buyPriceWithFees = new BigNumber(buyPrice).multipliedBy(new BigNumber(boughtCrypto)).plus(new BigNumber(fillFees)).toNumber();
        const priceWithServiceFee = new BigNumber(buyPriceWithFees).multipliedBy(tradeConst.SERVICE_FEE).plus(new BigNumber(buyPriceWithFees)).toNumber();
        const priceWithExtFee = new BigNumber(priceWithServiceFee).multipliedBy(tradeConst.EXT_SERVICE_FEE).plus(new BigNumber(priceWithServiceFee)).toNumber();
        let finalPrice = new BigNumber(priceWithExtFee).dividedBy(boughtCrypto).toFixed(2);

        /** If bought crypto is smaller than crypto Min **/
        const amountMinKey = CoupleTypeMinAmount[<keyof typeof CoupleTypeMinAmount>resultOfGetOrder.data.product_id];
        const cryptoMinAmount = <number>tradeConst[<keyof typeof tradeConst>amountMinKey];
        if (boughtCrypto < cryptoMinAmount) {
            const resultOfWaitTransaction = <Utils.WaitTrxObj[]>waitTrxUtil(new BigNumber(finalPrice).toNumber(), boughtCrypto, cryptoMinAmount, resultOfGetOrder.data.product_id);
            if (!resultOfWaitTransaction.length) {
                return;
            }
            boughtCrypto = resultOfWaitTransaction[0].a;
            finalPrice = new BigNumber(resultOfWaitTransaction[0].p).toFixed(2);
        }

        /** Create a sell order **/
        const transactionId = v4();
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

        const signOrderSell = signUtil(timestampOrderSell, requestPathOrderSell, bodyOrderSell, methodOrderSell);

        await axios({
            url: `${config.coinbase.host}${requestPathOrderSell}`,
            method: methodOrderSell,
            headers: {
                'Accept': 'application/json',
                'cb-access-key': config.coinbase.key,
                'cb-access-passphrase': passphrase,
                'cb-access-sign': signOrderSell,
                'cb-access-timestamp': timestampOrderSell
            },
            data: bodyOrderSell,
        });

    } catch (e) {
        throw e;
    }
};

export {
    buyCrypto,
    sellCrypto,
}