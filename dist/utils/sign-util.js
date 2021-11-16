"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signUtil = void 0;
/** Core modules **/
const crypto = __importStar(require("crypto"));
/** Locale modules **/
const config_1 = __importDefault(require("../bin/config"));
/**
 * Create sign string
 * @param timestamp
 * @param requestPath
 * @param body
 * @param method
 */
const signUtil = (timestamp, requestPath, body, method) => {
    try {
        let message = timestamp + method + requestPath;
        if (body) {
            message += JSON.stringify(body);
        }
        const key = Buffer.from(config_1.default.coinbase.secret, 'base64');
        const hmac = crypto.createHmac('sha256', key);
        const sign = hmac.update(message).digest('base64');
        return sign;
    }
    catch (e) {
        throw e;
    }
};
exports.signUtil = signUtil;
