'use strict';

/* External modules */
import amqpApi, {ConfirmChannel} from 'amqplib';

/* Local modules */
import config from './config';
import {logger, loggerMessage, RabbitUtil, statisticUtil, schemaValidator} from '../utils';
import {LoggerLevel, StatusCode} from '../enums';

let numOfServer = 0;
let isRestart = false;
let ignoreCloseChannel = false;
/**
 * Consumer bind
 *
 * @param channel
 */
const consumer = async function (channel: ConfirmChannel) {
    try {
        await channel.assertExchange(config.rabbitMQ.deadLetterExchange.exchange, 'direct');
        await channel.assertExchange(config.rabbitMQ.exchange, 'fanout', {
            autoDelete: false,
            durable: true
        });
        await channel.assertQueue(config.rabbitMQ.channel);
        await channel.bindQueue(config.rabbitMQ.channel, config.rabbitMQ.exchange, config.rabbitMQ.channel);
        await channel.prefetch(config.rabbitMQ.consumerPrefetch);

        await channel.assertQueue(config.rabbitMQ.deadLetterQueue.key, {arguments: {'x-dead-letter-exchange': config.rabbitMQ.exchange}});
        await channel.bindQueue(config.rabbitMQ.deadLetterQueue.key, config.rabbitMQ.deadLetterExchange.exchange, config.rabbitMQ.deadLetterQueue.key);

        logger.log(LoggerLevel.INFO, 'Connection to RabbitMQ channel succeed.');
    } catch (error) {
        logger.log(LoggerLevel.ERROR, loggerMessage({
            message: 'An error occur while executing task.',
            errorCode: StatusCode.RABBIT_SERVICE__CONN_ERR,
            error: error
        }));
        throw error;
    }

    try {
        await channel.consume(config.rabbitMQ.channel, async (message) => {
            if (!message) {
                return;
            }

            let payoutContent = null;
            try {
                payoutContent = JSON.parse(message.content.toString());
            } catch (e) {
                logger.log(LoggerLevel.ERROR, loggerMessage({
                    message: 'Delivered data are not a correct JSON string.',
                    error: e,
                    errorCode: StatusCode.RABBIT_SERVICE__TSK_ERR,
                }));
                return channel.ack(message);
            }

            if (!payoutContent.hasOwnProperty('isRefund')) {
                logger.log(LoggerLevel.ERROR, loggerMessage({
                    message: 'isRefund flag is not found.',
                    errorCode: StatusCode.RABBIT_SERVICE__TSK_ERR,
                }));
                return channel.ack(message);
            }

            // try {
            //     let schema: { [key: string]: any } = payoutSaleSchema;
            //     if (payoutContent.isRefund) {
            //         schema = payoutRefundSchema;
            //     }
            //     await schemaValidator(schema, payoutContent);
            // } catch (e) {
            //     logger.log(LoggerLevel.WARN, loggerMessage({
            //         message: 'Incorrect task content! Does not match the pattern.',
            //         errorCode: StatusCode.VALIDATION_UTIL__ERR,
            //         error: e
            //     }));
            //     return channel.ack(message);
            // }

            logger.log(LoggerLevel.VERBOSE, loggerMessage({message: 'New correct task has been received and going to be processed.'}));
            try {
                // await sendLib(payoutContent);
                channel.ack(message);
            } catch (e) {
                logger.log(LoggerLevel.ERROR, loggerMessage({
                    message: 'An error occur while executing task.',
                    errorCode: StatusCode.RABBIT_SERVICE__TSK_ERR,
                    error: e
                }));
                channel.nack(message, false, false);
            }
        }, config.rabbitMQ.consumerOptions);
    } catch (e) {
        logger.log(LoggerLevel.ERROR, loggerMessage({
            message: 'Error with get and parse message from rabbit.',
            errorCode: StatusCode.RABBIT_SERVICE__TSK_ERR,
            error: e
        }));
    }
};

/**
 * Restart connection to RabbitMQ server
 */
const restartRabbitFunc = async () => {
    isRestart = true;
    try {
        const connection = RabbitUtil.getConnection();
        if (connection) {
            await connection.close();
        }
    } catch (e) {
        logger.log(LoggerLevel.INFO, loggerMessage({
            message: 'RabbitMQ channel is empty.',
        }));
    }
    RabbitUtil.setConnection(null);
    setTimeout(() => startRabbit(), config.rabbitMQ.reconnectPeriod);
};

/**
 * Initialize connection to RabbitMQ server
 */
const startRabbit = async () => {
    if (isRestart) {
        if (numOfServer + 1 < config.rabbitMQ.connection.length) {
            numOfServer += 1;
        } else {
            numOfServer = 0;
        }
    }
    isRestart = false;
    ignoreCloseChannel = false;
    let startTime = Date.now() / 1000;
    try {
        const connection = await amqpApi.connect(config.rabbitMQ.connection[numOfServer]);

        statisticUtil.setTimeRequest((Date.now() / 1000) - startTime, 'rabbit', false);
        RabbitUtil.setConnection(connection);

        logger.log(LoggerLevel.INFO, 'Connection to RabbitMQ server succeed.');

        connection.on('error', (error) => {
            logger.log(LoggerLevel.ERROR, loggerMessage({
                message: 'Error received when connecting RabbitMQ.',
                error: error,
                errorCode: StatusCode.RABBIT_SERVICE__CONN_ERR,
            }));
        });
        connection.on('close', async () => {
            logger.log(LoggerLevel.ERROR, loggerMessage({
                message: 'Connection has been closed. Trying to reconnect.',
                errorCode: StatusCode.RABBIT_SERVICE__CONN_ERR,
            }));
            !ignoreCloseChannel && await restartRabbitFunc();
        });

        const ch = await connection.createConfirmChannel();

        ch.on('error', (error) => {
            logger.log(LoggerLevel.ERROR, loggerMessage({
                message: 'RabbitMQ channel error.',
                errorCode: StatusCode.RABBIT_SERVICE__CONN_ERR,
                error: error
            }));
        });
        ch.on('close', async () => {
            logger.log(LoggerLevel.ERROR, loggerMessage({
                message: 'RabbitMQ channel is closed.',
                errorCode: StatusCode.RABBIT_SERVICE__CONN_ERR
            }));
            !ignoreCloseChannel && await restartRabbitFunc();
        });

        RabbitUtil.setChannel(ch);
        await consumer(ch);
    } catch (e) {
        logger.log(LoggerLevel.ERROR, loggerMessage({
            message: 'Cannot connect to RabbitMQ server. Trying to reconnect.',
            error: e.message,
            errorCode: StatusCode.RABBIT_SERVICE__CONN_ERR,
        }));
        ignoreCloseChannel = true;
        await restartRabbitFunc();
    }
};

// startRabbit();
