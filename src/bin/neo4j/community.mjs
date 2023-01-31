import * as fs from 'fs';

import { stringify } from 'csv-stringify/sync';
import { Command } from 'commander';
import * as _ from 'lamb';

import { drop, project } from 'dap_dv_backends_utils/neo4j/gds.mjs';
import { stream } from 'dap_dv_backends_utils/neo4j/community.mjs';
import { commanderParseInt } from 'dap_dv_backends_utils/util/commander.mjs';

const program = new Command();
program.requiredOption(
	'--threshold <value>',
	'threshold to filter entities with',
	commanderParseInt
);

program.requiredOption('--path', 'path for outputs');
program.parse();
const options = program.opts();
const main = async () => {

	const path = `${options.path}/threshold_${options.threshold}`;
	const graphName = `${options.threshold}_entities`;

	const opts = { maxIterations: 100, includeIntermediateCommunities: true };
	await project(graphName, options.threshold);
	const { data, metadata } = await stream(graphName, opts);

	if (!fs.existsSync(path)) {
		fs.mkdirSync(path, { recursive: true });
	}
	fs.writeFileSync(`${path}/communities.csv`, stringify(data, { header: true }));
	fs.writeFileSync(`${path}/communities.json`, JSON.stringify(data, null, 2));
	fs.writeFileSync(`${path}/metadata.json`, JSON.stringify(metadata, null, 2));

	await drop(graphName);
};

main();
