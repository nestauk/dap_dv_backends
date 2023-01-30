import { Command } from 'commander';
import * as _ from 'lamb';

import { arxliveCopy } from 'dap_dv_backends_utils/conf/config.mjs';
import { getEntityAbstract } from 'dap_dv_backends_utils/dbpedia/requests.mjs';
import { bulkRequest } from 'dap_dv_backends_utils/es/bulk.mjs';
import { getEntities } from 'dap_dv_backends_utils/es/entities.mjs';
import { createIndex } from 'dap_dv_backends_utils/es/index.mjs';
import { batchIterate, batchIterateFlatten } from 'dap_dv_backends_utils/util/array.mjs';

const program = new Command();

program
.command('extract')
.description('Creates an index where each document is an entity extracted from the set of all entities previously annotated in the input index')
.argument('<Input index>', 'Input index name')
.argument('<Output index>', 'Output index name (doesn\'t have to exist)')
.argument('[domain]', 'domain on which to create index', arxliveCopy)
.action(async (inputIndex, outputIndex, domain) => {
	const entities = await getEntities(inputIndex, domain);
	await createIndex(outputIndex, domain);
	const abstracts = await batchIterateFlatten(
		entities,
		getEntityAbstract,
		{ batchSize: 100 }
	);
	const payloads = _.map(
		abstracts,
		abstract => ({ "_id": abstract.URI, data: abstract })
	);
	await batchIterate(
		payloads,
		payload => bulkRequest(domain, outputIndex, payload, 'create'),
		{ batchSize: 100 }
	);
});

program.parse();
