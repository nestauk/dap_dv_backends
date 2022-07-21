import { isNotNil, mergeObjects } from '@svizzle/utils';
import * as cliProgress from 'cli-progress';
import * as _ from 'lamb';

const _batch = (arr, batchSize) => {
	return arr.map((val, i) => {
		if (i % batchSize === 0) {
			return arr.slice(i, i + batchSize);
		}
		return null;
	});
};

export const batch = _.pipe([_batch, _.filterWith(isNotNil)]);

export const batchIterate = async(iterable, func, options={}) => {
	const { batchSize=100 } = options;

	const bar = new cliProgress.Bar(null, cliProgress.Presets.rect);
	bar.start(iterable.length, 0);
	const batches = batch(iterable, batchSize);
	let results = [];
	for (const batch_ of batches) {
		// eslint-disable-next-line no-await-in-loop
		const result = await func(batch_);
		results = [...results, result];
		bar.increment(batch_.length);
	}

	bar.stop();
	return results;
};

export const batchIterateFlatten = async(iterable, func, options) => {
	const results = await batchIterate(iterable, func, options);
	return _.shallowFlatten(results);
};

export const batchIterateMerge = async(iterable, func, options) => {
	const results = await batchIterate(iterable, func, options);
	return mergeObjects(results);
};
