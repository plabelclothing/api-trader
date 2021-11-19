/** Core modules **/
import fs from 'fs';

/** External modules **/
import BigNumber from 'bignumber.js';

/** Locale modules **/
import config from '../bin/config';
import {Utils} from '../types/utils';

/**
 * Merge not sold crypto
 * @param price
 * @param amount
 * @param cryptoMinAmount
 * @param typeCrypto
 */
const waitTrxUtil = (price: number, amount: number, cryptoMinAmount: number, typeCrypto: string) => {
    try {
        let arrForCreateTrx: Utils.WaitTrxObj[] = [];
        const pathToFile = config.assets.waitTransactionFilePath[typeCrypto];

        /** Read file **/
        const fileContent = fs.readFileSync(pathToFile).toString();
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

            fs.writeFileSync(pathToFile, JSON.stringify(arrTrx));
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

        if (passedAmount >= cryptoMinAmount) {
            fs.writeFileSync(pathToFile, JSON.stringify(newArrTrx));
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

        fs.writeFileSync(pathToFile, JSON.stringify(arrTrx));
        return arrForCreateTrx;
    } catch (e) {
        throw e;
    }
};

export {
    waitTrxUtil,
}
