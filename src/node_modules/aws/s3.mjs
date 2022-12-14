import {
	S3Client,
	GetObjectCommand,
	GetObjectAttributesCommand,
	CreateMultipartUploadCommand,
	UploadPartCommand,
	CompleteMultipartUploadCommand,
	HeadBucketCommand,
	HeadObjectCommand,
	GetBucketAclCommand,
	PutObjectCommand
} from '@aws-sdk/client-s3';
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import * as cliProgress from 'cli-progress';

import * as _ from 'lamb';

import { bulkRequest } from 'es/bulk.mjs';
import { scroll } from 'es/search.mjs';
import { count, createIndex } from 'es/index.mjs';


// https://docs.aws.amazon.com/AmazonS3/latest/userguide/qfacts.html
export const MIN_PART_SIZE = 5242880;

const config = {
	credentials: defaultProvider(),
	region: 'eu-west-2',
};
const client = new S3Client(config);

const parseMost = (chunk, type) => {
	const [ start, end ] = type === 'object' ? ['{', '}'] : ['[', ']'];
	for (let i = chunk.length - 1; i >= 0; i--) {
		if (chunk[i] === ',' || chunk[i] === end) {
			const test = `${start}${_.slice(chunk, 0, i).join('')}${end}`;
			try {
				const documents = JSON.parse(test);
				const leftover = _.slice(chunk, i+1, chunk.length).join('');
				return { documents, leftover };
			} catch {}
		}
	}
	return { documents: null, leftover: chunk };
};

const getObject = (bucket, key, { start=0, end=-1 }={}) => {
	return new Promise(async (resolve, error) => {
		const get = new GetObjectCommand({
			Bucket: bucket,
			Key: key,
			Range: `bytes=${start}-${end}`
		});
		const { Body, ContentLength } = await client.send(get);
		const finished = end === -1 || ContentLength < end - start;
		const data = [];
		Body.on('error', err => error(err));
		Body.on('data', chunk => data.push(chunk));
		Body.on('end', () => resolve({data: data.join(''), finished}));
	});
};

const getObjectAttributes = async(
	bucket,
	key,
	attributeList=['ETag', 'Checksum', 'ObjectParts', 'StorageClass',  'ObjectSize']
) => {
	const get = new GetObjectAttributesCommand({
		Bucket: bucket,
		Key: key,
		ObjectAttributes: attributeList
	});
	const attributes = await client.send(get);
	return attributes;
};

async function *stream(
	bucket,
	key,
	type,
	{ increment=512_000 }={}
) {
	let current = 0;
	let chunk, finished;
	let data = '';

	// check at very beginning that types match up
	const { data: first } = await getObject(
		bucket, key, { start: 0, end: 0 }
	);
	if (
		first === '{' && type !== 'object' ||
		first === '[' && type !== 'array' ||
		first !== '{' && first !== '[') {
		throw new Error(
			`Type errror. Are you sure the bucket object\'s type is correct?`
		);
	}

	const { ObjectSize: size } = await getObjectAttributes(bucket, key);
	const bar = new cliProgress.SingleBar(cliProgress.Presets.shades_classic);
	bar.start(size, 0);
	do {

		// always omit first byte, as we know it's either '{' or '['
		// eslint-disable-next-line no-await-in-loop
		({ data: chunk, finished } = await getObject(
			bucket, key, { start: current+1, end: current + increment }
		));
		data += chunk;
		const { documents, leftover } = parseMost(data, type);
		if (documents) {
			yield documents;
			data = leftover;
		}
		current += increment;
		bar.update(current);
	} while (!finished);
	bar.update(size);
	bar.stop();
}

export const streamObject = (
	bucket,
	key,
	{ increment=64_000 }={}
) => stream(bucket, key, 'object', { increment });

export const streamArray = (
	bucket,
	key,
	{ increment=64_000 }={}
) => stream(bucket, key, 'array', { increment });

export const initialiseMultiPartUpload = async (bucket, key) => {
	const create = new CreateMultipartUploadCommand({
		Bucket: bucket,
		Key: key
	});
	const { UploadId: uploadId } = await client.send(create);
	return uploadId;
};

export const uploadPart = async (
	data,
	bucket,
	key,
	uploadId,
	partNumber
) => {
	const upload = new UploadPartCommand({
		Body: data,
		Bucket: bucket,
		Key: key,
		UploadId: uploadId,
		PartNumber: partNumber
	});

	const { ETag } = await client.send(upload);
	return ETag;
};

export const completeMultiPartUpload = async (
	bucket,
	key,
	parts,
	uploadId
) => {
	const complete = new CompleteMultipartUploadCommand({
		Bucket: bucket,
		Key: key,
		MultipartUpload: { Parts: parts },
		UploadId: uploadId
	});
	const completeResponse = await client.send(complete);
	return completeResponse;
};


export const bucketToIndex = async (
	index,
	domain,
	bucket,
	key,
	{
		idField=null,
		format='array',
		chunkSize=8_388_608, // 8MB,
		refresh=false
	}={}
) => {

	let count_ = 0;
	const method = idField ? 'create' : 'index';
	const formatObject = _.pipe([
		_.pairs,
		_.mapWith(([k, value]) => ({ _id: k, data: { value } }))
	]);
	const formatArray = _.mapWith(
		({ [idField]: id, ...rest }) => ({
			...id && {_id: id},
			data: rest
		})
	);
	const funcs = {
		object: [streamObject, formatObject],
		array: [streamArray, formatArray]
	};

	await createIndex(domain, index);
	const [stream_, formatter] = funcs[format];
	const streamer = stream_(
		bucket,
		key,
		{ increment: chunkSize }
	);

	for await (let docs of streamer) {
		const bulkFormat = formatter(docs);
		await bulkRequest(
			domain,
			index,
			bulkFormat,
			method,
			{ refresh }
		);
		count_ += docs.length;
	}
	return count_;
};

/* Index to Bucket Specific Functions */

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
			acc[doc.id] = getter(doc);
			return acc;
		},
		{}
	);
	return separate('{', '}', documents, page, total);
};

const entitiesFormatter = (data, page, total) =>
	objectFormatter(data, page, total, { key: 'dbpedia_entities' });

const extractSource = _.mapWith(doc => ({ id: doc._id,  ...doc._source }));

const extractURIandConfidence = _.mapWith(
	doc => {
		doc.dbpedia_entities = _.map(
			doc.dbpedia_entities || [],
			entity => ({ URI: entity.URI, confidence: entity.confidence })
		);
		return doc;
	}
);

const filterByConfidence = threshold => _.mapWith(
	doc => {
		if (doc._source.dbpedia_entities) {
			doc._source.dbpedia_entities = _.filter(
				doc._source.dbpedia_entities || [],
				entity => entity.confidence > threshold
			);
		}
		return doc;
	}
);

export const indexToBucket = async(
	index,
	domain,
	bucket,
	key,
	{
		threshold=0,
		pages='all',
		pageSize=10000,
		format='array',
		processor='default'
	}={}
) => {

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

	const filter = filterByConfidence(threshold);
	const processor_ = processors[processor];
	const etl = _.pipe([filter, processor_]);
	const formatter = formats[format];

	const scroller = scroll(domain, index, {
		pages,
		size: pageSize,
	});

	const totalDocuments = await count(domain, index);
	const totalWork = pages === 'all'
		? totalDocuments
		: pages * pageSize;

	const pagesNeeded = Math.floor(totalDocuments / pageSize) + 1;
	const pages_ = pages === 'all'
		? pagesNeeded
		: Math.min(pagesNeeded, pages);

	const bar = new cliProgress.SingleBar(
		cliProgress.Presets.shades_classic
	);

	const uploadId = await initialiseMultiPartUpload(bucket, key);
	bar.start(totalWork, 0);

	let partNumber = 1;
	let currentPage = 1;
	let parts = [];
	let chunk = '';

	for await (let page of scroller) {

		const data = etl(page.hits.hits);
		const raw = formatter(data, currentPage, pages_);
		chunk += raw;

		// check if the chunk is large enough to upload as a part to s3
		if (Buffer.byteLength(chunk) >= MIN_PART_SIZE) {
			const ETag = await uploadPart(
				chunk, bucket, key, uploadId, partNumber
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
			chunk, bucket, key, uploadId, partNumber
		);
		parts.push({ PartNumber: partNumber, ETag });
		partNumber++;
	}
	await completeMultiPartUpload(bucket, key, parts, uploadId);
	bar.stop();
};

export const headBucket = async bucket => {
	const command = new HeadBucketCommand({ Bucket: bucket });
	const response = await client.send(command);
	return response;
};

export const headObject = async (bucket, key) => {
	const command = new HeadObjectCommand({ Key: key, Bucket: bucket });
	const response = await client.send(command);
	return response;
};

export const bucketACL = async bucket => {
	const command = new GetBucketAclCommand({ Bucket: bucket });
	const response = await client.send(command);
	return response;
};

export const putObject = async (bucket, key, data) => {
	const command = new PutObjectCommand({
		Bucket: bucket,
		Key: key,
		body: data
	});
	const response = await client.send(command);
	return response;
};
