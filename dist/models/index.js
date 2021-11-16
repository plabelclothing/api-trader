"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBTCAmountSchema = exports.isTradeSchema = void 0;
const enums_1 = require("../enums");
const isTradeSchema = {
    type: 'object',
    properties: {
        isTrade: {
            type: 'boolean',
        },
        coupleType: {
            type: 'string',
            enum: enums_1.ValidationConst.coupleType,
        },
    },
    required: ['isTrade', 'coupleType'],
    additionalProperties: false,
};
exports.isTradeSchema = isTradeSchema;
const setBTCAmountSchema = {
    type: 'object',
    properties: {
        amount: {
            type: 'number',
        },
        crypto: {
            type: 'string',
            enum: enums_1.ValidationConst.crypto,
        },
    },
    required: ['amount', 'crypto'],
    additionalProperties: false,
};
exports.setBTCAmountSchema = setBTCAmountSchema;
