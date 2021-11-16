"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
/* Locale modules */
const statistic_util_1 = require("./statistic-util");
const config_1 = __importDefault(require("../bin/config"));
let channel = null;
let connection = null;
const RabbitUtil = function () {
};
exports.RabbitUtil = RabbitUtil;
RabbitUtil.setChannel = (ch) => {
    channel = ch;
};
RabbitUtil.getChannel = () => {
    return channel;
};
RabbitUtil.setConnection = (cn) => {
    connection = cn;
};
RabbitUtil.getConnection = () => {
    return connection;
};
RabbitUtil.sendToRabbit = (message, delayData) => {
    return new Promise((resolve, reject) => {
        try {
            if (!channel) {
                throw new Error('Rabbit channel is not exist');
            }
            let rabbitExchange = config_1.default.rabbitMQ.exchange;
            let rabbitChannel = config_1.default.rabbitMQ.channel;
            const reqHeaders = {
                persistent: true,
                messageId: uuid_1.v4(),
                appId: config_1.default.applicationKey,
                contentType: 'application/json',
                contentEncoding: 'UTF-8',
                type: rabbitChannel,
                timestamp: new Date().getTime()
            };
            if (delayData) {
                const { delay, routingKey } = delayData;
                reqHeaders.expiration = delay;
                rabbitExchange = config_1.default.rabbitMQ.deadLetterExchange.exchange;
                rabbitChannel = routingKey;
            }
            try {
                channel.publish(rabbitExchange, rabbitChannel, Buffer.from(JSON.stringify(message)), reqHeaders, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    delayData && statistic_util_1.statisticUtil.setDelayedMessage();
                    return resolve(true);
                });
            }
            catch (e) {
                reject(e);
            }
        }
        catch (e) {
            return reject(e);
        }
    });
};
