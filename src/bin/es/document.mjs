import * as fs from 'fs';

import { Command } from 'commander';

import * as documentAPI from 'dap_dv_backends_utils/es/document.mjs';
import { arxliveCopy } from 'dap_dv_backends_utils/conf/config.mjs';
import { dedent } from 'dap_dv_backends_utils/util/string.mjs';

const program = new Command();

program
.command('create')
.description('creates a document')
.argument('<index>', 'index on which to create document')
.argument(
	'<path>',
	dedent`path to document(s). If more than one document, root level JSON must
         be an array of objects. If an object has a root level key of 'id',
         this will be used as the documents id on ElasticSearch`
)
.option(
	'-d, --domain <domain>',
	'domain on which to create document',
	arxliveCopy
)
.action((index, path, options) => {
	const parsed = JSON.parse(fs.readFileSync(path));
	const documents = parsed instanceof Array ? parsed : [parsed];
	documents.map(async document => {
		const { id, ...data } = document;
		await documentAPI.create(options.domain, index, data, { id });
	});
});

program.parse();
