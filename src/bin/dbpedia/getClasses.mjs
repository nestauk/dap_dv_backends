import { promises as fs } from 'fs';

import { Command, InvalidArgumentError } from 'commander';
import * as _ from 'lamb';

import { arxliveCopy } from 'conf/config.mjs';
import { getClasses } from 'dbpedia/requests.mjs';
import { getEntities } from 'es/entities.mjs';

const program = new Command();
program.option(
	'-d, --domain <domain>',
	'ES domain on which to aggregate',
	arxliveCopy
);
program.option('-i, --index <index>', 'ES index from which to get titles');
program.option('-f, --path <path>', 'Path to file containing DBpedia titles');
program.requiredOption('-o, --out <output>', 'Path of output file');

program.parse();
const options = program.opts();

const main = async () => {
	if (!options.index && !options.path) {
		throw new InvalidArgumentError(`
            You must specify either the index containing the DBpedia entities 
            or a path to the file containing the entities\' titles`
		);
	}
	if (options.index && options.path) {
		throw new InvalidArgumentError(`
            Ambigous input. Do you want to use the index or the file as input?`
		);
	}

	// previous checks garauntee the following:
	const titles = options.index
		? await getEntities(options.index)
		: JSON.parse(await fs.readFile(options.path));

	const sample=titles.slice(100, 110);
	console.log(sample);
	console.log(await getClasses(sample, { depth: 10, squash: true, fullURI:true }));

};

main();
