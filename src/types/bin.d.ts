export declare module Bin {
    export interface ProcessTradeConst {
        CRYPTO_BUY_AMOUNT: { [key: string]: number },
        IS_TRADE: IsTrade,
        BTC_MIN_AMOUNT: number,
        EXT_SERVICE_FEE: number,
        SERVICE_FEE: number,
        ACCOUNTS_ID: { [key: string]: string },
    }

    interface IsTrade {
        BTC_EUR: boolean,
        BTC_USD: boolean,
    }
}
