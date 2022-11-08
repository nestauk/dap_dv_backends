import * as _ from 'lamb';

import { headObject, putObject } from 'aws/s3.mjs';
import { info } from 'es/domain.mjs';
import { count, getMappings, list } from 'es/index.mjs';

import codes from './error.mjs';
import { buildS3Uri } from './util.mjs';


/* S3 Checks */
const objectAccessible = async (bucket, key) => {
	const uri = buildS3Uri(bucket, key);
	try {
		await headObject(bucket, key);
		return { error: false };
	} catch (err) {
		switch (err.$metadata.httpStatusCode) {
			case 301:
				return {
					error: `Input object at ${uri} seems to be in the wrong region. Please place your bucket in eu-west-2.`,
					code: codes.S3_WRONG_REGION
				};
			case 403:
				return {
					error: `Can't read input object at ${uri}. Are you sure it can be publicly accessed?`,
					code: codes.S3_READ_ACCESS
				};
			case 404:
				return {
					error: `Can't find input object at ${uri}. Please ensure it exists.`,
					code: codes.S3_NOT_FOUND
				};
			default:
				return {
					error: 'S3 Bucket read access: Uknown error. Please check logs.',
					code: codes.S3_READ_UNKNOWN
				};
		}
	}
};

const bucketWritable = async (bucket, key) => {
	const uri = buildS3Uri(bucket, key);
	const data = { "test": "data" };
	try {
		await putObject(bucket, key, data);
		return { error: false };
	} catch (err) {
		switch (err.$metadata.httpStatusCode) {
			case 403:
				return {
					error: `Access denied: output object at ${uri} is not writable. Please change permissions and try again.`,
					code: codes.S3_WRITE_ACCESS
				};
			default:
				return {
					error: 'S3 Bucket write access: Uknown error. Please check logs.',
					code: codes.S3_WRITE_UNKNOWN
				};
		}
	}
};

const outputBucketAlreadyExists = async (bucket, key) => {
	if (await objectAccessible(bucket, key)) {
		return {
			error: `Object already exists at ${uri}. Please ensure that you're not overwriting an existing S3 object.`,
			code: codes.S3_OBJECT_EXISTS
		};
	}
	return { error: false };
};

export const checkS3 = async (inBucket, inKey, outBucket, outKey) => {
	const readCheck = await objectAccessible(inBucket, inKey);
	if (readCheck.error) {
		return readCheck;
	}
	const overwriteCheck = await outputBucketAlreadyExists(outBucket, outKey);
	if (overwriteCheck.error) {
		return overwriteCheck;
	}
	const writeCheck = await bucketWritable(outBucket, outKey);
	if (writeCheck.error) {
		return writeCheck;
	}
	return { error: false };
};

export const checkES = async (domain, index, field) => {
	try {
	    await info(domain);
	} catch (err) {
		switch (err.errno) {
			case -3008:
				return {
					error: 'Supplied domain could not be found',
					code: codes.ES_DOMAIN_NOT_FOUND
				};
			default:
				return {
					error: 'Unknown domain error. Please check logs.',
					message: err.message,
					code: codes.ES_DOMAIN_UNKOWN
				};
		}
	}
	const indices = await list(domain);
	if (!indices.includes(index)) {
		return {
			error: 'Supplied Index could not be found on that domain',
			code:codes.ES_EMPTY_INDEX
		};
	}
	const mapping = await getMappings(domain, index);
	const { properties } = mapping[index].mappings;
	if (!(field in properties)) {
		return {
			error: 'Supplied field to be annotated is not in the ES index.',
			code: codes.ES_FIELD_NOT_FOUND
		};
	}
	const {type} = properties[field];
	if (type !== 'text') {
		return {
			error: `Supplied field to be annotated must be of type 'text'. Instead it is of type '${type}'.`,
			code: codes.ES_WRONG_TYPE
		};
	}
	const documentCount = await count(domain, index);
	if (documentCount === 0) {
		return {
			error: `Supplied index has no documents to annotate.`,
			code:codes.ES_EMPTY_INDEX
		};
	}
	return { error: false };
};
