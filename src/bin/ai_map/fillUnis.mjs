import { promises as fs } from 'fs';

import * as _ from 'lamb';
import { Presets, SingleBar } from 'cli-progress';
import { parse } from 'csv-parse/sync';

import { search } from 'bing/search.mjs';

const bar = new SingleBar(Presets.rect);

const FILE_SOURCE = 'data/ai_map/inputs/ai_map_data.csv';
const FILE_POPULATED = './data/ai_map/outputs/ai_map_orgs_universities.json';

const main = async () => {

	const raw = await fs.readFile(FILE_SOURCE);
	const data = parse(raw, { columns: true, });
	const universities = _.filter(data, row => row['University / RTO'] === '1.0');

	bar.start(universities.length, 0);
	const found = [];

	// loop needed to avoid rate limiting issues
	for (const org of universities) {
		const query = `"${org.Name}"`;
		// eslint-disable-next-line no-await-in-loop
		const searchResults = await search(query);
		const [ topResult ] = searchResults.webPages.value;
		found.push({
			name: org.Name,
			url: topResult.url,
			description: topResult.snippet
		});
		bar.increment();
	}
	bar.stop();

	await fs.writeFile(FILE_POPULATED, JSON.stringify(found, null, 4));
};

main();
