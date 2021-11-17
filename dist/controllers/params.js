"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* Locale modules */
const utils_1 = require("../utils");
const models_1 = require("../models");
const process_env_init_1 = require("../bin/process-env-init");
/**
 * Set isTrade param
 * @param req
 * @param res
 */
const setIsTradeParam = async (req, res) => {
    try {
        const { body } = req;
        await utils_1.schemaValidator(models_1.isTradeSchema, body);
        process_env_init_1.setIsTrade(body.isTrade, body.coupleType);
        res.status(200).send({
            status: "SUCCESS" /* SUCCESS */,
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
exports.setIsTradeParam = setIsTradeParam;
/**
 * Set crypto amount param
 * @param req
 * @param res
 */
const setCryptoAmountParam = async (req, res) => {
    try {
        const { body } = req;
        await utils_1.schemaValidator(models_1.setBTCAmountSchema, body);
        process_env_init_1.setCryptoAmount(body.amount, body.crypto);
        res.status(200).send({
            status: "SUCCESS" /* SUCCESS */,
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
exports.setCryptoAmountParam = setCryptoAmountParam;
/**
 * Get all params
 * @param req
 * @param res
 */
const getAllParams = async (req, res) => {
    try {
        const result = process_env_init_1.getAll();
        res.status(200).send({
            status: "SUCCESS" /* SUCCESS */,
            data: Object.assign({}, result),
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
exports.getAllParams = getAllParams;
