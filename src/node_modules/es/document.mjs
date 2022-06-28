import { stringify } from '@svizzle/utils';

import { buildRequest, makeRequest } from 'es/requests.mjs';

/**
 * @function create
 * @description creates a document on an ES index.
 * @param {string} domain - domain on which to create the document.
 * @param {string} index - index on which to create the document.
 * @param {Object} doc - an object containing the new fields and properties that constitute the update.
 * @param {Object} [options={}]
 * @param {string} [options.id=''] - id of document (if empty, ElasticSearch creates one for you).
 * @returns {HttpResponse} response of the update reqeuest.
 */
export const create = async (domain, index, doc, { id = '', checkStatus=true} = {}) => {
	const path = `${index}/_doc/${encodeURIComponent(id)}`;
	const payload = doc;
	const request = buildRequest(domain, path, 'POST', { payload });
	const { body: response, code } = await makeRequest(request);
	if (!checkStatus) {
		return { response, code };
	}
	if (parseInt(code / 200, 10) !== 1) {
		console.log(response);
		throw Error(
			`Creating document failed at ${domain}/${index} for document\n${JSON.stringify(doc, null, 2)}`
		);
	}
	return response;
};

/**
 *
 * @param {string} domain - domain on which to retrieve document
 * @param {string} index - index on which to retrieve document
 * @param {string} id - id of document to retrieve
 * @param {Object} [options={}]
 * @param {boolean} [options.source=false] - whether to return just the source of the document
 * @returns {Object} an ElasticSearch document
*/
export const get = async (domain, index, id, { source=false } = {}) => {
	const path = `${index}/_doc/${id}`;
	const request = buildRequest(domain, path, 'GET');
	const { body: response, code } = await makeRequest(request);
	if (code !== 200) {
		console.log(response);
		throw Error(`Getting document for ${id} failed with response \n${stringify(response)}`);
	}
	if (source) {
		return response._source;
	}
	return response;
};
