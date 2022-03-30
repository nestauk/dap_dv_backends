import * as fs from 'fs';

import { Command } from 'commander';

import * as indexAPI from 'es/index.mjs';
import { arxliveCopy } from 'conf/config.mjs';

const program = new Command();

program
	.command('create')
	.description('creates an index')
	.argument('<index>', 'index name')
	.argument('[domain]', 'domain on which to create index', arxliveCopy)
	.option('-p, --path <path>', 'path to payload for settings', null)
	.action(async (index, domain, options) => {
		const payload = options.path
			? JSON.parse(fs.readFileSync(options.path))
			: {};
		await indexAPI.createIndex(index, domain, { payload });
	});

program
	.command('delete')
	.description('deletes an index')
	.argument('<index>', 'index name')
	.argument('[domain]', 'domain where index is hosted', arxliveCopy)
	.action(async (index, domain) => await indexAPI.deleteIndex(index, domain));

program
	.command('reindex')
	.description('copies one index to another')
	.argument('<source>', 'source index')
	.argument('<dest>', 'destination index')
	.argument('[domain]', 'domain where index is hosted', arxliveCopy)
	.option('--max-docs <docs>', 'number of documents to copy', 'all')
	.action(async (source, dest, domain, options) => {
		const payload =
			options.maxDocs === 'all' ? {} : { max_docs: options.maxDocs };
		await indexAPI.reindex(source, dest, domain, {
			payload,
		});
	});

program.parse();
