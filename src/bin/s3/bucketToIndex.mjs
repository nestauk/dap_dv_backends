import { Command, Option } from 'commander';
import * as _ from 'lamb';

import { bucketToIndex } from 'aws/s3.mjs';
import { arxliveCopy } from 'conf/config.mjs';
import { commanderParseInt } from 'util/commander.mjs';

const program = new Command();
program.option(
	'-d, --domain <domain>',
	'ES domain on which the index is held',
	arxliveCopy
);
program.option(
	'-c, --chunk-size <bytes>',
	'number of bytes to chunk with',
	commanderParseInt,
	512_000,
);
program.option(
	'-f, --id-field <field>',
	'Name of field to use as id',
	null
);
program.addOption(
	new Option('--format <format>')
	.choices(['array', 'object'])
	.default('array')
);
program.requiredOption('-i, --index <index>', 'name of index');
program.requiredOption('-b, --bucket <bucket name>', 'name of s3 bucket');
program.requiredOption('-k, --key <bucket key>', 'name of s3 key');
program.parse();

const options = program.opts();

const main = async () => {
	await bucketToIndex(
		options.index,
		options.domain,
		options.bucket,
		options.key,
		...options
	);
};

await main();
