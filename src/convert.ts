import path from 'path';

import { args as Args } from './index.js';
import { LogLevel } from './util/logger.js';

import AvifTransformer from './lib/AvifTransformer.js';
import CbArchiver from './lib/CbArchiver.js';
import JSZip from 'jszip';

export default async function convert(args: typeof Args) {
    const {
        // input/output options
        input = null,
        output = null,

        // log type
        verbose = false,
        silent = false,
    } = args.values;

    if (!input)
        throw new Error(
            'Input must be defined (see help command for more information)'
        );
    const inputPath = path.parse(input);
    const defaultOutput = path.join(
        inputPath.dir,
        path.format({
            name: inputPath.name + '-avif',
            ext: inputPath.ext,
        })
    );
    const parsedOutput = output || defaultOutput;

    const logLevel = silent
        ? LogLevel.SILENT
        : verbose
        ? LogLevel.DEBUG
        : LogLevel.INFO;

    const avifTransformer = new AvifTransformer({ logLevel });

    // setup zip client / archiver
    const writeZip = new JSZip();
    const cbArchiver = new CbArchiver({ logLevel });

    // open and extract cbz file
    const archive = await cbArchiver.readArchive(input);
    const archiveEntries = new Map(
        Object.entries(archive.files).map(([name, fileObject]) => [
            name,
            fileObject.nodeStream('nodebuffer'),
        ])
    );

    const avifImages = await avifTransformer.bulkTransform(
        archiveEntries,
        true
    );
    avifImages.forEach((buffer, fileName) => {
        // add image to avif cbz archive
        writeZip.file(fileName, buffer);
    });

    // write new avif cbz archive
    await cbArchiver.writeArchive(writeZip, parsedOutput);
}
