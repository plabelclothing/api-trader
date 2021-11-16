/** Core modules **/
import * as crypto from 'crypto';

/** Locale modules **/
import config from '../bin/config';

/**
 * Create sign string
 * @param timestamp
 * @param requestPath
 * @param body
 * @param method
 */
const signUtil = (timestamp: number, requestPath: string, body: null | { [key: string]: any }, method: string) => {
    try {
        let message = timestamp + method + requestPath;
        if (body) {
            message += JSON.stringify(body);
        }
        const key = Buffer.from(config.coinbase.secret, 'base64');
        const hmac = crypto.createHmac('sha256', key);
        const sign = hmac.update(message).digest('base64');
        return sign;
    } catch (e) {
        throw e;
    }
};

export {
    signUtil,
}