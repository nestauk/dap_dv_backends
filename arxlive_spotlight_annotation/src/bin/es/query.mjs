import { Command } from 'commander';

import { buildRequest, makeRequest } from 'es/requests.mjs';
import { arxliveCopy } from 'conf/config.mjs';

const program = new Command();

program
	.command('query')
	.description('Queries the endpoint')
	.argument('<query>', 'query term')
	.argument('[domain]', 'domain on which to register snapshot')
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
		console.log(request);
		await makeRequest(request, { verbose: true });
	});

program.parse();
