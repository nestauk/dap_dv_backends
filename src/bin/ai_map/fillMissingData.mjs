import { promises as fs } from 'fs';

import * as _ from 'lamb';
import { Presets, SingleBar } from 'cli-progress';

import { search } from 'bing/search.mjs';

const bar = new SingleBar(Presets.rect);

const FILE_SOURCE = 'data/ai_map/inputs/ai_map_orgs_places.json';
const FILE_SUBSET = './data/ai_map/outputs/ai_map_orgs_places_populated_subset.json';
const FILE_POPULATED = './data/ai_map/outputs/ai_map_orgs_places_populated.json';

const main = async () => {
	const data = JSON.parse(await fs.readFile(FILE_SOURCE));
	const [ filled, missing ] = _.partition(data.orgs, org => org.url && org.description);
	const found = [];

	bar.start(missing.length, 0);

	// loop needed to avoid rate limiting issues
	for (const org of missing) {
		const query = `"${org.name}"`;
		// eslint-disable-next-line no-await-in-loop
		const searchResults = await search(query);
		const [ topResult ] = searchResults.webPages.value;
		found.push({
			...org,
			url: org.url ? org.url :  topResult.url,
			description: org.description ? org.description : topResult.snippet
		});
		bar.increment();
	}
	bar.stop();
	const filledData = {
		...data,
		orgs: [ ...filled, ...found ]
	};
	await fs.writeFile(FILE_SUBSET, JSON.stringify(found, null, 4));
	await fs.writeFile(FILE_POPULATED, JSON.stringify(filledData, null, 4));
};

main();
