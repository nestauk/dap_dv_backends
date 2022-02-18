import * as cliProgress from 'cli-progress';
import { Command } from 'commander';

import { scroll, clearScroll } from 'es/search.mjs';
import { count } from 'es/index.mjs';
import {
	annotateDocument,
	uploadAnnotatedDocument,
} from 'dbpedia/spotlight.mjs';
import { arxliveCopy } from 'conf/config.mjs';
import { promisesHandler } from '../../node_modules/util.mjs';

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
program.option('-p, --size <size>', 'Size of page to scroll with', 100);
program.option(
	'-z, --pages <number_of_pages>',
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
	{ etaBuffer: options.size * 10 },
	cliProgress.Presets.shades_classic
);

const main = async () => {
	const totalDocuments = await count(options.domain, options.index);
	bar.start(totalDocuments, 0);

	const scroller = scroll(options.domain, options.index, {
		size: options.size,
		pages: options.pages,
	});

	for await (let page of scroller) {
		const docs = page.hits.hits;
		const annotations = await promisesHandler(
			docs.map(doc =>
				annotateDocument(doc, options.field, options.spotlight)
			)
		);

		const settled = await promisesHandler(
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
	bar.stop();
	clearScroll(options.domain);
};

main(options);
