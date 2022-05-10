import { strict as assert } from 'assert';
import * as fs from 'fs';

import { saveObj } from '@svizzle/file';
import { mergeWithSum, getTruthyValuesKeys } from '@svizzle/utils';
import * as cliProgress from 'cli-progress';
import * as _ from 'lamb';

import { arxliveCopy } from 'conf/config.mjs';
import { getEntityDetails, isDisambiguation } from 'dbpedia/requests.mjs';
import { scroll, clearScroll } from 'es/search.mjs';
import { batch } from 'util/array.mjs';
import { stringify } from 'querystring';

const FILE_DBPEDIA_URIS = 'data/ai_map/test/URI_titles.json';
const FILE_DETAILS = 'data/ai_map/test/URIs_details.json';
const FILE_MISSING_ABSTRACTS = 'data/ai_map/test/missing_abstracts.json';
const FILE_MISSING_DERIVED_FROM = 'data/ai_map/test/missing_derived_from.json';
const FILE_MISSING_THUMBNAIL = 'data/ai_map/test/missing_image.json';
const FILE_THUMBNAIL_404s = 'data/ai_map/test/image_404s.json';
const FILE_THUMBNAIL_EXTENSION_COUNTS = 'data/ai_map/test/image_extension_counts.json';
const FILE_DISAMBIGUATION_ENTITIES = 'data/ai_map/test/disambiguation_entities.json';

async function batchIterate(iterable, func, { concat=true }={}) {
	const bar = new cliProgress.Bar(null, cliProgress.Presets.rect);
	bar.start(iterable.length, 0);
	const batches = batch(iterable, 100);
	let results = [];
	for (const batch_ of batches) {
		// eslint-disable-next-line no-await-in-loop
		const result = await func(batch_);
		results = concat ? [...results, ...result] : [...results, result];
		bar.increment(batch_.length);
	}

	bar.stop();
	return results;
}

// titles are the Wiki pages with whitepace replaced with underscores, so
// World War 1 => World_War_1
// We use this terminology to stay consistent with Wikimedia's API, where the
// this parameter is also named title.
// https://api.wikimedia.org/wiki/API_reference/Core/Pages/Get_page
const getWikimediaTitles = async () => {
	if (fs.existsSync(FILE_DBPEDIA_URIS)) {
		return JSON.parse(
			fs.readFileSync(FILE_DBPEDIA_URIS, { encoding: 'utf-8' })
		);
	}
	const scroller = scroll(arxliveCopy, 'ai_map', { size: 10000, });
	const uriCounts = {};
	for await (let page of scroller) {
		_.forEach(page.hits.hits, doc => {
			_.forEach(doc._source.dbpedia_entities, ({ URI }) => {
				const title = URI.replace('http://dbpedia.org/resource/', '');
				uriCounts[title] = uriCounts[title] ? uriCounts[title] + 1 : 1;
			});
		});
	}
	clearScroll();

	const titles = _.keys(uriCounts);
	const saveURIs = saveObj(FILE_DBPEDIA_URIS, 4);
	saveURIs(titles);

	return titles;
};

describe('aiMapDBpediaEntities', () => {

	let titles;
	before(async function () {
		this.timeout(0);
		titles = await getWikimediaTitles();
	});
	describe('URIs', () => {
		it('should contain some data', () => {
			assert(titles.length !== 0);
		});
		it('should succesfully retrieve details', async function () {
			this.timeout(0);
			const results = await batchIterate(
				titles,
				getEntityDetails
			);
			saveObj(FILE_DETAILS, 4)(results);
		});
	});
	describe('dataQuality', () => {
		it('retrieve the number of missing details', function() {
			const details = JSON.parse(fs.readFileSync(FILE_DETAILS));
			const counts = _.reduce(details, (acc, curr) => {
				const ones = _.mapValues(curr, _.always(1));
				return mergeWithSum(acc, ones);
			}, {});
			const normalisedCounts = _.mapValues(counts, count => count / details.length);
			console.log(normalisedCounts);
			const save = (path, object) => saveObj(path, 4)(object);
			const filterToTitles = predicate =>
				_.map(_.filter(details, predicate), _.getKey('URI'));

			save(FILE_MISSING_ABSTRACTS, filterToTitles(d => !d.abstract));
			save(FILE_MISSING_DERIVED_FROM, filterToTitles(d => !d.derivedFrom));
			save(FILE_MISSING_THUMBNAIL, filterToTitles(d => !d.imageURL));
		});
		it('counts the different types of imageURIs using the file extension', function() {
			const details = JSON.parse(fs.readFileSync(FILE_DETAILS));
			const imageURLs = _.map(
				_.filter(details, d => d.imageURL),
				d => new URL(d.imageURL)
			);
			const extensions = _.map(imageURLs, t => t.pathname.split('.').slice(-1)[0]);
			const counts = _.count(extensions, _.identity);
			console.log(counts);
			saveObj(FILE_THUMBNAIL_EXTENSION_COUNTS, 4)(counts);
		});
		it('examines the response status for image URLs', async function() {
			this.timeout(0);

			const details = JSON.parse(fs.readFileSync(FILE_DETAILS));
			const imageURLs = _.map(
				_.filter(details, d => d.imageURL),
				d => new URL(d.imageURL)
			);
			const results = await batchIterate(
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

			const counts = _.count(results, _.getKey('status'));
			const notFounds = _.filter(results, r => r.status === 404);

			saveObj(FILE_THUMBNAIL_404s, 4)(_.map(notFounds, r => r.url));
			console.log(counts);

		});
		it('counts the number of entities that are Wikipedia disambiguation pages', async function() {
			this.timeout(0);

			const bar = new cliProgress.Bar(null, cliProgress.Presets.rect);
			bar.start(titles.length, 0);

			const batches = batch(titles, 100);
			let results = {};

			for (const batchOfTitles of batches) {
				// eslint-disable-next-line no-await-in-loop
				const resultBatch = await isDisambiguation(batchOfTitles);
				results = { ...results, ...resultBatch };
				bar.increment(batchOfTitles.length);
			}

			const disambiguations = getTruthyValuesKeys(results);

			const stats = {
				count: disambiguations.length,
				proportion: disambiguations.length / titles.length
			};
			const saveDisambiguations = saveObj(FILE_DISAMBIGUATION_ENTITIES, 4);
			saveDisambiguations({
				stats,
				entities: disambiguations
			});
			bar.stop();
			console.log(stringify(stats));
		});
	});
});

