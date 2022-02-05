import { annotate, parseAnnotationResults } from 'dbpedia/spotlight.mjs';
import { scroll, clearScroll } from 'es/search.mjs';
import { count } from 'es/index.mjs';
import { update } from 'es/update.mjs';
import * as cliProgress from 'cli-progress';
import { Command } from 'commander';

import { logger } from '../../node_modules/logging.mjs';
import { arxliveCopy } from 'conf/config.mjs';

const confidenceValues = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

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
program.parse();
const options = program.opts();

// progress bar
const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
let currentDocumentCount = 0;

const processHit = async hit => {
	currentDocumentCount++;
	bar.update(currentDocumentCount);
	try {
		if ('dbpedia_entities' in hit._source) {
			logger.verbose('skipping', hit);
			return Promise.resolve();
		}
		const spotlightResults = await Promise.all(
			confidenceValues.map(confidence =>
				annotate(hit._source.textBody_abstract_article, confidence, {
					endpoint: options.spotlight,
				})
			)
		);
		const spotlightTerms = spotlightResults.map(parseAnnotationResults);
		return update(options.domain, options.index, hit._id, {
			dbpedia_entities: spotlightTerms,
		});
	} catch (error) {
		logger.error(`Could not annotate ${hit._id}`, error);
	}
};

const main = async () => {
	const totalDocuments = await count(options.domain, options.index);
	bar.start(totalDocuments, 0);

	const scroller = scroll(options.domain, options.index, {
		size: options.size,
		pages: options.pages,
	});

	for await (let page of scroller) {
		await Promise.all(page.hits.hits.map(processHit));
	}
	bar.stop();
	clearScroll(options.domain);
};

main(options);
