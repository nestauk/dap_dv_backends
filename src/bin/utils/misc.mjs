import {
	cancel,
	log,
	isCancel,
	text
} from '@clack/prompts';
import {isTrimmedNotEmpty, isNotNil} from '@svizzle/utils';
import * as _ from 'lamb';

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export const makeRenameKeysWithMap = keysMap => _.pipe([
	_.pairs,
	_.mapWith(([k, v]) => [keysMap[k] || k, v]),
	_.fromPairs
]);

export const allAreNonEmptyStrings = _.pipe([
	_.values,
	_.every(_.allOf([
		isNotNil,
		isTrimmedNotEmpty
	]))
])

export const promptText = async (message, initialValue) => {
	const value = await text({message, initialValue});

	if (isCancel(value)) {
		cancel('Operation cancelled');
		process.exit(0);
	}

	return value;
}

export const logErrorAndExit = items => {
	try {
		const message = items.map(item => (
			typeof item === 'string'
				? item
				: item instanceof Error
					? item.stack || item.message
					: stringify(item)
		)).join(' ');

		log.error(message);
	}
	catch (error) {
		console.error(error);
	}
	process.exit(1);
}

const getStatus = async url => {
	try {
	  const response = await fetch(url);
	  return {url, status: response.status};
	} catch (error) {
	  return {url, status: -1};
	}
};

export async function getUrlStatuses (urls, interval) {
	let count = 0;
	while (true) {
		const statuses = await Promise.all(urls.map(url => getStatus(url)));
		if (_.everyIn(statuses, _.hasKeyValue('status', 200))) {
			return true;
		}
		process.stdout.write(`Attempt ${count++}...\r`);
		await sleep(interval);
	}
}
