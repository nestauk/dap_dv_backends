import { arxliveCopy } from 'conf/config.mjs';
import { buildRequest, makeRequest } from 'es/requests.mjs';

/**
 *
 * @param {string} name - name of pipeline in url parsable form.
 * @param {string} description - description of pipeline.
 * @param {Array<Object>} processors - list of processors for pipeline.
 * @param {string} domain - domain on which to put pipeline.
 * @returns {Object} response object.
 */
const generic = (name, description, processors, domain) => {
	const path = `_ingest/pipeline/${name}`;
	const payload = { description, processors };

	const request = buildRequest(domain, path, 'PUT', { payload });
	return makeRequest(request);
};

/**
 *
 * @param {Array<string>} fields - list of fields to remove upon ingestion.
 * @param {string} domain - domain on which to put pipeline.
 * @returns {string} name of created pipeline
 */
export const remove = async (fields, domain = arxliveCopy) => {
	const description = `Remove ${fields.join(' ')}`;
	const name = `remove-${fields.join('-')}`;
	const processors = [
		{
			remove: {
				field: fields,
				ignore_failure: true,
			},
		},
	];
	const response = await generic(name, description, processors, domain);
	if (response.code === 200) {
		return name;
	}
	throw new Error(
		`Failed to create remove pipeline. Response:\n${response}`
	);

};
