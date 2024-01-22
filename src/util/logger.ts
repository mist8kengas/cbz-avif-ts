import colors from 'colors/safe.js';
export { colors };

export enum LogLevel {
    SILENT = 0,
    INFO = 1,
    DEBUG = 2,
}
export enum LogType {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
}

export function logColor(level: LogType, label: string) {
    switch (level) {
        case LogType.ERROR: {
            return colors.red(label);
        }
        case LogType.WARN: {
            return colors.yellow(label);
        }
        case LogType.INFO: {
            return colors.green(label);
        }
        case LogType.DEBUG: {
            return colors.cyan(label);
        }
        default:
            return label;
    }
}
