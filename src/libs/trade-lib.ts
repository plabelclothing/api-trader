/** External modules **/
import axios from 'axios';
import BigNumber from 'bignumber.js';
import {v4} from 'uuid';

/** Locale modules **/
import {getAll} from '../bin/process-env-init';
import {Bin} from '../types/bin';
import {CoupleTypeIsTrade, CoupleTypeMap, LoggerLevel, CoupleType} from '../enums';
import config from '../bin/config';
import {logger, loggerMessage, signUtil, RabbitUtil} from '../utils';
import {Libs} from '../types/libs';

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

        const sign = await signUtil(timestampAccountBalance, requestPathAccountBalance, null, methodAccountBalance);

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
            return logger.log(LoggerLevel.WARN, loggerMessage({
                message: `Account ${type} ${accountId} is broke, step.1`,
            }));
        }

        /** Get order book **/
        const timestampOrderBook = Date.now() / 1000;
        const requestPathOrderBook = `/products/${coupleType}/book?level=2`;
        const methodOrderBook = 'GET';

        const signOrderBook = await signUtil(timestampOrderBook, requestPathOrderBook, null, methodOrderBook);

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
        let exchangeFromOrderBook = asks[0][0];
        let cryptoToBuy: number = new BigNumber(tradeConst.CRYPTO_BUY_AMOUNT[type]).toNumber();

        const exchangeFromOrderBookSale = new BigNumber(exchangeFromOrderBook).multipliedBy(0.01).toNumber();
        exchangeFromOrderBook = new BigNumber(exchangeFromOrderBook).minus(new BigNumber(exchangeFromOrderBookSale)).toNumber();


        // /** if amount crypto is smaller than i want to buy **/
        // if (new BigNumber(asks[0][1]).toNumber() < tradeConst.CRYPTO_BUY_AMOUNT[type]) {
        //     let sumExchange = 0;
        //     for (let i = 0; i < 3; i++) {
        //         sumExchange = new BigNumber(sumExchange).plus(new BigNumber(asks[i][0])).toNumber();
        //     }
        //     exchangeFromOrderBook = new BigNumber(sumExchange).dividedBy(3).toFixed(2);
        // }

        /** Check account balance default amount **/
        let defaultAmountBuyFiat: number = new BigNumber(exchangeFromOrderBook).multipliedBy(new BigNumber(cryptoToBuy)).toNumber();
        let defaultAmountBuyFiatFee: number = new BigNumber(defaultAmountBuyFiat).multipliedBy(new BigNumber(tradeConst.EXT_SERVICE_FEE)).toNumber();
        let defaultAmountBuyFiatWithFee: number = new BigNumber(defaultAmountBuyFiatFee).plus(new BigNumber(defaultAmountBuyFiat)).toNumber();

        /** Check min crypto to buy **/
        if (defaultAmountBuyFiatWithFee > accountBalance) {
            cryptoToBuy = new BigNumber(tradeConst.BTC_MIN_AMOUNT).toNumber();
            defaultAmountBuyFiat = new BigNumber(exchangeFromOrderBook).multipliedBy(new BigNumber(cryptoToBuy)).toNumber();
            defaultAmountBuyFiatFee = new BigNumber(defaultAmountBuyFiat).multipliedBy(new BigNumber(tradeConst.EXT_SERVICE_FEE)).toNumber();
            defaultAmountBuyFiatWithFee = new BigNumber(defaultAmountBuyFiatFee).plus(new BigNumber(defaultAmountBuyFiat)).toNumber();

            if (defaultAmountBuyFiatWithFee > accountBalance) {
                return logger.log(LoggerLevel.WARN, loggerMessage({
                    message: `Account ${type} ${accountId} is broke, step.2`,
                }));
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
            price: exchangeFromOrderBook,
            client_oid: transactionId,
        };

        const signOrder = await signUtil(timestampOrder, requestPathOrder, bodyOrder, methodOrder);

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

        /** Create a future exchange price **/
        const futureAmountWithServiceFee: number = new BigNumber(defaultAmountBuyFiatWithFee).multipliedBy(tradeConst.SERVICE_FEE).plus(new BigNumber(defaultAmountBuyFiatWithFee)).toNumber();
        const futureAmountWithExtServiceFee: number = new BigNumber(futureAmountWithServiceFee).multipliedBy(tradeConst.EXT_SERVICE_FEE).plus(new BigNumber(futureAmountWithServiceFee)).toNumber();
        const futureExchange = new BigNumber(futureAmountWithExtServiceFee).dividedBy(new BigNumber(cryptoToBuy)).toFixed(2);

        /** Send to rabbit **/
        const objRabbit: Libs.ObjRabbit = {
            i: transactionId,
            e: futureExchange,
            c: 0,
        };

        try {
            await RabbitUtil.sendToRabbit(objRabbit, {
                delay: config.rabbitMQ.deadLetterQueue.ttl,
                routingKey: config.rabbitMQ.deadLetterQueue.key,
            });
        } catch (e) {
            logger.log(LoggerLevel.ERROR, loggerMessage({
                message: `Crypto deal ${type} is not send to rabbit. Id: ${transactionId}, future price: ${futureExchange}`,
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
        const passphrase = config.coinbase.passphrase;

        /** Get order info **/
        const timestampOrder = Date.now() / 1000;
        const requestPathOrder = `/orders/client:${objRabbit.i}`;
        const methodOrder = 'GET';

        const signOrder = await signUtil(timestampOrder, requestPathOrder, null, methodOrder);

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

        if (resultOfGetOrder.data.done_reason !== 'filled' && objRabbit.c < 7) {
            try {
                objRabbit.c++;
                return RabbitUtil.sendToRabbit(objRabbit, {
                    delay: config.rabbitMQ.deadLetterQueue.ttl,
                    routingKey: config.rabbitMQ.deadLetterQueue.key,
                });
            } catch (e) {
                logger.log(LoggerLevel.ERROR, loggerMessage({
                    message: `Crypto deal ${resultOfGetOrder.data.product_id} is not send to rabbit. Id: ${objRabbit.i}, future price: ${objRabbit.e}`,
                }));
            }
        }

        const boughtCrypto = new BigNumber(resultOfGetOrder.data.size).toNumber();

        if (boughtCrypto <= 0) {
            return logger.log(LoggerLevel.WARN, loggerMessage({
                message: `Transaction is not success ${objRabbit.i}`,
            }));
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
            price: objRabbit.e,
            client_oid: transactionId,
        };

        const signOrderSell = await signUtil(timestampOrderSell, requestPathOrderSell, bodyOrderSell, methodOrderSell);

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