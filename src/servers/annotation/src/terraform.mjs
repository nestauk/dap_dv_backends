/* eslint-disable no-await-in-loop */
import { stringify } from "@svizzle/utils";
import { terraformServerAddress } from "./config.mjs";
import { sleep } from 'util/time.mjs';

export const stateEndpoint = new URL('state', terraformServerAddress);
export const annotationEndpoint = new URL('annotate', terraformServerAddress);

const parseResponse = response => {
	const contentType = response.headers.get('content-type');
	if (contentType && contentType.indexOf("application/json") !== -1) {
		return response.json();
	}
	return response;
};
const request = async path => {
	const endpoint = new URL(path, terraformServerAddress);
	const response = await fetch(endpoint);
	return parseResponse(response);
};

export const status = () => request('status');
export const teardown = () => request('teardown');
export const state = () => request('state');

export const provision = async workers => {

	const endpoint = new URL('provision', terraformServerAddress);
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

console.log(await status());
