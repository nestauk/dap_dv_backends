import { promises as fs } from 'fs';

import { stringify } from '@svizzle/utils';
import * as _ from 'lamb';

import { dbo } from 'dbpedia/util.mjs';

const FILE_ONTOLOGY_JSON = 'data/dbpedia/ontology.json';

export const loadOntology = async (depth, { squash=false, fullURI=true }={}) => {
	const data = await fs.readFile(FILE_ONTOLOGY_JSON, { encoding: 'utf-8'});
	const changedURIs = fullURI
		? JSON.parse(data)
		: JSON.parse(data.replaceAll(dbo, ''));

	const selectAtDepth = _.pickIf(value => _.getIn(value, 'depth') <= depth);
	const ontology = squash
		? _.values(_.mapValues(selectAtDepth(changedURIs), _.getKey('class_')))
		: selectAtDepth(changedURIs);

	return ontology;
};
