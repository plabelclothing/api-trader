/* External modules */
import {Request, Response} from 'express';

/* Locale modules */
import {logger, loggerMessage, RabbitUtil, statisticUtil} from '../utils';
import {LoggerLevel, StatusHttp} from '../enums';

const ping = async (req: Request, res: Response) => {
    res.status(200).send('pong');
};

const telemetry = async (req: Request, res: Response) => {
    try {
        let telemetry = {
            httpCode: 200,
            status: StatusHttp.SUCCESS,
            data: {
                mysql: '',
                rabbit: '',
            },
        };

        try {
            if (!RabbitUtil.getConnection()) {
                throw new Error('Rabbit get connection isn\'t success');
            }
            telemetry.data.rabbit = 'ok';
        } catch (e) {
            telemetry.data.rabbit = 'error';
            telemetry.status = StatusHttp.FAIL;
            telemetry.httpCode = 500;
        }

        res.status(telemetry.httpCode).send({
            status: telemetry.status,
            data: {
                ...telemetry.data
            }
        });
    } catch (error) {
        res.status(error.statusCode || 500).json(error.responseObject);

        logger.log(LoggerLevel.ERROR, loggerMessage({
            error,
            additionalData: error.additionalData,
        }));

    }
};

const stats = async (req: Request, res: Response) => {
    try {
        const stats = statisticUtil.getTimeRequest();

        res.status(200).send({
            status: StatusHttp.SUCCESS,
            data: {
                ...stats
            }
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
    ping,
    telemetry,
    stats,
}
