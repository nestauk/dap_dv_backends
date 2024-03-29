import { Command } from 'commander';

import { buildRequest, makeRequest } from 'dap_dv_backends_utils/s/requests.mjs';
import { arxliveCopy } from 'dap_dv_backends_utils/conf/config.mjs';

const program = new Command();

program
.command('query')
.description('Queries the endpoint')
.argument('<query>', 'query term')
.argument('[domain]', 'domain on which to query')
.action(async (query, domain = arxliveCopy) => {
	const path = `_search`;
	const payload = { size: 2 };
	const request = buildRequest(
		domain,
		path,
		'POST',
		JSON.stringify(payload),
		{ q: query }
	);
	await makeRequest(request, { verbose: true });
});

program.parse();
