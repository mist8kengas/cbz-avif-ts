import { parseArgs } from 'util';

import help from './help.js';
import convert from './convert.js';

// command arguments
export const args = parseArgs({
    allowPositionals: true,
    options: {
        silent: {
            type: 'boolean',
            short: 's',
        },
        verbose: {
            type: 'boolean',
            short: 'v',
        },
        input: { type: 'string', short: 'i' },
        output: { type: 'string', short: 'o' },
    },
    strict: true,
});

enum Command {
    Help = 'help',
    Convert = 'convert',
}
switch (args.positionals[0]) {
    default: {
        help(true);
        break;
    }
    case Command.Help: {
        help();
        break;
    }
    case Command.Convert: {
        try {
            await convert(args);
            process.exit(0);
        } catch (error) {
            if (args.values.silent === true) process.exit(1);
            console.error(error);
        }
        break;
    }
}
