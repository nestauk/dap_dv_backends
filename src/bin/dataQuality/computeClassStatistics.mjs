import { promises as fs } from 'fs';
import * as path from 'path';

import { saveObj } from '@svizzle/file';
import { Command  } from 'commander';
import * as _ from 'lamb';

import { dbr } from 'dbpedia/util.mjs';

const program = new Command();

program.requiredOption('-i, --input <path>', 'Path to file containing DBpedia titles');
program.requiredOption('-o, --output <output>', 'Path to output directory');

program.parse();
const options = program.opts();

const FILE_ENTITY_CLASSES = options.input;
const FILE_CEILING_CONFIDENCE_VALUES = path.join(options.output, 'ceilingConfidenceValues.json');
const FILE_AVERAGE_CONFIDENCE_VALUES = path.join(options.output, 'averageConfidenceValues.json');
const FILE_CEILING_CONFIDENCE_STATS = path.join(options.output, 'ceilingConfidenceStats.json');
const FILE_AVERAGE_CONFIDENCE_STATS = path.join(options.output, 'averageConfidenceStats.json');

const readAndReplaceWithPrefixes = async path_ => {
	const data = await fs.readFile(path_, { encoding: 'utf-8'});
	const values = JSON.parse(
		data.replaceAll(dbr, 'dbr:')
	);
	return values;
};
const save = (path_, object) => saveObj(path_, 4)(object);
const addStats = (entities, all) => {
	return {
		count: entities.length,
		proportion: entities.length / all.length
	};
};

const invert = object => _.reduce(
	_.pairs(object),
	(acc, [k, v]) => ({...acc, [v]: v in acc ? [...acc[v], k] : [k]}),
	{}
);

const mapValuesAndInvert = (object, func) => {
	const values = _.mapValues(object, func);
	const inverted =  invert(values);
	return inverted;
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
	const ceilingConfidenceValues =
        await readAndReplaceWithPrefixes(FILE_CEILING_CONFIDENCE_VALUES);
	const averageConfidenceValues =
        await readAndReplaceWithPrefixes(FILE_AVERAGE_CONFIDENCE_VALUES);

	const ceilingBuckets = mapValuesAndInvert(ceilingConfidenceValues, _.identity);
	const roundToNearest10 = number => Math.ceil(number / 10) * 10;
	const averageBuckets = mapValuesAndInvert(averageConfidenceValues, roundToNearest10);

	const ceilingStats = _.mapValues(
		ceilingBuckets,
		bucket => calculateStatsofClasses(bucket, classes)
	);
	save(FILE_CEILING_CONFIDENCE_STATS, ceilingStats);

	const averageStats = _.mapValues(
		averageBuckets,
		bucket => calculateStatsofClasses(bucket, classes)
	);
	save(FILE_AVERAGE_CONFIDENCE_STATS, averageStats);

};

await main();

