import { promises as fs } from 'fs';
import path from 'path';

import * as _ from 'lamb';

import { confidenceValues } from 'conf/config.mjs';
import { arrayMax } from '@svizzle/utils';

const flattenBucketsWithKeys = buckets => {
	const confidenceValuesAsStrings = _.map(confidenceValues, val =>
		val.toFixed(1)
	);
	const flattened = _.map(confidenceValuesAsStrings, val =>
		val in buckets ? buckets[val] : 0
	);
	return flattened;
};

const bucketByMaxConfidence = sample => {
	// reduce nested complexity, map each doc to array of confidences
	const docsWithEntities = _.filter(
		sample.hits.hits,
		val => 'dbpedia_entities' in val._source
	);

	const confidencesByDocument = _.map(docsWithEntities, val =>
		_.map(val._source.dbpedia_entities, entity => entity.confidence)
	);
	const maxPerDocument = _.map(confidencesByDocument, arrayMax);
	const buckets = _.reduce(
		maxPerDocument,
		(prev, curr) => ({
			...prev,
			[curr]: curr in prev ? prev[curr] + 1 : 0,
		}),
		{}
	);
	const flattened = flattenBucketsWithKeys(buckets);
	return flattened;
};

const main = async () => {
	// actual
	const aggregationResult = JSON.parse(
		await fs.readFile('./aggs/bucketByMaxConfidence/response.json', 'utf-8')
	);
	const accumulator = (prev, curr) => {
		return { ...prev, [curr.key]: curr.doc_count };
	};
	const bucketsWithKeys = _.reduce(
		aggregationResult.aggregations.max_confidence.buckets,
		accumulator,
		{}
	);
	const buckets = flattenBucketsWithKeys(bucketsWithKeys);
	const totalDocs = _.reduce(buckets, (p, v) => p + v, 0);

	// sampled
	const __dirname = path.dirname(process.argv[1]);
	const randomSample = JSON.parse(
		await fs.readFile(path.join(__dirname, 'data/randomSample.json'))
	);

	const sampleBuckets = bucketByMaxConfidence(randomSample);
	const expectedBuckets = _.map(
		sampleBuckets,
		v => v * (totalDocs / randomSample.hits.hits.length)
	);
	const differences = _.map(
		_.zip(buckets, expectedBuckets),
		([a, b]) => (a - b) * (a - b) / b
	);
	console.log(differences);
	console.log(_.zip(buckets, expectedBuckets));
};


await main();
