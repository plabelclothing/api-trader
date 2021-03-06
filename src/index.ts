import os from 'os';

import {logger, loggerMessage} from './utils';
import {LoggerLevel} from './enums';
import {setStartParams} from './bin/process-env-init';

// Log process PID
logger.log(LoggerLevel.INFO, loggerMessage({
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
                hostname: os.hostname(),
                type: os.type(),
                platform: os.platform(),
                arch: os.arch(),
                release: os.release(),
                totalMemory: os.totalmem(),
                freeMemory: os.freemem()
            }
        }
    }
}));


(async () => {
    try {
        import('./bin/server');
        await setStartParams();
        import('./bin/cron');
    } catch (e) {
        logger.log(LoggerLevel.ERROR, loggerMessage({
            message: 'Application run details.',
            error: e,
        }));
        process.exit(1);
    }
})();
