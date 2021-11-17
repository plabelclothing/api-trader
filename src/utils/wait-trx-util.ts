/** Core modules **/
import fs from 'fs';

/** External modules **/
import BigNumber from 'bignumber.js';

/** Locale modules **/
import config from '../bin/config';
import {getAll} from '../bin/process-env-init';
import {Utils} from '../types/utils';
import {Bin} from "../types/bin";

const waitTrxUtil = (price: number, amount: number) => {
    try {
        const tradeConst: Bin.ProcessTradeConst = getAll();
        let arrForCreateTrx: Utils.WaitTrxObj[] = [];

        /** Read file **/
        const fileContent = fs.readFileSync(config.assets.waitTransactionFilePath).toString();
        let arrTrx: Utils.WaitTrxObj[] = [];
        try {
            arrTrx = JSON.parse(fileContent);
        } catch (e) {
            arrTrx = [];
        }

        if (!arrTrx.length) {
            arrTrx.push({
                a: amount,
                p: price,
            });

            fs.writeFileSync(config.assets.waitTransactionFilePath, JSON.stringify(arrTrx));
            return arrForCreateTrx;
        }

        let newArrTrx: Utils.WaitTrxObj[] = [];
        let passedAmount = 0;

        for (const value of arrTrx) {
            if (value.p <= price) {
                passedAmount = new BigNumber(passedAmount).plus(new BigNumber(value.a)).toNumber();
                continue;
            }
            newArrTrx.push({
                p: value.p,
                a: value.a,
            });
        }

        if (passedAmount >= tradeConst.BTC_MIN_AMOUNT) {
            fs.writeFileSync(config.assets.waitTransactionFilePath, JSON.stringify(newArrTrx));
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

        fs.writeFileSync(config.assets.waitTransactionFilePath, JSON.stringify(arrTrx));
        return arrForCreateTrx;
    } catch (e) {
        throw e;
    }
};

export {
    waitTrxUtil,
}
