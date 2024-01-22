import { PathLike, createWriteStream, existsSync, readFileSync } from 'fs';
import { format } from 'util';

import { LogLevel, LogType, colors, logColor } from '../util/logger.js';

import JSZip from 'jszip';

interface CbArchiverOptions {
    logLevel?: LogLevel;
}
export default class CbArchiver {
    // setup zip client
    public readZip = new JSZip();

    private logLevel = LogLevel.INFO;

    constructor({ logLevel }: CbArchiverOptions) {
        // setup config
        if (logLevel !== undefined) this.logLevel = logLevel;
    }

    private logger(logType: LogType, label: string, ...data: any[]) {
        // exit early if logLevel is set to SILENT
        if (this.logLevel === LogLevel.SILENT) return;

        // only log DEBUG when the logLevel is set to DEBUG
        if (this.logLevel !== LogLevel.DEBUG && logType === LogType.DEBUG)
            return;

        console[logType](
            logColor(logType, `[ZipArchiver:${label}]`),
            format(...data)
        );
    }

    async readArchive(filePath: PathLike) {
        this.logger(LogType.DEBUG, 'readArchive', 'Opening archive:', filePath);

        // check if file exists
        if (!existsSync(filePath)) {
            this.logger(
                LogType.ERROR,
                'readArchive',
                'File specified does not exist: %s',
                colors.yellow(filePath.toString())
            );
            throw new Error(`File specified does not exist: "${filePath}"`);
        }

        return await this.readZip.loadAsync(readFileSync(filePath));
    }

    async writeArchive(archive: JSZip, filePath: PathLike) {
        this.logger(
            LogType.DEBUG,
            'writeArchive',
            'Writing to archive: %s',
            colors.yellow(filePath.toString())
        );

        // write new avif cbz archive
        return new Promise<void>((resolve, reject) =>
            archive
                .generateNodeStream({
                    comment: 'Created by cbz-avif',
                    mimeType: 'application/vnd.comicbook+zip',
                    platform: 'UNIX',
                    streamFiles: true,
                })
                .pipe(createWriteStream(filePath))
                .on('error', reject)
                .on(
                    'finish',
                    () => (
                        this.logger(
                            LogType.INFO,
                            'writeArchive',
                            'Finished write task to archive: %s',
                            colors.yellow(filePath.toString())
                        ),
                        resolve()
                    )
                )
        );
    }
}
