import * as cliProgress from 'cli-progress';
import { Command } from 'commander';

import { scroll, clearScroll } from 'es/search.mjs';
import { count } from 'es/index.mjs';
import {
	annotateDocument,
	uploadAnnotatedDocument,
} from 'dbpedia/spotlight.mjs';
import { arxliveCopy } from 'conf/config.mjs';
import { promisesHandler, batch } from '../../node_modules/util.mjs';

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
program.option(
	'-f, --field <field>',
	'Field of doc to be used as input text for annotation'
);

program.parse();
const options = program.opts();

const bar = new cliProgress.SingleBar(
	{ etaBuffer: options.pageSize * 10 },
	cliProgress.Presets.shades_classic
);

const main = async () => {
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
						options.domain,
						options.index
					);
				})
			);
		}
	}
	bar.stop();
	clearScroll(options.domain);
};

main();
