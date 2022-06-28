import { SingleBar, Presets } from 'cli-progress';
import * as _ from 'lamb';

import { count } from 'es/index.mjs';
import { scroll, clearScroll } from 'es/search.mjs';

/**
 * @param {string} domain - domain on from which to dump data
 * @param {string} index - index from which to dump data
 * @param {number} size size of scroll object - how many documents to fetch in a single reqeust. Maximum value is 10k
 * @returns {Object} list of all documents on that index.
 */
export const dump = async(domain, index, size) => {
	const bar = new SingleBar(
		{ etaBuffer: size * 10 },
		Presets.rect
	);
	const totalDocuments = await count(domain, index);

	bar.start(totalDocuments, 0);

	const scroller = scroll(domain, index, {
		size,
		pages: 'all'
	});

	// mutation required due to await
	let documents = [];
	for await (let page of scroller) {
		documents.push(
			..._.map(page.hits.hits, doc => {
				bar.increment();
				return doc._source;
			})
		);
	}

	bar.stop();

	clearScroll(domain);

	return documents;
};
