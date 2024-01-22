import path from 'path';
import { format } from 'util';

import { LogLevel, LogType, logColor, colors } from '../util/logger.js';

import sharp, { AvifOptions } from 'sharp';
import { Presets, SingleBar } from 'cli-progress';

interface AvifTransformerOptions {
    logLevel?: LogLevel;
    sharpAvifConfig?: AvifOptions;
}
export default class AvifTransformer {
    private logLevel = LogLevel.INFO;

    /**
     *
     * @description Default options for the `sharp` library
     *  to convert images to AVIF format
     */
    private avifOptions: AvifOptions = {
        // use yuv444 subsampling
        chromaSubsampling: '4:4:4',
        effort: 4,
        force: true,
        lossless: false,
        quality: 70,
    };

    constructor({ logLevel, sharpAvifConfig }: AvifTransformerOptions) {
        // setup config
        if (logLevel !== undefined) this.logLevel = logLevel;
        if (sharpAvifConfig !== undefined) this.avifOptions = sharpAvifConfig;
    }

    private logger(logType: LogType, label: string, ...data: any[]) {
        // exit early if logLevel is set to SILENT
        if (this.logLevel === LogLevel.SILENT) return;

        // only log DEBUG when the logLevel is set to DEBUG
        if (this.logLevel !== LogLevel.DEBUG && logType === LogType.DEBUG)
            return;

        console[logType](
            logColor(logType, `[AvifTransformer:${label}]`),
            format(...data)
        );
    }

    /**
     *
     * @description Transform a filename to use the `.avif` file extension
     * @param name Filename (excluding or including its own file extension)
     * @returns Filename + .avif
     */
    private toAvifFileName(fileName: string) {
        this.logger(
            LogType.DEBUG,
            'toAvifFileName',
            'Adding AVIF extension to file: %s',
            colors.yellow(fileName)
        );

        return path.format({
            name: path.parse(fileName).name,
            ext: 'avif',
        });
    }

    /**
     *
     * @description Create a `sharp` AVIF transformation pipeline
     * @param stream Readable stream of source image
     * @returns `sharp` pipeline
     */
    async transformStream(
        stream: NodeJS.ReadableStream
    ): Promise<{ buffer: Buffer; info: sharp.OutputInfo }> {
        // create sharp pipeline
        const pipeline = sharp();

        // encode avif image
        stream.pipe(pipeline);
        pipeline.avif(this.avifOptions);

        return new Promise((resolve, reject) =>
            pipeline.toBuffer((error, buffer, info) => {
                if (error) return reject(error);
                this.logger(
                    LogType.DEBUG,
                    'transformStream',
                    'Created image pipeline: %o',
                    { info, options: this.avifOptions }
                );
                resolve({ buffer, info });
            })
        );
    }

    /**
     *
     * @description Bulk `this.transformStream()`
     * @param inputImages A `Map` object of input images
     * @param asAvifFileNames Transform input filenames to ones with the `.avif` file extension
     * @returns A `Map` object of the output images
     */
    async bulkTransform(
        inputImages: Map<string, NodeJS.ReadableStream>,
        asAvifFileNames = false
    ) {
        this.logger(
            LogType.INFO,
            'bulkTransform',
            `Transforming %d images...`,
            inputImages.size
        );

        // progress bars are cool
        const progress = new SingleBar(
            {
                emptyOnZero: true,
                forceRedraw: true,
                format: `${colors.gray(
                    '[AvifTransformer:{label}]'
                )} ${colors.green(
                    '{bar}'
                )} {percentage}% ({value}/{total}) | ETA: {eta}s`,
                gracefulExit: true,
                hideCursor: true,
                linewrap: true,
            },
            Presets.shades_grey
        );
        if (this.logLevel === LogLevel.INFO)
            progress.start(inputImages.size, 0, {
                label: 'bulkTransform',
            });

        const outputImages = new Map<string, Buffer>();
        for (const [name, stream] of inputImages) {
            this.logger(
                LogType.DEBUG,
                'bulkTransform',
                'Transforming image: %s',
                colors.yellow(name)
            );

            outputImages.set(
                asAvifFileNames ? this.toAvifFileName(name) : name,
                (await this.transformStream(stream)).buffer
            );

            // increment progress bar
            if (this.logLevel === LogLevel.INFO) progress.increment();
        }

        // stop the progress bar
        progress.stop();

        this.logger(
            LogType.DEBUG,
            'bulkTransform',
            `Finished transforming %d images`,
            outputImages.size
        );

        return outputImages;
    }
}
