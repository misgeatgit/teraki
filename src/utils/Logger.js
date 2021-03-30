export const logLevel = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG'
}

class Logger {
    constructor(level=logLevel.INFO) {
        this.level = level;
    }

    setLevel(level) {
        this.level = level;
    }

    info(message) {
        if (this.level === logLevel.INFO || this.level === logLevel.DEBUG) {
            console.log(`[${logLevel.INFO}] message`);
        }
    }

    warn(message) {
        if (this.level === logLevel.WARN || this.level === logLevel.DEBUG) {
            console.log(`[${logLevel.WARN}] message`);
        }

    }

    error(message) {
        if (this.level === logLevel.ERROR || this.level === logLevel.DEBUG) {
            console.log(`[${logLevel.ERROR}] message`);
        }

    }

    debug(message) {
        if (this.level === logLevel.DEBUG) {
            console.log(`[${logLevel.DEBUG}] message`);
        }

    }
}

export default const logger = new Logger();