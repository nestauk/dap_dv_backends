import * as cliProgress from 'cli-progress';
import { Command } from 'commander';

import { scroll, clearScroll } from 'es/search.mjs';
import { count, getMappings, updateMapping } from 'es/index.mjs';
import { register, trigger, status } from 'es/snapshot.mjs';
import {
	annotateDocument,
	uploadAnnotatedDocument,
} from 'dbpedia/spotlight.mjs';
import { arxliveCopy } from 'conf/config.mjs';
import { promisesHandler, batch } from '../../node_modules/util.mjs';
import { settings, defaultMapping } from 'conf/config.mjs';

const program = new Command();
program.option(
	'-d, --domain <domain>',
	'ES domain on which to annotate',
	arxliveCopy
);
program.option('-i, --index <index>', 'Index on which to annotate', 'test');
program.option(
	'-s, --spotlight <endpoint>',
	'Endpoint for spotlight annotator',
	undefined
);
program.option(
	'-p, --page-size <page size>',
	'Size of page to scroll with',
	10000
);
program.option(
	'-b, --batch-size <batch size>',
	'Size of batch to annotate over',
	10
);
program.option(
	'-z, --pages <number of pages>',
	'Number of pages to iterate over',
	'all'
);
program.requiredOption(
	'-f, --field <field>',
	'Field of doc to be used as input text for annotation'
);
program.option(
	'-n, --name <annotated_field_name>',
	'Name of new field to be created'
);
program.option(
	'--force',
	'Force the annotation process, even if no snapshots can be created'
);

program.parse();
const options = program.opts();

const bar = new cliProgress.SingleBar(
	{ etaBuffer: options.size * 10 },
	cliProgress.Presets.shades_classic
);

const main = async () => {
	if (!settings.snapshotSettings && !options.force) {
		throw new Error(
			'No snapshot configuration found and force flag not supplied'
		);
	}

	const newFieldName = options.name || `dbpedia_entities-${options.field}`;
	const currentMapping = await getMappings(options.domain, options.index);
	if (
		newFieldName in currentMapping[options.index].mappings.properties &&
		!options.force
	) {
		throw new Error(
			'Field already exists at index mapping, and force flag or continue flag not supplied'
		);
	}

	const { body: snapshotStatus } = await status(options.domain);
	if (snapshotStatus.snapshots.length !== 0) {
		throw new Error(
			`Can't trigger a snapshot as domain is already busy creating one`
		);
	}

	// initialize snapshot repository with given settings
	await register(options.domain, settings.snapshotSettings.repository);
	await trigger(
		options.domain,
		settings.snapshotSettings.repository,
		`${newFieldName.toLowerCase()}-before-${+new Date()}`
	);

	// create mapping for new field
	const mappingPayload = { properties: { [newFieldName]: defaultMapping } };
	await updateMapping(options.domain, options.index, {
		payload: mappingPayload,
	});

	const totalDocuments = await count(options.domain, options.index);
	bar.start(totalDocuments, 0);

	const scroller = scroll(options.domain, options.index, {
		size: options.pageSize,
		pages: options.pages,
	});

	for await (let page of scroller) {
		const docs = page.hits.hits;
		const batches = batch(docs, options.batchSize);

		for (const docs of batches) {
			// filter out docs with empty text
			const nonEmptyDocs = docs.filter(doc => doc._source[options.field]);
			const annotations = await promisesHandler(
				nonEmptyDocs.map(doc =>
					annotateDocument(doc, options.field, options.spotlight)
				)
			);
			await promisesHandler(
				annotations.map(doc => {
					bar.increment();
					return uploadAnnotatedDocument(
						doc.annotations,
						doc.document._id,
						newFieldName,
						options.domain,
						options.index
					);
				})
			);
		}
	}
	bar.stop();
	clearScroll(options.domain);

	// trigger snapshot after successful run
	await trigger(
		options.domain,
		settings.snapshotSettings.repository,
		`${newFieldName.toLowerCase()}-after-${+new Date()}`
	);
};

main();
