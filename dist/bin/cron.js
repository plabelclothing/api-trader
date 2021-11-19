"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/** External modules **/
const cron_1 = require("cron");
/** Locale modules **/
const config_1 = __importDefault(require("./config"));
const libs_1 = require("../libs");
const enums_1 = require("../enums");
const process_env_init_1 = require("./process-env-init");
const utils_1 = require("../utils");
/** Region update trade const, every 2 hours **/
const updateMinSellBTC = new cron_1.CronJob('0 0 */2 * * *', async () => {
    try {
        const result = await libs_1.getMinAmount(enums_1.CoupleType.BTC_EUR);
        process_env_init_1.setBtcMinAmount(result);
        utils_1.logger.log("warn" /* WARN */, utils_1.loggerMessage({
            message: 'Min sell amount BTC is updated',
        }));
    }
    catch (error) {
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            message: 'Cron update min sell is error',
            error,
        }));
    }
}, null, true, config_1.default.luxon.timezone);
const updateExtFee = new cron_1.CronJob('0 0 */2 * * *', async () => {
    try {
        const result = await libs_1.getFee();
        process_env_init_1.setServiceFee(result);
        utils_1.logger.log("warn" /* WARN */, utils_1.loggerMessage({
            message: 'External fee is updated',
        }));
    }
    catch (error) {
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            message: 'Cron update service external fee is error',
            error,
        }));
    }
}, null, true, config_1.default.luxon.timezone);
/** End region update trade const **/
/** Region trade cron **/
const tradeBtcEur = new cron_1.CronJob('*/5 * * * * *', async () => {
    try {
        await libs_1.buyCrypto(enums_1.CoupleTypeIsTrade.BTC_EUR);
    }
    catch (error) {
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            message: 'Buy crypto BTC-EUR is not success',
            error,
        }));
    }
}, null, true, config_1.default.luxon.timezone);
const tradeBtcUsd = new cron_1.CronJob('*/5 * * * * *', async () => {
    try {
        await libs_1.buyCrypto(enums_1.CoupleTypeIsTrade.BTC_USD);
    }
    catch (error) {
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            message: 'Buy crypto BTC-USD is not success',
            error,
        }));
    }
}, null, true, config_1.default.luxon.timezone);
/** End region trade cron **/
/** Start crons **/
updateMinSellBTC.start();
updateExtFee.start();
tradeBtcEur.start();
tradeBtcUsd.start();
