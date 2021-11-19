'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* External modules */
const amqplib_1 = __importDefault(require("amqplib"));
/* Local modules */
const config_1 = __importDefault(require("./config"));
const libs_1 = require("../libs");
const utils_1 = require("../utils");
let numOfServer = 0;
let isRestart = false;
let ignoreCloseChannel = false;
/**
 * Consumer bind
 *
 * @param channel
 */
const consumer = async function (channel) {
    try {
        await channel.assertExchange(config_1.default.rabbitMQ.deadLetterExchange.exchange, 'direct');
        await channel.assertExchange(config_1.default.rabbitMQ.exchange, 'fanout', {
            autoDelete: false,
            durable: true
        });
        await channel.assertExchange(config_1.default.rabbitMQ.deadLetterExchange.exchangeFee, 'direct');
        await channel.assertExchange(config_1.default.rabbitMQ.exchangeFee, 'fanout', {
            autoDelete: false,
            durable: true
        });
        await channel.assertQueue(config_1.default.rabbitMQ.channel);
        await channel.bindQueue(config_1.default.rabbitMQ.channel, config_1.default.rabbitMQ.exchange, config_1.default.rabbitMQ.channel);
        await channel.prefetch(config_1.default.rabbitMQ.consumerPrefetch);
        await channel.assertQueue(config_1.default.rabbitMQ.channelFee);
        await channel.bindQueue(config_1.default.rabbitMQ.channelFee, config_1.default.rabbitMQ.exchangeFee, config_1.default.rabbitMQ.channelFee);
        await channel.prefetch(config_1.default.rabbitMQ.consumerPrefetch);
        await channel.assertQueue(config_1.default.rabbitMQ.deadLetterQueue.sell.key, { arguments: { 'x-dead-letter-exchange': config_1.default.rabbitMQ.exchange } });
        await channel.bindQueue(config_1.default.rabbitMQ.deadLetterQueue.sell.key, config_1.default.rabbitMQ.deadLetterExchange.exchange, config_1.default.rabbitMQ.deadLetterQueue.sell.key);
        await channel.assertQueue(config_1.default.rabbitMQ.deadLetterQueue.fee.key, { arguments: { 'x-dead-letter-exchange': config_1.default.rabbitMQ.exchangeFee } });
        await channel.bindQueue(config_1.default.rabbitMQ.deadLetterQueue.fee.key, config_1.default.rabbitMQ.deadLetterExchange.exchangeFee, config_1.default.rabbitMQ.deadLetterQueue.fee.key);
        utils_1.logger.log("info" /* INFO */, 'Connection to RabbitMQ channel succeed.');
    }
    catch (error) {
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            message: 'An error occur while executing task.',
            errorCode: "SRC-RABBIT-001-CNERR" /* RABBIT_SERVICE__CONN_ERR */,
            error: error
        }));
        throw error;
    }
    /** Processing sell message **/
    try {
        await channel.consume(config_1.default.rabbitMQ.channel, async (message) => {
            if (!message) {
                return;
            }
            let transactionContent = null;
            try {
                transactionContent = JSON.parse(message.content.toString());
            }
            catch (e) {
                utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
                    message: 'Delivered data are not a correct JSON string.',
                    error: e,
                    errorCode: "SRC-RABBIT-002-TSCERR" /* RABBIT_SERVICE__TSK_ERR */,
                }));
                return channel.ack(message);
            }
            utils_1.logger.log("verbose" /* VERBOSE */, utils_1.loggerMessage({ message: 'New correct task has been received and going to be processed.' }));
            try {
                await libs_1.sellCrypto(transactionContent);
                channel.ack(message);
            }
            catch (e) {
                utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
                    message: 'An error occur while executing task.',
                    errorCode: "SRC-RABBIT-002-TSCERR" /* RABBIT_SERVICE__TSK_ERR */,
                    error: e
                }));
                channel.nack(message, false, false);
            }
        }, config_1.default.rabbitMQ.consumerOptions);
    }
    catch (e) {
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            message: 'Error with get and parse message from rabbit.',
            errorCode: "SRC-RABBIT-002-TSCERR" /* RABBIT_SERVICE__TSK_ERR */,
            error: e
        }));
    }
    /** Processing fee message **/
    try {
        await channel.consume(config_1.default.rabbitMQ.channelFee, async (message) => {
            if (!message) {
                return;
            }
            let transactionContent = null;
            try {
                transactionContent = JSON.parse(message.content.toString());
            }
            catch (e) {
                utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
                    message: 'Delivered data are not a correct JSON string.',
                    error: e,
                    errorCode: "SRC-RABBIT-002-TSCERR" /* RABBIT_SERVICE__TSK_ERR */,
                }));
                return channel.ack(message);
            }
            utils_1.logger.log("verbose" /* VERBOSE */, utils_1.loggerMessage({ message: 'New correct task has been received and going to be processed.' }));
            try {
                await libs_1.sellCrypto(transactionContent);
                channel.ack(message);
            }
            catch (e) {
                utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
                    message: 'An error occur while executing task.',
                    errorCode: "SRC-RABBIT-002-TSCERR" /* RABBIT_SERVICE__TSK_ERR */,
                    error: e
                }));
                channel.nack(message, false, false);
            }
        }, config_1.default.rabbitMQ.consumerOptions);
    }
    catch (e) {
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            message: 'Error with get and parse message from rabbit.',
            errorCode: "SRC-RABBIT-002-TSCERR" /* RABBIT_SERVICE__TSK_ERR */,
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
        const connection = utils_1.RabbitUtil.getConnection();
        if (connection) {
            await connection.close();
        }
    }
    catch (e) {
        utils_1.logger.log("info" /* INFO */, utils_1.loggerMessage({
            message: 'RabbitMQ channel is empty.',
        }));
    }
    utils_1.RabbitUtil.setConnection(null);
    setTimeout(() => startRabbit(), config_1.default.rabbitMQ.reconnectPeriod);
};
/**
 * Initialize connection to RabbitMQ server
 */
const startRabbit = async () => {
    if (isRestart) {
        if (numOfServer + 1 < config_1.default.rabbitMQ.connection.length) {
            numOfServer += 1;
        }
        else {
            numOfServer = 0;
        }
    }
    isRestart = false;
    ignoreCloseChannel = false;
    let startTime = Date.now() / 1000;
    try {
        const connection = await amqplib_1.default.connect(config_1.default.rabbitMQ.connection[numOfServer]);
        utils_1.statisticUtil.setTimeRequest((Date.now() / 1000) - startTime, 'rabbit', false);
        utils_1.RabbitUtil.setConnection(connection);
        utils_1.logger.log("info" /* INFO */, 'Connection to RabbitMQ server succeed.');
        connection.on('error', (error) => {
            utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
                message: 'Error received when connecting RabbitMQ.',
                error: error,
                errorCode: "SRC-RABBIT-001-CNERR" /* RABBIT_SERVICE__CONN_ERR */,
            }));
        });
        connection.on('close', async () => {
            utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
                message: 'Connection has been closed. Trying to reconnect.',
                errorCode: "SRC-RABBIT-001-CNERR" /* RABBIT_SERVICE__CONN_ERR */,
            }));
            !ignoreCloseChannel && await restartRabbitFunc();
        });
        const ch = await connection.createConfirmChannel();
        ch.on('error', (error) => {
            utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
                message: 'RabbitMQ channel error.',
                errorCode: "SRC-RABBIT-001-CNERR" /* RABBIT_SERVICE__CONN_ERR */,
                error: error
            }));
        });
        ch.on('close', async () => {
            utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
                message: 'RabbitMQ channel is closed.',
                errorCode: "SRC-RABBIT-001-CNERR" /* RABBIT_SERVICE__CONN_ERR */
            }));
            !ignoreCloseChannel && await restartRabbitFunc();
        });
        utils_1.RabbitUtil.setChannel(ch);
        await consumer(ch);
    }
    catch (e) {
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            message: 'Cannot connect to RabbitMQ server. Trying to reconnect.',
            error: e.message,
            errorCode: "SRC-RABBIT-001-CNERR" /* RABBIT_SERVICE__CONN_ERR */,
        }));
        ignoreCloseChannel = true;
        await restartRabbitFunc();
    }
};
startRabbit();
