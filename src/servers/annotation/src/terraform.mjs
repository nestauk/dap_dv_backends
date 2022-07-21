import { terraformServerAddress } from "./config.mjs";

export const stateEndpoint = new URL('state', terraformServerAddress);
export const annotationEndpoint = new URL('annotate', terraformServerAddress);

const request = async (path, method='GET') => {
	const endpoint = new URL(path, terraformServerAddress);
	const response = await fetch(endpoint, { method });
	return response.json();
};

export const status = () => request('status');
export const teardown = () => request('teardown');
export const state = () => request('state');
