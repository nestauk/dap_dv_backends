import { promises as fs } from 'fs';

import { Command } from 'commander';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import * as _ from 'lamb';

import { dbr } from 'dbpedia/util.mjs';
import { bulkRequest } from 'es/bulk.mjs';
import { dump } from 'es/dump.mjs';
import * as indexAPI from 'es/index.mjs';
import { arxliveCopy } from 'conf/config.mjs';
import { remove } from 'es/pipeline.mjs';
import { batchIterate } from 'util/array.mjs';
import { commanderParseInt } from 'util/commander.mjs';

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

program
.command('download')
.description('downloads an ElasticSearch index DBpedia entities to a .csv file.')
.argument('<path>', 'path to the .csv file')
.argument('<index>', 'index name')
.argument('[domain]', 'domain where index is to be created', arxliveCopy)
.requiredOption('--source <field>', 'the source field used to generate the dbpedia entities')
.option('--threshold <confidence>', 'confidence threshold, only entities with confidence equal or above this paramater will be included', commanderParseInt)
.option('--strip-uri', 'whether to include the uri prefix in the entities generated')
.action(async (path, index, domain, options) => {

	const documents = await dump(domain, index);
	const threshold = options.threshold || 0;
	const getFilteredEntities = _.pipe([
		_.filterWith(e => e.confidence >= threshold),
		_.mapWith(e => [
			options.stripUri ? e.URI.replace(dbr, '') : e.URI,
			e.confidence
		])
	]);
	const filteredDocuments = _.map(
		documents,
		doc => {
			const { [options.source]: source, dbpedia_entities } = doc;
			const entities = getFilteredEntities(dbpedia_entities);
			return { source, entities };
		}
	);
	const csvString = stringify(
		filteredDocuments,
		{ header: true, columns: ['entities', 'source'] }
	);
	await fs.writeFile(path, csvString);

});

program.parse();
