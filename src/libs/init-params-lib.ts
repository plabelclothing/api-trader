/** External modules **/
import axios from 'axios';
import BigNumber from 'bignumber.js';

/** Locale modules **/
import config from '../bin/config';
import {signUtil} from '../utils';

/**
 * Get min trade amount
 * @param type
 */
const getMinAmount = async (type: string) => {
    try {
        const timestamp = Date.now() / 1000;
        const passphrase = config.coinbase.passphrase;
        const requestPath = `/products/${type}`;
        const method = 'GET';

        const sign = signUtil(timestamp, requestPath, null, method);

        const result = await axios({
            url: `${config.coinbase.host}${requestPath}`,
            method,
            headers: {
                'Accept': 'application/json',
                'cb-access-key': config.coinbase.key,
                'cb-access-passphrase': passphrase,
                'cb-access-sign': sign,
                'cb-access-timestamp': timestamp
            }
        });

        const minAmount = new BigNumber(result.data.base_min_size).toNumber();

        return minAmount;
    } catch (e) {
        throw e;
    }
};

/**
 * Get min trade amount
 */
const getAccountsId = async () => {
    try {
        const timestamp = Date.now() / 1000;
        const passphrase = config.coinbase.passphrase;
        const requestPath = `/accounts`;
        const method = 'GET';

        const sign = signUtil(timestamp, requestPath, null, method);

        const result = await axios({
            url: `${config.coinbase.host}${requestPath}`,
            method,
            headers: {
                'Accept': 'application/json',
                'cb-access-key': config.coinbase.key,
                'cb-access-passphrase': passphrase,
                'cb-access-sign': sign,
                'cb-access-timestamp': timestamp
            }
        });

        let objAccount: { [key: string]: string } = {};

        result.data.forEach((val: { [key: string]: any }) => {
            objAccount[val.currency] = val.id;
        });

        return objAccount;
    } catch (e) {
        throw e;
    }
};

/**
 * Get fee
 */
const getFee = async () => {
    try {
        const timestamp = Date.now() / 1000;
        const passphrase = config.coinbase.passphrase;
        const requestPath = `/fees`;
        const method = 'GET';

        const sign = signUtil(timestamp, requestPath, null, method);

        const result = await axios({
            url: `${config.coinbase.host}${requestPath}`,
            method,
            headers: {
                'Accept': 'application/json',
                'cb-access-key': config.coinbase.key,
                'cb-access-passphrase': passphrase,
                'cb-access-sign': sign,
                'cb-access-timestamp': timestamp
            }
        });

        const fee = new BigNumber(result.data.maker_fee_rate).toNumber();

        return fee;
    } catch (e) {
        throw e;
    }
};


export {
    getMinAmount,
    getFee,
    getAccountsId,
}