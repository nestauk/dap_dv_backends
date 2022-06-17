import { saveObj } from '@svizzle/file';
import { mergeWithSum, getTruthyValuesKeys } from '@svizzle/utils';
import * as _ from 'lamb';
import { fetch } from 'undici';

import { getEntityDetails, isDisambiguation } from 'dbpedia/requests.mjs';
import { getEntities } from 'es/entities.mjs';
import { batchIterate } from 'util/array.mjs';

const FILE_ENTITY_TITLES = 'data/ai_map/outputs/entity_titles.json';
const FILE_ENTITY_DETAILS = 'data/ai_map/outputs/entity_details.json';
const FILE_ENTITY_COUNTS = 'data/ai_map/quality/entities/entity_counts.json';
const FILE_MISSING_ABSTRACTS = 'data/ai_map/quality/entities/missing_abstracts.json';
const FILE_MISSING_DERIVED_FROM = 'data/ai_map/quality/entities/missing_derived_from.json';
const FILE_MISSING_THUMBNAIL = 'data/ai_map/quality/entities/missing_image.json';
const FILE_IMAGE_STATUS = 'data/ai_map/quality/entities/image_status.json';
const FILE_IMAGE_404s = 'data/ai_map/quality/entities/image_404s.json';
const FILE_IMAGE_EXTENSION_COUNTS = 'data/ai_map/quality/entities/image_extension_counts.json';
const FILE_DISAMBIGUATION_ENTITIES = 'data/ai_map/quality/entities/disambiguation_entities.json';

const save = (path, object) => saveObj(path, 4)(object);
const addStats = (entities, all) => {
	const stats = {
		count: entities.length,
		proportion: entities.length / all.length
	};
	return {
		stats,
		entities
	};
};

const main = async () => {

	// Get Titles for all entities annotated on the ai_map index
	console.log('[+] Getting Entity Titles');
	const titles = await getEntities('ai_map');
	save(FILE_ENTITY_TITLES, titles);

	// Get details for all DBpedia entities using DBpedia SPARQL endpoint
	console.log('[+] Getting Entity Details');
	const details = await batchIterate(titles, getEntityDetails);
	save(FILE_ENTITY_DETAILS, details);

	// Get the count statistics for the details
	console.log('[+] Calculating count statistics');
	const counts = _.reduce(details, (acc, curr) => {
		const ones = _.mapValues(curr, _.always(1));
		return mergeWithSum(acc, ones);
	}, {});
	const normalisedCounts = _.mapValues(counts, count => count / details.length);
	save(FILE_ENTITY_COUNTS, normalisedCounts);

	// Get the count statistics for missing details
	console.log('[+] Calculating missing statistics');
	const filterToTitles = predicate =>
		_.map(_.filter(details, predicate), _.getKey('URI'));
	save(
		FILE_MISSING_ABSTRACTS,
		addStats(filterToTitles(d => !d.abstract), titles)
	);
	save(
		FILE_MISSING_DERIVED_FROM,
		addStats(filterToTitles(d => !d.derivedFrom), titles)
	);
	save(
		FILE_MISSING_THUMBNAIL,
		addStats(filterToTitles(d => !d.imageURL), titles)
	);

	const imageURLs = _.map(
		_.filter(details, d => d.imageURL),
		d => new URL(d.imageURL)
	);

	// Count image extensions
	console.log('[+] Counting image file types by extension');
	const extensions = _.map(imageURLs, t => t.pathname.split('.').slice(-1)[0]);
	const extensionCounts = _.count(extensions, _.identity);
	saveObj(FILE_IMAGE_EXTENSION_COUNTS, extensionCounts);

	// Get the image status by fetching using imageURL
	console.log('[+] Fetching images and saving response status');
	const imageURLStatus = await batchIterate(
		imageURLs,
		async batch_ => {
			const responses = await Promise.all(
				_.map(batch_, t => fetch(t))
			);
			return _.map(
				_.zip(batch_, responses),
				([u, r]) => ({ url: u.href, status: r.status })
			);
		}
	);

	const imageURLStatusCounts = _.count(imageURLStatus, _.getKey('status'));
	const notFounds = _.filter(imageURLStatus, r => r.status === 404);

	save(FILE_IMAGE_404s, addStats(_.map(notFounds, r => r.url), titles));
	save(FILE_IMAGE_STATUS, imageURLStatusCounts);

	const disambiguationStatus = await batchIterate(
		titles,
		isDisambiguation,
		{ concat: false}
	);
	const flattened = _.reduce(
		disambiguationStatus,
		(acc, curr) => ({ ...acc, ...curr })
	);
	const disambiguations = getTruthyValuesKeys(flattened);
	save(FILE_DISAMBIGUATION_ENTITIES, addStats(disambiguations, details));
};

await main();

