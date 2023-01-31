import { promises as fs } from 'fs';
import path from 'path';

import { stringify } from '@svizzle/utils';

import { buildRequest, makeRequest } from 'dap_dv_backends_utils/es/requests.mjs';
import { arxliveCopy } from 'dap_dv_backends_utils/conf/config.mjs';

const main = async () => {
	const payload = {
		size: 10000,
		query: {
			function_score: {
				functions: [
					{
						random_score: {
							seed: '1477072619038',
						},
					},
				],
			},
		},
	};
	const request = buildRequest(arxliveCopy, 'arxiv_v6/_search', 'POST', {
		payload,
	});
	const { body: response } = await makeRequest(request);

	const __dirname = path.dirname(process.argv[1]);
	await fs.writeFile(
		path.join(__dirname, 'data/randomSample.json'),
		stringify(response)
	);
};

await main();
