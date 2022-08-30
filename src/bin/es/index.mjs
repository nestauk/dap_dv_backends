import { promises as fs } from 'fs';

import * as cliProgress from 'cli-progress';
import { Command } from 'commander';
import { parse } from 'csv-parse/sync';
import * as _ from 'lamb';

import { bulkRequest } from 'es/bulk.mjs';
import * as indexAPI from 'es/index.mjs';
import { arxliveCopy } from 'conf/config.mjs';
import { remove } from 'es/pipeline.mjs';
import { batchIterate } from 'util/array.mjs';
import { commanderParseInt } from 'util/commander.mjs';
import { TrackingOptions } from '@aws-sdk/client-ses';

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
.action((index, domain) => indexAPI.deleteIndex(index, domain));

program
.command('reindex')
.description('copies one index to another')
.argument('<source>', 'source index')
.argument('<dest>', 'destination index')
.argument('[domain]', 'domain where index is hosted', arxliveCopy)
.option(
	'--ignore <fields...>',
	'fields to ignore upon reindex. These fields will not be copied over to the new index.'
)
.option('--max-docs <docs>', 'number of documents to copy', 'all')
.option('--proceed-on-conflict', 'whether to proceed on conflict or abort')
.action(async (source, dest, domain, options) => {
	const pipeline = options.ignore ? await remove(options.ignore) : null;
	const payload = {
		...options.maxDocs !== 'all' && {
			max_docs: parseInt(options.maxDocs, 10),
		},
		...options.proceedOnConflict && { conflicts: 'proceed' },
	};
	await indexAPI.reindex(source, dest, domain, {
		payload,
		pipeline,
	});
});

program
.command('csv')
.description('uploads a csv to an ES index. The entire .csv is read into memory, so will not work for massive .csv files')
.argument('<path>', 'path to the .csv file')
.argument('<index>', 'index name')
.argument('[domain]', 'domain where index is to be created', arxliveCopy)
.option(
	'--id <id field>',
	'name of field/column to use as id, defalts to first field',
	null
)
.option(
	'--batch-size <size>',
	'size of batches of rows to upload',
	commanderParseInt,
	100
)
.action(async (path, index, domain, options) => {
	const raw = await fs.readFile(path);
	const data = parse(raw, { columns: true });
	const columns = _.keys(data[0]);
	const idColumn = options.id || columns[0];

	const bulkFormat = _.map(
		data,
		row => {
			const { [idColumn]: _id, ...rest } = row;
			return { _id, data: rest };
		}
	);
	const upload = batch => bulkRequest(domain, index, batch, 'create');
	batchIterate(bulkFormat, upload, { batchSize: options.batchSize });
});

program.parse();
