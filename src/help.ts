export default function help(basic = false) {
    if (basic)
        return console.log(
            [
                'Usage:',
                'cbz-avif-ts [command] [options]',
                '',
                'Commands:',
                '- help (show the help menu)',
                '- convert (convert normal .cbz file to AVIF .cbz file -- see help for more information)',
            ].join('\n')
        );

    console.log(
        [
            '',
            'Usage:',
            'cbz-avif-ts [command] [options]',
            '',
            '',
            'Command: convert',
            '',
            'Usage:',
            'cbz-avif-ts convert -i input.cbz',
            '',
            'Arguments:',
            '-s, --silent (silent mode -- do not output any logs)',
            '-v, --verbose (verbose log mode)',
            '',
            '-i, --input (input .cbz file path)',
            '-o, --output (output .cbz file path -- by default, this will output to the same path as --input)',
            '',
        ].join('\n')
    );
}
