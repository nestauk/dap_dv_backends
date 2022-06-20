import { promises as fs } from 'fs';

import { Command, InvalidArgumentError } from 'commander';
import * as _ from 'lamb';

import { stringify } from '@svizzle/utils';
import { arxliveCopy } from 'conf/config.mjs';
import { getClasses } from 'dbpedia/requests.mjs';
import { dbo, dbr, owl } from 'dbpedia/util.mjs';
import { getEntities } from 'es/entities.mjs';
import { batchIterate } from 'util/array.mjs';
import { saveObj } from '@svizzle/file';

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

	const results = await batchIterate(
		titles,
		batch => getClasses(batch, { fullURI: true, squash: false }),
		{ concat: false }
	);
	const classes = _.reduce(results, (acc, curr) => ({...acc, ...curr}));
	const classesWithPrefix = JSON.parse(
		stringify(classes)
		.replaceAll(dbr, 'dbr:')
		.replaceAll(dbo, 'dbo:')
		.replaceAll(owl, 'owl:')
	);
	const sortedClasses = _.mapValues(
		classesWithPrefix,
		_.sortWith([_.getKey('depth')])
	);
	const sortedAndSquashedClasses = _.mapValues(
		sortedClasses,
		_.mapWith(_.getKey('class_'))
	);
	const save = (path, object) => saveObj(path, 4)(object);
	save(
		options.out,
		{
			prefixes: { dbo, dbr, owl },
			classes: sortedAndSquashedClasses
		}
	);
};

main();
