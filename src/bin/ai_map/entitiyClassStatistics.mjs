import { promises as fs } from 'fs';

import { saveObj } from '@svizzle/file';
import * as _ from 'lamb';

import { dbr } from 'dbpedia/util.mjs';

const FILE_CIELING_CONFIDENCE_VALUES = 'data/ai_map/quality/entities/cielingConfidenceValues.json';
const FILE_AVERAGE_CONFIDENCE_VALUES = 'data/ai_map/quality/entities/averageConfidenceValues.json';
const FILE_ENTITY_CLASSES = 'data/ai_map/outputs/entity_classes.json';
const FILE_CEILING_CONFIDENCE_STATS = 'data/ai_map/quality/entities/cielingConfidenceStats.json';
const FILE_AVERAGE_CONFIDENCE_STATS = 'data/ai_map/quality/entities/averageConfidenceStats.json';

const readAndReplaceWithPrefixes = async path => {
	const data = await fs.readFile(path, { encoding: 'utf-8'});
	const values = JSON.parse(
		data.replaceAll(dbr, 'dbr:')
	);
	return values;
};
const save = (path, object) => saveObj(path, 4)(object);
const addStats = (entities, all) => {
	return {
		count: entities.length,
		proportion: entities.length / all.length
	};
};

const invert = (object, func) => {
	const result = _.reduce(
		_.pairs(object),
		(acc, [key, value]) => {
			const convertedValue = func(value);
			const accumulatedValue = convertedValue in acc
				? [ ...acc[convertedValue], key]
				: [ key ];

			return {
				...acc,
				[convertedValue]: accumulatedValue
			};
		},
		{}
	);
	return result;
};

const calculateStatsofClasses = (entities, classes) => {
	const noClasses = _.filter(
		entities,
		entity => !classes[entity].length
	);
	const noRootClass = _.filter(
		entities,
		entity => !classes[entity].includes('owl:Thing')
	);

	return {
		noClasses: addStats(noClasses, entities),
		noRootClass: addStats(noRootClass, entities)
	};
};


const main = async () => {
	const {classes} = JSON.parse(
		await fs.readFile(FILE_ENTITY_CLASSES, { encoding: 'utf-8'})
	);
	const cielingConfidenceValues =
        await readAndReplaceWithPrefixes(FILE_CIELING_CONFIDENCE_VALUES);
	const averageConfidenceValues =
        await readAndReplaceWithPrefixes(FILE_AVERAGE_CONFIDENCE_VALUES);

	const cielingBuckets = invert(cielingConfidenceValues, _.identity);
	const roundToNearest10 = number => Math.ceil(number / 10) * 10;
	const averageBuckets = invert(averageConfidenceValues, roundToNearest10);

	const cielingStats = _.mapValues(
		cielingBuckets,
		bucket => calculateStatsofClasses(bucket, classes)
	);
	save(FILE_CEILING_CONFIDENCE_STATS, cielingStats);

	const averageStats = _.mapValues(
		averageBuckets,
		bucket => calculateStatsofClasses(bucket, classes)
	);
	save(FILE_AVERAGE_CONFIDENCE_STATS, averageStats);

};

await main();

