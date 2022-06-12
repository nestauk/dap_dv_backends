import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import * as cliProgress from 'cli-progress';
import { Command, CommanderError } from 'commander';
import * as _ from 'lamb';

import { arxliveCopy } from 'conf/config.mjs';
import { scroll } from 'es/search.mjs';
import { count } from 'es/index.mjs';
import { commanderParseInt } from 'util/commander.mjs';

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
	'-n, --pages <number of pages>',
	'Number of pages to iterate',
	'all'
);

program.parse();
const options = program.opts();

const config = {
	credentials: defaultProvider(),
	region: 'eu-west-2',
};
const client = new S3Client(config);

const main = async () => {
	const create = new CreateMultipartUploadCommand({
		Bucket: options.bucket,
		Key: options.key
	});
	const { UploadId } = await client.send(create);

	const scroller = scroll(options.domain, options.index, {
		size: options.pageSize,
		pages: options.pages
	});

	const bar = new cliProgress.SingleBar(
		cliProgress.Presets.shades_classic
	);
	const totalDocuments = await count(options.domain, options.index);
	const totalWork = options.pages === 'all'
		? totalDocuments
		: options.pages * options.pageSize;
	const pages = options.pages === 'all'
		? Math.floor(totalDocuments / options.pages)
		: Math.floor(Math.min(totalDocuments, options.pages * options.pageSize) / options.pages);

	bar.start(totalWork, 0);

	let PartNumber = 1;
	let Parts = [];

	for await (let page of scroller) {
		const data = page.hits.hits;
		let raw = JSON.stringify(data).slice(1, -1);
		if (PartNumber === 1) {
			raw = `[${raw},`;
		} else if (PartNumber === pages) {
			raw = `${raw}]`;
		} else {
			raw = `${raw},`;
		}

		const upload = new UploadPartCommand({
			Body: raw,
			Bucket: options.bucket,
			Key: options.key,
			UploadId,
			PartNumber
		});
		const { ETag } = await client.send(upload);
		Parts.push({ PartNumber, ETag });
		PartNumber++;
		bar.increment(options.pageSize);
	}

	bar.stop();

	const complete = new CompleteMultipartUploadCommand({
		Bucket: options.bucket,
		Key: options.key,
		MultipartUpload: { Parts },
		UploadId
	});
	const completeResponse = await client.send(complete);
	console.log(completeResponse);

};

await main();
