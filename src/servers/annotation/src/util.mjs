import { promises as fs } from 'fs';
import * as path from 'path';
import * as _ from 'lamb';
import { fileURLToPath } from 'url';

import { isEqualTo } from '@svizzle/utils';

import { annotate } from 'dbpedia/spotlight.mjs';
import { annotationEndpoint } from './config.mjs';
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const spotlightResponse = JSON.parse(
	await fs.readFile(path.join(__dirname, '../data', 'spotlightResponse.json'))
);

export const testSpotlightEnpoint = async endpoint => {

	const text = spotlightResponse['@text'];
	const confidence = parseInt(spotlightResponse['@confidence'], 10) / 100;
	const result = await annotate(text, confidence, endpoint);
	const compare = isEqualTo(spotlightResponse);

	return compare(result);
};
