import { buildRequest, makeRequest } from 'es/requests.mjs';

/**
 * @function clearScroll
 * @description clears scroll objects on an ElasticSearch domain
 * @param {string} domain - domain on which to clear the scroll object
 * @param {string} [id=null] - id of scroll object. If not supplied, the function will clear all scroll objects on the specified domain.
 * @returns {Object} response to the request made to clear the scroll.
 */
export const clearScroll = (domain, id = null) => {
	const payload = id ? { scroll_id: id } : undefined;
	const path = id ? '_search/scroll' : '_search/scroll/_all';
	const request = buildRequest(domain, path, 'DELETE', { payload });
	const { body: result } = makeRequest(request);
	return result;
};

/**
 * @function first
 * @description retrieves the first batch of documents (or first page) and the associated scroll id.
 * @param {string} domain - domain on which to scroll.
 * @param {string} index - index on which to scroll.
 * @param {number} size - size of pages, this will determine how many documents per page to return.
 * @returns {HttpResponse} the first response to the scroll API call. This response contains both the documents and the id for the scroll object which is needed for subsequent calls.
 */
const first = async (domain, index, size) => {
	const path = `${index}/_search`;
	const query = { scroll: '1h' };
	const payload = { size, sort: ['_doc'] };
	const firstRequest = buildRequest(domain, path, 'POST', {
		payload,
		query,
	});
	const { body: result } = await makeRequest(firstRequest, { retry: 5000 });
	return result;
};

/**
 * @function subsequent
 * @description function for subsequent calls to the scroll API after having first called {@link first}
 * @param {string} domain - domain on which to scroll
 * @param {string} id - id for scroll object
 * @returns {HttpResponse} response object containing the documents for the current iteration of the scroll.
 */
const subsequent = async (domain, id) => {
	const path = `_search/scroll`;
	const payload = { scroll: '1h', scroll_id: id };
	const subsequentRequest = buildRequest(domain, path, 'POST', {
		payload,
	});
	const { body: result } = await makeRequest(subsequentRequest, { retry: 5000 });
	return result;
};

/**
 * @function scroll
 * @description Generator function, returns an iterate which uses the Scroll API to iterate over huge numbers of documents (potentially all documents) on a given index.
 * @param {string} domain - domain on which to scroll.
 * @param {string} index - indeox on which to scroll
 * @param {Object} [options]
 * @param {number} [options.size=1000] - size of page - this determines how many documents are returned per iteration.
 * @param {string|number} [options.pages='all'] - number of pages to return. If not specified, the index will iterate exhaustively until all documents are returned.
 * @returns {Generator} a generator which yields HttpResponses. Each response has {@link options.size} number of documents.
 */
export async function *scroll(
	domain,
	index,
	{ size = 1000, pages = 'all' } = {}
) {

	// set limit to infinity if all to iterate all results
	const limit = pages === 'all' ? Infinity : pages;
	let next = await first(domain, index, size);
	for (
		let i = 0;
		i < limit && next.hits && next.hits.hits.length !== 0;
		i++
	) {
		yield next;
		// eslint-disable-next-line no-await-in-loop
		next = await subsequent(domain, next._scroll_id);
	}

}
