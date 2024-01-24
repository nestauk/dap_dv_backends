/* eslint-disable no-await-in-loop */
import * as path from 'path';
import { fileURLToPath } from 'url';

import * as _ from 'lamb';
import { fetch } from 'undici';

import { sleep } from 'dap_dv_backends_utils/util/time.mjs';

import { state } from './state.mjs';


export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const endpointToIp = endpoint => endpoint.split('/')[2].split(':')[0];

const testAnnotationNodeEndpoint = async endpoint => {
	const url = new URL(endpoint);
	const text = 'This is some text with the words Semantic Web in it.';
	const confidence = 0.6;
	url.searchParams.append('text', text);
	url.searchParams.append('confidence', confidence);
	let response;
	try {
		response = await fetch(url);
	} catch {
		return false;
	}
	return response.ok;
};

export const annotationNodeEndpointPromise = endpoints => {
	const interval = 1000 * 15;
	let timeout = 1000 * 60 * 20; // if longer than 20 mins, somethings wrong
	return new Promise(async (resolve, reject) => {
		let ready = false;
		do {
			await sleep(interval);
			const promises = _.map(endpoints, e => testAnnotationNodeEndpoint(e));
			const results = await Promise.all(promises);
			console.log(results);
			ready = _.everyIn(results, _.identity);
			timeout -= interval;
			if (timeout <= 0) {
				reject(new Error('At least one of the annotation node servers has timed out'));
			}
		} while (!ready);
		resolve();
	});
};

// takes Terraform state object as input
export const getIps = _.pipe([
	_.getKey('outputs'),
	_.pairs,
	_.filterWith(([k, __]) => k.endsWith('public_ip')),
	_.mapWith(([__, v]) => _.getIn(v, 'value')),
]);

export const getEndpoints = _.pipe([
	getIps,
	_.mapWith(ip => `http://${ip}:2222/rest/annotate`),
]);

export const getNewEndpoints = _.pipe([
	getEndpoints,
	_.filterWith(e => !state.endpoints.includes(e))
]);
