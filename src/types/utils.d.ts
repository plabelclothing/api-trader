export declare module Utils {
    export interface RabbitRequestHeaders {
        persistent: boolean,
        messageId: string,
        appId: string,
        contentType: string,
        contentEncoding: string,
        type: string,
        timestamp: number,
        expiration?: number,
    }

    export interface WaitTrxObj {
        a: number,
        p: number,
    }
}
