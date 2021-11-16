"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stats = exports.telemetry = exports.ping = void 0;
/* Locale modules */
const utils_1 = require("../utils");
const ping = async (req, res) => {
    res.status(200).send('pong');
};
exports.ping = ping;
const telemetry = async (req, res) => {
    try {
        let telemetry = {
            httpCode: 200,
            status: "SUCCESS" /* SUCCESS */,
            data: {
                mysql: '',
                rabbit: '',
            },
        };
        try {
            if (!utils_1.RabbitUtil.getConnection()) {
                throw new Error('Rabbit get connection isn\'t success');
            }
            telemetry.data.rabbit = 'ok';
        }
        catch (e) {
            telemetry.data.rabbit = 'error';
            telemetry.status = "FAIL" /* FAIL */;
            telemetry.httpCode = 500;
        }
        res.status(telemetry.httpCode).send({
            status: telemetry.status,
            data: Object.assign({}, telemetry.data)
        });
    }
    catch (error) {
        res.status(error.statusCode || 500).json(error.responseObject);
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            error,
            additionalData: error.additionalData,
        }));
    }
};
exports.telemetry = telemetry;
const stats = async (req, res) => {
    try {
        const stats = utils_1.statisticUtil.getTimeRequest();
        res.status(200).send({
            status: "SUCCESS" /* SUCCESS */,
            data: Object.assign({}, stats)
        });
    }
    catch (error) {
        res.status(error.statusCode || 500).json(error.responseObject);
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            error,
            additionalData: error.additionalData,
        }));
    }
};
exports.stats = stats;
