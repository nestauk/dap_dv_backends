import { Command, Option } from 'commander';
import * as _ from 'lamb';

import { streamArray, streamObject } from 'aws/s3.mjs';
import { arxliveCopy } from 'conf/config.mjs';
import { bulkRequest } from 'es/bulk.mjs';
import { createIndex } from 'es/index.mjs';
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
	commanderParseInt
);
program.addOption(
	new Option('--format <format>')
	.choices(['array', 'object'])
	.default('object')
);
program.requiredOption('-i, --index <index>', 'name of index');
program.requiredOption('-b, --bucket <bucket name>', 'name of s3 bucket');
program.requiredOption('-k, --key <bucket key>', 'name of s3 key');
program.parse();

const options = program.opts();
const formatObject = _.pipe([
	_.pairs,
	_.mapWith(([key, value]) => ({ _id: key, data: { value } }))
]);
const formatArray = _.mapWith(
	({ id, ...rest }) => ({ _id: id, data: rest })
);

const funcs = {
	'object': [streamObject, formatObject],
	'array': [streamArray, formatArray]
};

const main = async () => {

	await createIndex(options.index, options.domain);
	const [stream, formatter] = funcs[options.format];
	const streamer = stream(
		options.bucket,
		options.key,
		{ increment: options.chunkSize }
	);

	for await (let docs of streamer) {
		const bulkFormat = formatter(docs);
		await bulkRequest(
			options.domain,
			options.index,
			bulkFormat,
			'create'
		);
	}
};

await main();
