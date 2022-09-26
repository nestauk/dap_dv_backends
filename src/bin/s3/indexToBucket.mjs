import * as cliProgress from 'cli-progress';
import { Command, Option } from 'commander';
import * as _ from 'lamb';

import {
	initialiseMultiPartUpload,
	uploadPart,
	completeMultiPartUpload,
	MIN_PART_SIZE
} from 'aws/s3.mjs';
import { arxliveCopy } from 'conf/config.mjs';
import { scroll } from 'es/search.mjs';
import { count } from 'es/index.mjs';
import { commanderParseInt } from 'util/commander.mjs';
import { stringify } from '@svizzle/utils';

const program = new Command();
program.option(
	'-d, --domain <domain>',
	'ES domain on which the index is held',
	arxliveCopy
);
program.requiredOption('-i, --index <index>', 'ES index to copy');
program.requiredOption('-b, --bucket <bucket name>', 'name of s3 bucket');
program.requiredOption('-k, --key <bucket key>', 'name of s3 key');
program.option(
	'-p, --page-size <page size>',
	'Size of page to scroll with',
	commanderParseInt,
	10000
);
program.option(
	'-t, --threshold <confidence value>',
	'Threshold to filter with',
	commanderParseInt,
	0
);
program.option(
	'-n, --pages <number of pages>',
	'Number of pages to iterate',
	'all'
);
program.addOption(
	new Option('--format <format>')
	.choices(['array', 'object', 'entities'])
	.default('array')
);
program.addOption(
	new Option('--processor <processor>')
	.choices(['default', 'simple', 'es'])
	.default('default')
);

program.parse();
const options = program.opts();

const separate = (start, stop, data, page, total) => {
	let raw = JSON.stringify(data).slice(1, -1);
	if (page === 1) {
		raw = `${start}${raw}`;
	}
	if (page === total) {
		raw = `${raw}${stop}`;
	} else {
		raw = `${raw},`;
	}
	return raw;
};

const arrayFormatter = (data, page, total) => {
	return separate('[', ']', data, page, total);
};

const objectFormatter = (data, page, total, { key=null }={}) => {

	const getter = key ? _.getPath(key) : _.identity;
	const documents = _.reduce(
		data,
		(acc, doc) => {
			acc[doc._id] = getter(doc);
			return acc;
		},
		{}
	);
	return separate('{', '}', documents, page, total);
};

const entitiesFormatter = (data, page, total) =>
	objectFormatter(data, page, total, { key: '_source.dbpedia_entities' });

const extractSource = _.mapWith(_.getKey('_source'));

const extractURIandConfidence = _.mapWith(
	doc => {
		doc.dbpedia_entities = _.map(
			doc.dbpedia_entities,
			entity => ({ URI: entity.URI, confidence: entity.confidence })
		);
		return doc;
	}
);

const filterByConfidence = threshold => _.mapWith(
	doc => {
		doc._source.dbpedia_entities = _.filter(
			doc._source.dbpedia_entities || [],
			entity => entity.confidence > threshold
		);
		return doc;
	}
);

const formats = {
	array: arrayFormatter,
	object: objectFormatter,
	entities: entitiesFormatter
};

const processors = {
	es: _.identity,
	default: extractSource,
	simple: _.pipe([extractSource, extractURIandConfidence])
};

const main = async () => {

	const filter = filterByConfidence(options.threshold);
	const processor = processors[options.processor];
	const etl = _.pipe([filter, processor]);
	const formatter = formats[options.format];

	const scroller = scroll(options.domain, options.index, {
		size: options.pageSize,
		pages: options.pages
	});

	const totalDocuments = await count(options.domain, options.index);
	const totalWork = options.pages === 'all'
		? totalDocuments
		: options.pages * options.pageSize;

	const pagesNeeded = Math.floor(totalDocuments / options.pageSize) + 1;
	const pages = options.pages === 'all'
		? pagesNeeded
		: Math.min(pagesNeeded, options.pages);

	const bar = new cliProgress.SingleBar(
		cliProgress.Presets.shades_classic
	);

	const uploadId = await initialiseMultiPartUpload(options.bucket, options.key);
	bar.start(totalWork, 0);

	let partNumber = 1;
	let currentPage = 1;
	let parts = [];
	let chunk = '';

	for await (let page of scroller) {
		const data = etl(page.hits.hits);
		const raw = formatter(data, currentPage, pages);
		chunk += raw;

		// check if the chunk is large enough to upload as a part to s3
		if (Buffer.byteLength(chunk) >= MIN_PART_SIZE) {
			const ETag = await uploadPart(
				chunk, options.bucket, options.key, uploadId, partNumber
			);
			parts.push({ PartNumber: partNumber, ETag });
			partNumber++;
			chunk = '';
		}
		bar.increment(page.hits.hits.length);
		currentPage++;
	}

	// if chunk as not been reset on last iteration, there's still one last
	// upload to perform
	if (chunk.length) {
		const ETag = await uploadPart(
			chunk, options.bucket, options.key, uploadId, partNumber
		);
		parts.push({ PartNumber: partNumber, ETag });
		partNumber++;
	}
	await completeMultiPartUpload(options.bucket, options.key, parts, uploadId);
	bar.stop();
};

await main();
