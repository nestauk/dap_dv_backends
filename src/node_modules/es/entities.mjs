import * as _ from 'lamb';

import { arxliveCopy } from 'conf/config.mjs';
import { dbr } from 'dbpedia/util.mjs';
import { scroll, clearScroll } from 'es/search.mjs';

// titles are the Wiki pages with whitepace replaced with underscores, so
// World War 1 => World_War_1
// We use this terminology to stay consistent with Wikimedia's API, where the
// this parameter is also named title.
// https://api.wikimedia.org/wiki/API_reference/Core/Pages/Get_page
export const getEntities = async(
	index,
	domain=arxliveCopy,
	{ asTitle=true } = {}
) => {

	const scroller = scroll(domain, index, { size: 10000, });
	const uriCounts = {};
	let page;
	for await (page of scroller) {
		_.forEach(page.hits.hits, doc => {
			_.forEach(doc._source.dbpedia_entities, ({ URI }) => {
				const key = asTitle
					? URI.replace(dbr, '')
					: URI;
				uriCounts[key] = uriCounts[key] ? uriCounts[key] + 1 : 1;
			});
		});
	}
	if (page) {
		clearScroll(domain, page._scroll_id);
	}
	const entities = _.keys(uriCounts);
	return entities;
};

/**
 * @function getAllConfidenceLevels
 * @description counts the different confidence values found for every unique entity on a given ES index.
 * @param {string} index Index on which to count confidence levels
 * @param {string} domain Domain on which the index sits
 * @returns { Object.<string, number[]> } an object where keys are the unique
 * entity URIs and values are an array of confidence values found for that entity.
 */
export const getAllConfidenceLevels = async(
	index,
	domain=arxliveCopy
) => {
	const scroller = scroll(domain, index, { size: 10000, });
	const confidenceCounts = {};
	let page;
	for await (page of scroller) {
		const entities = _.flatMap(
			page.hits.hits,
			_.getPath('_source.dbpedia_entities')
		);
		_.forEach(
			entities,
			({ URI, confidence }) => {
				confidenceCounts[URI] = URI in confidenceCounts
					? [ ...confidenceCounts[URI], confidence ]
					: [ confidence ];
			}
		);
	}
	if (page) {
		clearScroll(domain, page._scroll_id);
	}
	return confidenceCounts;
};
