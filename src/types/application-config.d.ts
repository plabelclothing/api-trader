declare module ApplicationConfig {

    interface ExpressApi {
        bind: string,
        port: number,
        authorizationToken: string
    }

    interface Luxon {
        timezone: string;
    }

    interface WinstonConsole {
        level: string;
        handleExceptions: boolean;
        json: boolean;
        colorize: boolean;
    }

    interface WinstonFile {
        level: string;
        handleExceptions: boolean;
        filename: string;
        json: boolean;
        maxsize: number;
        maxFiles: number;
        colorize: boolean;
    }

    interface WinstonSentry {
        level: string;
        dsn: string;
    }

    interface WinstonTransports {
        file: {
            enabled: boolean;
        };
        console: {
            enabled: boolean;
        };
        sentry: {
            enabled: boolean;
        };
    }

    interface Winston {
        console: WinstonConsole;
        file: WinstonFile;
        sentry: WinstonSentry;
        transports: WinstonTransports;
        exitOnError: boolean;
    }

    interface RabbitMQ {
        connection: RabbitMqConnection[];
        deadLetterExchange: DeadLetterExchange;
        deadLetterQueue: DeadLetterQueue,
        finish: Finish
        channel: string;
        channelFee: string;
        exchange: string;
        exchangeFee: string;
        consumerPrefetch: number;
        consumerOptions: RabbitMqConsumerOption;
        reconnectPeriod: number
    }

    interface RabbitMqConnection {
        hostname: string;
        port: number;
        username: string;
        password: string;
        vhost: string;
    }

    interface DeadLetterQueue {
        [key: string]: {
            key: string,
            ttl: number,
        }
    }

    interface Finish {
        ttl: number,
        attempts: number,
    }

    interface DeadLetterExchange {
        exchange: string;
        exchangeFee: string;
    }

    interface RabbitMqConsumerOption {
        noAck: boolean;
        exclusive: boolean;
    }

    interface RabbitMqConsumerOption {
        noAck: boolean;
        exclusive: boolean;
    }

    interface CoinBase {
        host: string,
        key: string,
        passphrase: string,
        secret: string,
    }

    interface Trade {
        cryptoBuyAmount: { [key: string]: number },
        isTrade: { [key: string]: boolean },
        serviceFee: number,
    }

    interface Assets {
        waitTransactionFilePath: { [key: string]: string },
    }

    interface Profile {
        trade: string,
        saving: string,
    }

    export interface RootObject {
        application: string;
        applicationKey: string;
        applicationUrl: string;
        expressApi: ExpressApi;
        luxon: Luxon;
        winston: Winston;
        rabbitMQ: RabbitMQ;
        coinbase: CoinBase;
        trade: Trade;
        assets: Assets;
        profile: Profile;
    }

}
