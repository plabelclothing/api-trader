/** External modules **/
import {CronJob} from 'cron';

/** Locale modules **/
import config from './config';
import {getMinAmount, getFee} from '../libs';
import {CoupleType, LoggerLevel} from '../enums';
import {setBtcMinAmount, setServiceFee} from './process-env-init';
import {logger, loggerMessage} from '../utils';

/** Region update trade const, every 2 hours **/

const updateMinSellBTC = new CronJob('0 0 */2 * * *', async () => {
    try {
        const result = await getMinAmount(CoupleType.BTC_EUR);
        setBtcMinAmount(result);
        logger.log(LoggerLevel.WARN, loggerMessage({
            message: 'Min sell amount BTC is updated',
        }));
    } catch (error) {
        logger.log(LoggerLevel.ERROR, loggerMessage({
            message: 'Cron update min sell is error',
            error,
        }));
    }
}, null, true, config.luxon.timezone);

const updateExtFee = new CronJob('0 0 */2 * * *', async () => {
    try {
        const result = await getFee();
        setServiceFee(result);
        logger.log(LoggerLevel.WARN, loggerMessage({
            message: 'External fee is updated',
        }));
    } catch (error) {
        logger.log(LoggerLevel.ERROR, loggerMessage({
            message: 'Cron update service external fee is error',
            error,
        }));
    }
}, null, true, config.luxon.timezone);

/** End region update trade const **/

/** Start crons **/
updateMinSellBTC.start();
updateExtFee.start();