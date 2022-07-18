import { stringify } from '@svizzle/utils';

import { arxliveCopy } from 'conf/config.mjs';
import { buildRequest, makeRequest } from 'es/requests.mjs';

export const query = async (query_, index, domain=arxliveCopy) => {
	const path = `${index}/_search`;
	const payload = query_;
	const request = buildRequest(
		domain,
		path,
		'POST',
		payload
	);
	const { body: response, code } = await makeRequest(request, { verbose: true });

	if (code !== 200) {
		throw new Error(`Query failed with response ${stringify(response)}`);
	}

	return response;
};
