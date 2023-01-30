import { createWriteStream } from 'fs';

import { Presets, SingleBar } from 'cli-progress';
import { Command } from 'commander';
import { stringify } from 'csv-stringify/sync';
import * as _ from 'lamb';

import { arxliveCopy } from 'dap_dv_backends_utils/conf/config.mjs';
import { count } from 'dap_dv_backends_utils/es/index.mjs';
import { scroll, clearScroll } from 'dap_dv_backends_utils/es/search.mjs';

const program = new Command();

program
.command('csv')
.description('Creates a csv from an ES index representing a DBpedia entities graph.')
.argument('<inputIndex>', 'Input index name')
.argument('<outputPath>', 'Path to output the csv.')
.argument('[domain]', 'domain on which to create index', arxliveCopy)
.action(async (index, path, domain) => {
	const writer = createWriteStream(path);
	const scroller = scroll(domain, index, { size: 1000, });
	const total = await count(domain, index);
	const bar = new SingleBar(Presets.rect);

	const headers = ['sourceNode', 'abstractNode', 'confidence'];
	writer.write(stringify([headers]));
	bar.start(total, 0);

	let page;
	for await (page of scroller) {
		const nodes = _.flatMap(
			page.hits.hits,
			({ _source: doc }) => {
			    const edges = _.map(
				    doc.dbpedia_entities || [],
				    entity => [doc.URI, entity.URI, entity.confidence]
			    );
			    return edges;
			}
		);
		bar.increment(page.hits.hits.length);
		writer.write(stringify(nodes));
	}
	if (page) {
		clearScroll(domain, page._scroll_id);
	}
	bar.stop();
});

program.parse();
