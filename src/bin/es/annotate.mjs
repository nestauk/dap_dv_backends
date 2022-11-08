import { Command } from 'commander';
import * as _ from 'lamb';
import { performance } from 'perf_hooks';

import { arxliveCopy, settings } from 'conf/config.mjs';
import { getMappings } from 'es/index.mjs';
import { register, trigger, status } from 'es/snapshot.mjs';
import {annotateIndex } from 'dbpedia/spotlight.mjs';
import { commanderParseInt } from 'util/commander.mjs';
import { dedent } from 'util/string.mjs';

const program = new Command();
program.option(
	'-d, --domain <domain>',
	'ES domain on which to annotate',
	arxliveCopy
);
program.option(
	'-i, --index <index>',
	'Index on which to annotate',
	'test'
);
program.requiredOption(
	'-s, --spotlight <endpoint>',
	'Endpoint for spotlight annotator',
);
program.requiredOption(
	'-f, --field-name <field>',
	'Field of doc to be used as input text for annotation'
);
program.option(
	'-n, --new-field-name <annotated_field_name>',
	'Name of new field to be created',
	'dbpedia_entities'
);
program.option(
	'-p, --page-size <page size>',
	'Size of page to scroll with',
	commanderParseInt,
	10000
);
program.option(
	'-b, --batch-size <batch size>',
	'Size of batch to annotate over',
	commanderParseInt,
	10
);
program.option(
	'-g, --group-size <size>',
	'Size of group of batches, usually corresponds to the number of worker nodes',
	commanderParseInt,
	4
);
program.option(
	'-z, --pages <number of pages>',
	'Number of pages to iterate over',
	'all'
);
program.option(
	'--force',
	'Force the annotation process, even if no snapshots can be created'
);
program.option(
	'--include-metadata',
	'Include metadata fields on the index',
	true
);

program.parse();
const options = program.opts();

const main = async () => {
	if (!settings.snapshotSettings && !options.force) {
		throw new Error(
			'No snapshot configuration found and force flag not supplied'
		);
	}

	const currentMapping = await getMappings(options.domain, options.index);
	if (
		options.newFieldName in currentMapping[options.index].mappings.properties &&
		!options.force
	) {
		throw new Error(
			dedent`Field already exists at index mapping, and force 
				   flag or continue flag not supplied`
		);
	}

	// const { body: snapshotStatus } = await status(options.domain);
	// if (snapshotStatus.snapshots.length !== 0) {
	// 	throw new Error(
	// 		`Can't trigger a snapshot as domain is already busy creating one`
	// 	);
	// }

	const startTime = performance.now();

	// initialize snapshot repository with given settings
	// await register(options.domain, settings.snapshotSettings.repository);
	// await trigger(
	// 	options.domain,
	// 	settings.snapshotSettings.repository,
	// 	`${options.newFieldName.toLowerCase()}-before-${Number(new Date())}`
	// );

	await annotateIndex(
		options.domain,
		options.index,
		options.spotlight,
		options.fieldName,
		options
	);

	// trigger snapshot after successful run
	// await trigger(
	// 	options.domain,
	// 	settings.snapshotSettings.repository,
	// 	`${options.newFieldName.toLowerCase()}-after-${Number(new Date())}`
	// );

	const endTime = performance.now();
	console.log(`Total time taken (in ms): ${endTime - startTime}`);
};

main();


