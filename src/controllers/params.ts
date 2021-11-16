/* External modules */
import {Request, Response} from 'express';

/* Locale modules */
import {logger, loggerMessage, schemaValidator} from '../utils';
import {isTradeSchema, setBTCAmountSchema} from '../models';
import {LoggerLevel, StatusHttp} from '../enums';
import {setIsTrade, setCryptoAmount, getAll} from '../bin/process-env-init';

/**
 * Set isTrade param
 * @param req
 * @param res
 */
const setIsTradeParam = async (req: Request, res: Response) => {
    try {
        const {
            body
        } = req;

        await schemaValidator(isTradeSchema, body);

        setIsTrade(body.isTrade, body.coupleType);

        res.status(200).send({
            status: StatusHttp.SUCCESS,
        });

    } catch (error) {
        res.status(error.statusCode || 500).json(error.responseObject);
        logger.log(LoggerLevel.ERROR, loggerMessage({
            error,
            additionalData: error.additionalData,
        }));
    }
};

/**
 * Set crypto amount param
 * @param req
 * @param res
 */
const setCryptoAmountParam = async (req: Request, res: Response) => {
    try {
        const {
            body
        } = req;

        await schemaValidator(setBTCAmountSchema, body);

        setCryptoAmount(body.amount, body.crypto);

        res.status(200).send({
            status: StatusHttp.SUCCESS,
        });

    } catch (error) {
        res.status(error.statusCode || 500).json(error.responseObject);
        logger.log(LoggerLevel.ERROR, loggerMessage({
            error,
            additionalData: error.additionalData,
        }));
    }
};

/**
 * Get all params
 * @param req
 * @param res
 */
const getAllParams = async (req: Request, res: Response) => {
    try {
        const result = getAll();

        res.status(200).send({
            status: StatusHttp.SUCCESS,
            data: {...result},
        });

    } catch (error) {
        res.status(error.statusCode || 500).json(error.responseObject);
        logger.log(LoggerLevel.ERROR, loggerMessage({
            error,
            additionalData: error.additionalData,
        }));
    }
};

export {
    setIsTradeParam,
    setCryptoAmountParam,
    getAllParams,
}
