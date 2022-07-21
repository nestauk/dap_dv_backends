import * as path from 'path';
import { fileURLToPath } from 'url';

import * as _ from 'lamb';

import { annotationEndpoint } from './config.mjs';
import * as terraform from './terraform.mjs';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const testSpotlightEnpoint = async endpoint => {

	const url = new URL(endpoint);
	const text = 'This is some text with the words Semantic Web in it.';
	const confidence = 0.6;
	url.searchParams.append('text', text);
	url.searchParams.append('confidence', confidence);

	const response = await fetch(url);
	return response.ok;
};

export const getStatus = async () => {

	const statusResponse = await terraform.status();
	if (statusResponse.status === 'up') {
		statusResponse.status = await testSpotlightEnpoint(annotationEndpoint)
			? 'ready'
			: 'provisioning';
	}
	return statusResponse;
};
