import { stringify } from '@svizzle/utils';
import * as _ from 'lamb';

import { buildRequest, makeRequest } from 'es/requests.mjs';
import { logger } from 'logging/logging.mjs';

const generateBulkPayload = (method, index) => _.pipe([
	_.flatMapWith(doc =>
		[
			{ [method]: {
				...doc._id && { "_id": doc._id },
				"_index": index
			} },
			method === 'update' ? { doc: doc.data } : doc.data
		]
	),
	_.reduceWith((acc, curr) => `${acc}\n${JSON.stringify(curr)}`, ''),
	json => `${json}\n`
]);

/**
 * @function bulkRequest
 * @description creates multiple documents on an ES index in one request.
 * @param {string} domain - domain on which to update.
 * @param {string} index - index     on which to update.
 * @param {Object[]} documents - list of documents, where each object has an id
 * key and a data key. The data key is the document intended to be created.
 * @param {string} method - the method to use (create, update, delete, etc.)
 * @returns {HttpResponse} response of the update reqeuest.
 */
export const bulkRequest = async (
	domain,
	index,
	documents,
	method,
	{ error=true, refresh=false }={}
) => {
	const path = `${index}/_bulk`;
	const generate = generateBulkPayload(method, index);
	const payload = generate(documents);

	// if payload is empty, no docs were supplied to the function
	if (!payload.trim()) {
		console.log("Payload empty");
		return { response: "Payload empty", code: 204 };
	}
	const request = buildRequest(
		domain, path, 'POST',
		{ payload, contentType: 'application/x-ndjson', query: { refresh } }
	);
	const { body: response, code } = await makeRequest(request);
	if (response.error) {
		if (error) {
			throw new Error(stringify(response));
		} else {
			logger.error(stringify(response));
		}
	}
	return { response, code };
};
