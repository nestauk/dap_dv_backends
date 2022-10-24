import { isIterableNotEmpty } from '@svizzle/utils';
import * as _ from 'lamb';

import { arxliveCopy, confidenceScores } from 'conf/config.mjs';
import { get } from 'es/document.mjs';
import { scroll, clearScroll } from 'es/search.mjs';
import { bulkRequest } from 'es/bulk.mjs';

import * as serverConfig from '../config.mjs';

/* utils */
const getEntities = _.getPath('_source.dbpedia_entities');

const getValidEntities = entities => {

	const lowConfidenceScores = _.filter(
		confidenceScores,
		c => c <= serverConfig.confidenceThreshold
	);

	const entitiesAtConfidence = _.map(
		lowConfidenceScores,
		confidence => _.filter(entities, e => e.confidence >= confidence)
	);
	const nonEmptyEntities = _.filter(entitiesAtConfidence, e => e.length);
	const validEntities = nonEmptyEntities[nonEmptyEntities.length-1];
	return validEntities;
};

export const getOrgWithValidEntities = _.updatePath(
	'_source.dbpedia_entities',
	getValidEntities
);

const getOrgMeanConfidence = _.pipe([
	getEntities,
	_.pluck('confidence'),
	_.mean,
]);

const getOrgVarianceOf = mean =>
	_.pipe([
		getEntities,
		_.reduceWith(
			(v, entity) => v + Math.pow(entity.confidence - mean, 2),
			0
		),
	]);

const augmentOrg = org => {
	const meanConfidence = getOrgMeanConfidence(org);
	const variance = getOrgVarianceOf(meanConfidence)(org);
	const std = Math.pow(variance, 0.5);

	return { ...org, meanConfidence, variance, std };
};

const sortAugmentedOrgs = _.sortWith([
	_.getKey('meanConfidence'),
	_.sorterDesc(_.getKey('std')),
]);

const getSortedAugmentedOrgs = _.pipe([
	_.mapWith(getOrgWithValidEntities),
	_.filterWith(v => v._source.dbpedia_entities.length !== 0),
	_.mapWith(augmentOrg),
	sortAugmentedOrgs,
]);

/* setup */

const getOrgs = async () => {
	const scroller = scroll(arxliveCopy, 'ai_map', { size: 1000 });

	let orgs = [];
	let page;
	for await (page of scroller) {
		orgs.push(...page.hits.hits);
	}

	// empty index means no page is returned
	if (page) {
		clearScroll(arxliveCopy, page._scroll_id);
	}
	return orgs;
};

const orgs = await getOrgs();
const nonEmptyOrgs = _.filter(orgs, _.pipe([getEntities, isIterableNotEmpty]));
const sortedAugmentedOrgs = getSortedAugmentedOrgs(nonEmptyOrgs);
export const sortedOrgIds = _.map(sortedAugmentedOrgs, _.getKey('_id'));

export const getNextOrgIdsForUser = (documentsEvaluated, chunkSize = 100) => {
	const nextOrgs = _.difference(sortedOrgIds, documentsEvaluated);
	return nextOrgs.slice(0, chunkSize);
};

export const saveEvaluation = async (userId, orgEsId, topics) => {
	const documents = _.values(
		_.mapValues(topics, (data, URI) => ({
			data: { orgEsId, userId, URI, ...data },
		}))
	);
	const { code } = await bulkRequest(
		arxliveCopy,
		serverConfig.devIndex,
		documents,
		'index'
	);

	return code;
};

export const getOrgById = orgId =>
	get(arxliveCopy, serverConfig.mainIndex, orgId);
