/* eslint-disable no-await-in-loop */
import { stringify } from "@svizzle/utils";
import { fetch } from 'undici';

import { sleep } from 'dap_dv_backends_utils/util/time.mjs';

import { provisionEndpoint } from "../config.mjs";


export const stateEndpoint = new URL('state', provisionEndpoint);
export const annotationEndpoint = new URL('annotate', provisionEndpoint);

const parseResponse = response => {
	const contentType = response.headers.get('content-type');
	if (contentType && contentType.indexOf("application/json") !== -1) {
		return response.json();
	}
	return response;
};
const request = async path => {
	const endpoint = `${provisionEndpoint}/${path}`;
	const response = await fetch(endpoint);
	return parseResponse(response);
};

export const status = () => request('status');
export const teardown = () => request('teardown');
export const state = () => request('state');

export const provision = async workers => {

	const endpoint = `${provisionEndpoint}/create`;
	const headers = { 'Content-Type': 'application/json' };
	const body = stringify({ workers });
	const response = await fetch(endpoint, { method: 'POST', headers, body });
	return new Promise(async (resolve, reject) => {
		const {status: code} = parseResponse(response);
		if (code !== 200) {
			reject(new Error(
				`Provision request returned a response code of ${code}`
			));
		}
		let { status: provisioningStatus } = await status();
		while (provisioningStatus === 'scheduling') {
			await sleep(15000);
			({ status: provisioningStatus } = await status());
		}
		resolve(provisioningStatus);
	});
};
