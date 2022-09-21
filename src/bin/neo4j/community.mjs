import * as fs from 'fs';

import { stringify } from 'csv-stringify/sync';
import { Command, Option } from 'commander';
import * as _ from 'lamb';

import { drop, project } from 'neo4j/gds.mjs';
import { stream, getMetadata, histogram } from 'neo4j/community.mjs';
import { commanderParseInt } from 'util/commander.mjs';

const program = new Command();
program.requiredOption(
	'--threshold <value>',
	'threshold to filter entities with',
	commanderParseInt
);

program.requiredOption('--path <path>', 'path for outputs');
program.addOption(
	new Option('--file <type>', 'type of output file')
	.choices(['csv', 'json', 'both'])
	.default('both')
);
program.parse();
const options = program.opts();

const main = async () => {

	const path = `${options.path}/threshold_${options.threshold}`;
	const graphName = `${options.threshold}_entities`;

	const opts = { maxIterations: 100, includeIntermediateCommunities: true };

	await project(graphName, options.threshold);
	const data = await stream(graphName, opts);
	const metadata = getMetadata(data);
	const hists = histogram(data);

	if (!fs.existsSync(path)) {
		fs.mkdirSync(path, { recursive: true });
	}
	if (options.file === 'csv' || options.file === 'both') {
		fs.writeFileSync(
			`${path}/communities.csv`,
			stringify(data, { header: true })
		);
	}
	if (options.file === 'json' || options.file === 'both') {
		fs.writeFileSync(
			`${path}/communities.json`,
			JSON.stringify(data, null, 2)
		);
	}
	fs.writeFileSync(
		`${path}/metadata.json`,
		JSON.stringify({ "histograms": hists, metadata }, null, 2)
	);

	await drop(graphName);
};

main();
