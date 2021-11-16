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
const os_1 = __importDefault(require("os"));
const utils_1 = require("./utils");
const process_env_init_1 = require("./bin/process-env-init");
// Log process PID
utils_1.logger.log("info" /* INFO */, utils_1.loggerMessage({
    message: 'Application run details.',
    additionalData: {
        applicationDetails: {
            pid: process.pid,
            runPath: process.execPath,
            argv: process.argv,
            mainModule: __filename,
            title: process.title,
            version: process.version,
            versions: process.versions,
            os: {
                hostname: os_1.default.hostname(),
                type: os_1.default.type(),
                platform: os_1.default.platform(),
                arch: os_1.default.arch(),
                release: os_1.default.release(),
                totalMemory: os_1.default.totalmem(),
                freeMemory: os_1.default.freemem()
            }
        }
    }
}));
(async () => {
    try {
        Promise.resolve().then(() => __importStar(require('./bin/server')));
        await process_env_init_1.setStartParams();
        Promise.resolve().then(() => __importStar(require('./bin/cron')));
    }
    catch (e) {
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            message: 'Application run details.',
            error: e,
        }));
        process.exit(1);
    }
})();
