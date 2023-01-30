import { promises as fs } from 'fs';

import { Command } from 'commander';
import * as _ from 'lamb';

import { arxliveCopy } from 'dap_dv_backends_utils/conf/config.mjs';
import { dump } from 'dap_dv_backends_utils/es/dump.mjs';
import { commanderParseInt } from 'dap_dv_backends_utils/util/commander.mjs';

const program = new Command();
program.option(
	'-d, --domain <domain>',
	'ES domain on which to aggregate',
	arxliveCopy
);
program.option(
	'--indent <value>',
	'Whether to use an indent for the outputted JSON, and if so, how many spaces',
	commanderParseInt,
	0
);
program.requiredOption(
	'-i, --index <index>',
	'ES index on which to aggregate'
);
program.requiredOption(
	'-o, --out <path>',
	'Path to directory in which to save results.'
);

program.parse();
const options = program.opts();

const main = async () => {
	const documents = await dump(options.domain, options.index, 10000);
	await fs.writeFile(
		`${options.out}/${options.index}.json`,
		JSON.stringify(documents, null, options.indent)
	);
};

main();

/*
Usage:
node src/bin/es/dump.mjs --index ai-map --out data/ai_map/
*/
