/* External modules */
import {Connection, ConfirmChannel} from 'amqplib';
import {v4} from 'uuid';

/* Locale modules */
import {statisticUtil} from './statistic-util';
import config from '../bin/config';
import {Utils} from '../types/utils';

let channel: ConfirmChannel | null = null;
let connection: Connection | null = null;

const RabbitUtil = function () {
};

RabbitUtil.setChannel = (ch: ConfirmChannel | null) => {
    channel = ch;
};

RabbitUtil.getChannel = () => {
    return channel;
};

RabbitUtil.setConnection = (cn: Connection | null) => {
    connection = cn;
};

RabbitUtil.getConnection = () => {
    return connection;
};

RabbitUtil.sendToRabbit = (message: { [key: string]: any }, delayData: { delay: number, routingKey: string } | null, isFee: boolean) => {
    return new Promise((resolve, reject) => {
        try {
            if (!channel) {
                throw new Error('Rabbit channel is not exist');
            }

            let rabbitExchange = isFee ? config.rabbitMQ.exchangeFee : config.rabbitMQ.exchange;
            let rabbitChannel = isFee ? config.rabbitMQ.channelFee : config.rabbitMQ.channel;

            const reqHeaders: Utils.RabbitRequestHeaders = {
                persistent: true,
                messageId: v4(),
                appId: config.applicationKey,
                contentType: 'application/json',
                contentEncoding: 'UTF-8',
                type: rabbitChannel,
                timestamp: new Date().getTime()
            };


            if (delayData) {
                const {
                    delay,
                    routingKey
                } = delayData;

                reqHeaders.expiration = delay;
                rabbitExchange = isFee ? config.rabbitMQ.deadLetterExchange.exchangeFee : config.rabbitMQ.deadLetterExchange.exchange;
                rabbitChannel = routingKey;
            }

            try {
                channel.publish(
                    rabbitExchange,
                    rabbitChannel,
                    Buffer.from(JSON.stringify(message)),
                    reqHeaders,
                    (error) => {
                        if (error) {
                            return reject(error);
                        }
                        delayData && statisticUtil.setDelayedMessage();
                        return resolve(true);
                    }
                )
            } catch (e) {
                reject(e);
            }
        } catch (e) {
            return reject(e);
        }
    })
};

export {
    RabbitUtil,
}
