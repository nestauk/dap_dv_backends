import { stringify } from '@svizzle/utils';
import * as _ from 'lamb';

import { buildRequest, makeRequest } from 'es/requests.mjs';

/**
 * @function update
 * @description update a document on an ES index.
 * @param {string} domain - domain on which to update.
 * @param {string} index - index on which to update.
 * @param {string} id - id of document to update.
 * @param {Object} doc - an object containing the new fields and properties that constitute the update.
 * @returns {HttpResponse} response of the update reqeuest.
 */
export const update = async (
	domain,
	index,
	id,
	doc,
	payloadOptions={},
	query={},
	{ checkStatus=true } = {}
) => {
	const path = `${index}/_update/${encodeURIComponent(id)}`;
	const payload = { ...payloadOptions, doc };
	const request = buildRequest(domain, path, 'POST', { payload, query });
	const { body: response, code } = await makeRequest(request);

	if (!checkStatus) {
		return { response, code };
	}

	if (code !== 200) {
		throw Error(
			`Update failed at ${domain}/${index} for document with ID: ${id}.
			Response:\n${stringify(response)}`
		);
	}

	return response;
};
