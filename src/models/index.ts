import {ValidationConst} from '../enums';

const isTradeSchema = {
    type: 'object',
    properties: {
        isTrade: {
            type: 'boolean',
        },
        coupleType: {
            type: 'string',
            enum: ValidationConst.coupleType,
        },
    },
    required: ['isTrade', 'coupleType'],
    additionalProperties: false,
};

const setBTCAmountSchema = {
    type: 'object',
    properties: {
        amount: {
            type: 'number',
        },
        crypto: {
            type: 'string',
            enum: ValidationConst.crypto,
        },
    },
    required: ['amount', 'crypto'],
    additionalProperties: false,
}

export {
    isTradeSchema,
    setBTCAmountSchema,
}
