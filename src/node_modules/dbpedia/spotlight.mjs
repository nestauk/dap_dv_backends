import * as cliProgress from 'cli-progress';
import * as _ from 'lamb';

import { getLength, mergeWithMerge, stringify } from '@svizzle/utils';

import fetch from 'node-fetch';

import { defaultMapping, metaDataMapping } from 'conf/mappings.mjs';
import { count, updateMapping } from 'es/index.mjs';
import { update } from 'es/update.mjs';
import { scroll, clearScroll } from 'es/search.mjs';
import { bulkRequest } from 'es/bulk.mjs';
import { batch } from 'util/array.mjs';
import { logger } from 'logging/logging.mjs';
import { promisesHandler } from 'util/promises.mjs';
import { spotlightEndpoint, confidenceValues } from 'conf/config.mjs';

/**
 * The resource object that the spotlight tool responds with. Each resource corresponds to a DBpedia URI.
 * @typedef SpotlightResource
 * @type {Object}
 * @property {string} @URI - the Unique Resource Identifier for this resource.
 * @property {number} @support - the support for the annotated resource (see {@link SpotlightAnnotation})
 * @property {string} @types - the types the resource belongs to in the ontology.
 * @property {string} @surfaceForm - the original string used to produce this resource.
 * @property {number} @offset - the index at which the surface form was found in the provided text.
 * @property {number} @similarityScore - cosine similarity between the context vectors and the context surrounding the surface form.
 * @property {number} @percentageOfSecondRank - the relative difference in topic score between the first and the second ranked resource.
 */

/**
 * The annotation response. This object is the response to a call made when annotating a piece of text.
 * @typedef SpotlightAnnotation
 * @type {Object}
 * @property {string} text - text to be annotated.
 * @property {string} confidence - confidence score for disambiguation / linking.
 * @property {number} support - how prominent is this entity in Lucene Model, i.e. number of inlinks in Wikipedia
 * @property {string} types - types filter (Eg.DBpedia:Place).
 * @property {string} sparql - SPARQL filtering
 * @property {string} policy - (whitelist) select all entities that have the same type; (blacklist) - select all entities that have not the same type.
 * @property {SpotlightResource[]} Resources - the resources found for the supplied text.
 */

/**
 * @function castAnnotation
 * @description the Spotlight API returns the annotations with certan values cast as strings.
 * This function recasts the values back to their appropriate types.
 * @param {SpotlightAnnotation} annotation
 * @returns the Spotlight annotation, correctly parsed and casted
 */
const castAnnotation = annotation => {

	// FIXME: Use mapping to determine which types to cast
	const Resources = annotation.Resources
		? annotation.Resources.map(r => {
			return {
				...r,
				'@support': parseInt(r['@support'], 10),
				'@offset': parseFloat(r['@offset'], 10),
				'@similarityScore': parseFloat(r['@similarityScore'], 10),
				'@percentageOfSecondRank': parseFloat(
					r['@percentageOfSecondRank'], 10
				),
			};
		})
		: null;
	return {
		...annotation,
		'@confidence': parseInt(100 * parseFloat(annotation['@confidence']), 10),
		'@support': parseInt(annotation['@support'], 10),
		Resources,
	};
};

/**
 * @function annotate
 * @description Returns an annotation object for the specified inputs.
 * @param {string} text - Text to annotate
 * @param {float} confidence - Confidence with which to annotate
 * @param {Object} [options] - Options object for the annotation process
 * @param {string} [options.endpoint] - Endpoint url where the Spotlight process runs. Defaults to the Docker container running on Nesta's EC2 instance.
 * @returns {SpotlightAnnotation} Spotlight annotation for given input paramaters
 */
export const annotate = async (
	text,
	confidence,
	{ endpoint = spotlightEndpoint } = {}
) => {
	const url = new URL(endpoint);
	const body = `text=${encodeURIComponent(text)}&confidence=${confidence}`;
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'content-type': 'application/x-www-form-urlencoded',
		},
		body,
	});
	if (!response.ok) {
		throw new Error(`Annotation failed\nResponse: ${stringify(response)}`);
	}
	const annotation = await response.json();
	return castAnnotation(annotation);
};

/**
 * For our purposes, we simplify the {@link SpotlightResource} object.
 * All properties below are the exact same.
 * @typedef ReducedResource
 * @type {Object}
 * @property {string} URI - the Unique Resource Identifier for this resource.
 * @property {string} surfaceForm - the original string used to produce this resource.
 * @property {number} similarityScore - cosine similarity between the context vectors and the context surrounding the surface form.
 * @property {number} percentageOfSecondRank - the relative difference in topic score between the first and the second ranked resource.
 */

/**
 *
 * @typedef ParsedAnnotation
 * @type {Object}
 * @property {ReducedResource[]} results - an array of simplified results.
 * @property {number} confidence - the confidence at which these results were annotated.
 */

/**
 * @function parseAnnotationResults
 * @description this function takes an array of Annotation objects and simplifies them.
 * @param {SpotlightAnnotation} spotlightAnnotation - an object returned by {@link annotate}
 * @returns {ParsedAnnotation} parsed Annotation.
 */
export const parseAnnotationResults = spotlightAnnotation =>
	spotlightAnnotation.Resources
		? _.flatMap(spotlightAnnotation.Resources, result => ({
			confidence: spotlightAnnotation['@confidence'],
			URI: result['@URI'],
			surfaceForm: result['@surfaceForm'],
			similarityScore: result['@similarityScore'],
			percentageOfSecondRank: result['@percentageOfSecondRank'],
		}))
		: [];

/**
 * The final form of resource, this is the same as {@link ReducedResource}, however
 * the confidence property has been added to the objects values.
 * All properties below are the exact same.
 * @typedef DBpediaEntity
 * @type {Object}
 * @property {string} URI - the Unique Resource Identifier for this resource.
 * @property {string} surfaceForm - the original string used to produce this resource.
 * @property {number} similarityScore - cosine similarity between the context vectors and the context surrounding the surface form.
 * @property {number} percentageOfSecondRank - the relative difference in topic score between the first and the second ranked resource.
 * @property {number} confidence - the highest confidence at which this resource could be found. This means that all annotations performed at a lower confidence than the one given here will also produce this annotation.
 */

/**
 * @function reduceAnnotationResults
 * @description Maps {@link ParsedAnnotation} objects using their confidedence.
 * @param {Object.<string, ParsedAnnotation>} parsedAnnotationByConfidence - an object where {@link ReducedResource} objects are mapped by the condience with which they were produced.
 * @returns {DBpediaEntity[]} - a list of annotated entities.
 */
export const reduceAnnotationResults = spotlightTerms => {

	const reduceTerms = _.mapValuesWith(
		_.reduceWith(
			(acc, curr) => curr.confidence > acc.confidence ? curr : acc,
		)
	);

	const countDuplicatesOf = confidence => _.mapValuesWith(
		_.pipe([
			_.filterWith(_.hasKeyValue('confidence', confidence)),
			getLength,
			value => ({ [`duplicates_${confidence}`]: value })
		]),
	);

	const reduceAndCountDuplicates = confidences => _.pipe([
		_.groupBy(_.getKey('URI')),
		_.collect([
			reduceTerms,
			..._.map(confidences, countDuplicatesOf)
		]),
		_.reduceWith(mergeWithMerge),
		_.values
	]);

	const reduceAndCountDuplicatesOf = reduceAndCountDuplicates([10, 60]);
	const finalResults = reduceAndCountDuplicatesOf(spotlightTerms);
	return finalResults;
};

export const generateMetaData = (reducedTerms, spotlightResults) => {

	const metaReducer = (prev, curr) => {
		return {
			entities_count: prev.entities_count + 1,
			confidence_avg: prev.confidence_avg + curr.confidence,
			confidence_max: curr.confidence > prev.confidence_max ? curr.confidence : prev.confidence_max,
			confidence_min: curr.confidence < prev.confidence_min ? curr.confidence : prev.confidence_min,
			dupes_10_count: prev.dupes_10_count + (curr.duplicates_10 > 1 ? 1 : 0),
			dupes_60_count: prev.dupes_60_count + (curr.duplicates_60 > 1 ? 1 : 0),
			confidence_counts: {
				...prev.confidence_counts,
				[curr.confidence]: prev.confidence_counts[curr.confidence]
					? prev.confidence_counts[curr.confidence] + 1
					: 1,
			},
		};
	};

	const intialMetaData = {
		entities_count: 0,
		confidence_avg: 0,
		confidence_max: 0,
		confidence_min: 100,
		dupes_10_count: 0,
		dupes_60_count: 0,
		confidence_counts: {},
	};
	const reducedMetaData = reducedTerms.reduce(metaReducer, intialMetaData);
	const metadata = {
		...reducedMetaData,
		confidence_avg: reducedMetaData.confidence_avg / reducedMetaData.entities_count,
		dupes_10_ratio: reducedMetaData.dupes_10_count / reducedMetaData.entities_count,
		dupes_60_ratio: reducedMetaData.dupes_60_count / reducedMetaData.entities_count
	};
	return metadata;
};

export const annotateText = async (
	text,
	{ endpoint = spotlightEndpoint, includeMetaData = null } = {}
) => {
	const spotLightPromises = _.map(
		confidenceValues,
		confidence => annotate(text, confidence, { endpoint, })
	);

	/** @type {SpotlightAnnotation[]} */
	const spotlightResults = (await Promise.all(spotLightPromises)).filter(
		r => 'Resources' in r
	);

	/** @type {ParsedAnnotation[]} */
	const reducedTerms = _.pipe([
		_.mapWith(parseAnnotationResults),
		_.flatten,
		reduceAnnotationResults
	])(spotlightResults);

	const metadata =
		includeMetaData && generateMetaData(reducedTerms, spotlightResults);

	return {
		annotations: reducedTerms,
		...metadata && { metadata },
	};
};

export const annotateArray = async (texts, endpoint) => {
	const body = JSON.stringify({ texts });
	const headers = { 'Content-Type': 'application/json' };
	const result = await fetch(endpoint, { body, headers, method: 'POST' });
	const annotations = await result.json();
	return annotations;
};

/**
 * Results for the higher level process of annotating an ElasticSearch document.
 * @typedef documentAnnotationResult
 * @type {Object}
 * @property {Object} document - the ElasticSearch document supplied for annotation.
 * @property {DBpediaEntity[]} annotations - a list of annotations for the supplied document.
 */

/**
 * @function annotateDocument
 * @description takes an Elastic search document from Arxlive and annotates the abstract_article field.
 * @param {Object} doc - an ElasticSearch document from the Arxlive domain.
 * @param {string} field - the field of the docment to use as text for the annotation
 * @param {string} endpoint - the endpoint pointing to the Spotlight REST API.
 * @return {documentAnnotationResult} - the annotations for this document
 */
export const annotateDocument = async (
	doc,
	field,
	{ includeMetaData = null, endpoint = spotlightEndpoint } = {}
) => {
	const annotationData = await annotateText(doc._source[field], { endpoint, includeMetaData });
	return { id: doc._id, ...annotationData };
};

/**
 * @function uploadAnnotatedDocument
 * @description abstracts process of uploading document, to avoid uploading empty annotations
 * @param {Object} annotations - the dbpedia annotations provided by {@link annotatedDocument}
 * @param {string} id - id of document to update
 * @param {string} domain - domain on which to upload
 * @param {*} index - index on which to upload
 * @returns {Promise} a promise indicating status of upload process
 */
export const uploadAnnotatedDocument = (
	{ annotations, id, metadata },
	fieldName,
	domain,
	index
) => {

	// no point in uploading if the doc/payload is empty
	if (Object.keys(annotations).length === 0) {
		return Promise.resolve();
	}
	return update(domain, index, id, {
		[fieldName]: annotations,
		...metadata && { [`${fieldName}_metadata`]: metadata },
	});
};

const annotateBatch = async (
	docs,
	fieldName,
	newFieldName,
	endpoint,
	includeMetaData
) => {

	const toBulkFormat = doc => ({
		'_id': doc._id,
		data: {
			[newFieldName]: doc.annotations,
			...doc.metadata && { [`${newFieldName}_metadata`]: doc.metadata }
		}
	});

	// filter out docs with empty text
	const nonEmptyDocs = docs.filter(doc => doc._source[fieldName]);
	const emptyDocs = docs.filter(doc => !doc._source[fieldName]);
	_.forEach(
		emptyDocs,
		doc => logger.warn(`Empty field: ${JSON.stringify(doc)}`)
	);
	const texts = _.map(nonEmptyDocs, _.getPath(`_source.${fieldName}`));
	const results = await annotateArray(texts, endpoint);
	const inputs = _.map(
		_.zip(nonEmptyDocs, results),
		([doc, data]) => ({ ...doc, ...data })
	);
	const [annotations, empties] = _.partition(
		inputs,
		doc => doc.annotations.length !== 0
	);

	if (empties.length) {
		_.forEach(
			empties,
			doc => logger.warn(`Empty doc: ${JSON.stringify(doc)}`)
		);
	}
	const bulkFormat = _.map(annotations, toBulkFormat);
	return bulkFormat;
};

const initialiseIndexProgressBar = async (domain, index, batchSize) => {
	const bar = new cliProgress.SingleBar(
		{ etaBuffer: batchSize * 10 },
		cliProgress.Presets.shades_classic
	);
	const totalDocuments = await count(domain, index);
	bar.start(totalDocuments, 0);
	return bar;
};

const generateMappingPayload = (name, includeMetaData) => {
	const mappingPayload = {
		properties: {
			[name]: defaultMapping,
			...includeMetaData && {
				[`${name}_metadata`]: metaDataMapping,
			},
		},
	};
	return mappingPayload;
};

export const annotateIndex = async (
	domain,
	index,
	endpoint,
	field,
	{
		batchSize=50,
		groupSize=4,
		includeMetaData=true,
		newField='dbpedia_entities',
		pages='all',
		pageSize=10000,
		progress=null,
	}={}
) => {

	const mappingPayload = generateMappingPayload(newField, includeMetaData);
	await updateMapping(domain, index, { payload: mappingPayload });

	const bar = progress
		? progress
		: await initialiseIndexProgressBar(domain, index, batchSize);
	const scroller = scroll(domain, index, { size: pageSize, pages });

	let page;
	for await (page of scroller) {
		const batches = batch(page.hits.hits, batchSize);
		const groups = batch(batches, groupSize);
		const updates = [];
		for await (const group of groups) {
			// eslint-disable-next-line no-await-in-loop
			const promises = _.map(group, docs =>
				annotateBatch(docs, field, newField, endpoint, includeMetaData)
			);
			const resolvedPromises = await promisesHandler(promises);
			const annotations = _.flatten(resolvedPromises);
			updates.push(annotations);
			bar.increment(_.flatten(group).length);
		};
		const flattenedUpdates = _.flatten(updates);

		// this is likely to be too big, so separate by default size
		const batchedUpdates = batch(flattenedUpdates, 500);
		for await (const update_ of batchedUpdates) {
			await bulkRequest(
				domain,
				index,
				update_,
				'update',
				{ error: false, refresh: 'wait_for' }
			);
		}
	}

	bar.stop();

	if (page) {
		clearScroll(domain, page._scroll_id);
	}

};

export const annotateRequest = async request => {

	await annotateIndex(
		request.domain,
		request.index,
		request.annotationEndpoint,
		request.field,
		request,
	);
	return request;
};
