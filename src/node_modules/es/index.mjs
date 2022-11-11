import { stringify } from '@svizzle/utils';
import * as _ from 'lamb';

import { arxliveCopy } from 'conf/config.mjs';
import { buildRequest, makeRequest } from 'es/requests.mjs';

export const list = async domain => {
	const path = '_mappings';
	const request = buildRequest(domain, path, 'GET');
	const { body: response } = await makeRequest(request);
	return _.sort(_.keys(response));
};

/**
 * @function count
 * @description counts the number of documents for the specified domain and index.
 * @param {string} domain - domain the ElasticSearch domain.
 * @param {string} index - index index on which to count.
 * @param {Object} [options]
 * @param {boolean} [options.returnFullObject=false] - whether to return the full respose or just the count as a number.
 * @returns {Object|number} returns either the count of the number of documents or the full response for the API call.
 */
export const count = async (
	domain,
	index,
	{ returnFullObject = false } = {}
) => {
	const path = `${index}/_count`;
	const request = buildRequest(domain, path, 'GET');
	const { body: response } = await makeRequest(request);
	if (returnFullObject) {
		return response;
	}
	return response.count;

};

/**
 * @function createIndex
 * @description creates an index using the specified name and domain.
 * @param {string} name - name of index to create.
 * @param {string} domain - domain on which to create index.
 * @param {Object} [options]
 * @param {Object} [options.payload={}] - payload for request to index endpoint.
 * @returns {Object} response to the request
 */
export const createIndex = async (
	domain,
	index,
	{ payload = {} } = {}
) => {
	const path = index;
	const parsedPayload = typeof payload !== 'string' ? JSON.stringify(payload) : payload;
	const request = buildRequest(domain, path, 'PUT', { payload: parsedPayload });
	const { body: response, code } = await makeRequest(request);
	if (code !== 200) {
		if (response.error.type === 'resource_already_exists_exception') {
			console.warn('Index already exists, so was not created');
		} else {
			throw new Error(stringify(response));
		}
	}
	return response;
};

/**
 * @function deleteIndex
 * @description deletes an index using the specified name and domain. If no
 * index with specified name exists, function exits gracefully but
 * logs this to the user.
 * @param {string} name - name of index to delete.
 * @param {string} domain - domain on which to delete index.
 * @returns {Object} response to the request
 */
export const deleteIndex = async (domain, index) => {
	const path = index;
	const request = buildRequest(domain, path, 'DELETE');
	const { code } = await makeRequest(request);
	if (code === 404) {
		console.log(`index '${index}' not found, so was not deleted`);
	}
};

/**
 * @function reindex
 * @description copies data from source index to dest index on specified domain.
 * @param {string} source - name of source index from which to copy data.
 * @param {string} dest - name of destination index on which to copy data.
 * @param {string} domain - domain on which to perform reindex.
 * @param {Object} [options]
 * @param {Object} [options.payload={}] - payload for request to index endpoint.
 * @param {string} [options.pipeline=null] - name of the ingestion pipeline to include upon reindex.
 * @returns {Object} response to the request
 */
export const reindex = async (
	source,
	dest,
	domain = arxliveCopy,
	{ payload = {}, pipeline = null } = {}
) => {
	const path = '_reindex';
	const parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
	const expandedPayload = {
		...parsedPayload,
		source: {
			index: source
		},
		dest: {
			index: dest,
			pipeline,
		}
	};
	const request = buildRequest(domain, path, 'POST', { payload: JSON.stringify(expandedPayload) });
	const { code, body: response } = await makeRequest(request);
	if (code !== 200) {
		throw new Error(
			`Reindex from ${source} to ${dest} failed. Response:\n${stringify(response)}`
		);
	}
	return response;
};

/**
 * @function getMappings
 * @description gets the mappings for the specied index on the specified domain.
 * @param {string} domain - Domain from which to get mappings.
 * @param {string} index - Index from which to get mappings.
 * @returns {Object} the mappings.
 */
export const getMappings = async (domain, index) => {
	const path = `${index}/_mappings`;
	const request = buildRequest(domain, path);
	const { body: response } = await makeRequest(request);
	return response;
};

/**
 * @function updateMapping
 * @description updates the mapping on the specified domain and index.
 * @param {string} domain - domain on which to update the mappings.
 * @param {string} index - index on which to update the mappings.
 * @param {Object} [options]
 * @param {Object} [options.payload={}] - payload for request.
 * @returns {Object} response object.
 */
export const updateMapping = async (
	domain,
	index,
	{ payload } = {}
) => {
	const path = `${index}/_mappings`;
	const request = buildRequest(domain, path, 'PUT', { payload });
	const { body: response } = await makeRequest(request);
	return response;
};
